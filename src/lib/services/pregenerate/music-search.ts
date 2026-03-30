/**
 * 音频 URL 搜索
 *
 * 根据歌名 + 歌手搜索网易云音乐，获取公网可访问的音频 URL。
 * 搜索失败时返回 null（调用方跳过该歌曲）。
 */

// ============================================================================
// 类型
// ============================================================================

export interface MusicSearchResult {
  /** 公网可访问的音频 URL */
  audioUrl: string
  /** 来源 */
  source: 'netease'
  /** 歌曲时长（秒） */
  duration: number
}

// ============================================================================
// 常量
// ============================================================================

const NETEASE_SEARCH_URL = 'https://music.163.com/api/search/get'
const NETEASE_SONG_URL = 'https://music.163.com/song/media/outer/url'

/** 过滤词：避免搜到现场版、伴奏版等 */
const EXCLUDE_KEYWORDS = ['伴奏', '纯音乐', 'DJ版', '现场', 'live', 'Remix', '翻唱']

// ============================================================================
// 实现
// ============================================================================

/**
 * 根据歌名+歌手搜索音频 URL
 *
 * @returns MusicSearchResult 或 null（搜索失败）
 */
export async function searchAudioUrl(title: string, artist: string): Promise<MusicSearchResult | null> {
  try {
    const songId = await searchNeteaseSong(title, artist)
    if (!songId) {
      console.warn(`[MusicSearch] No Netease result for "${title} - ${artist}"`)
      return null
    }

    const audioUrl = `${NETEASE_SONG_URL}?id=${songId}.mp3`

    // 验证 URL 可访问
    const valid = await verifyAudioUrl(audioUrl)
    if (!valid) {
      console.warn(`[MusicSearch] Audio URL not accessible for "${title}" (id=${songId})`)
      return null
    }

    return {
      audioUrl,
      source: 'netease',
      duration: 0,
    }
  } catch (err) {
    console.error(`[MusicSearch] Error searching "${title} - ${artist}":`, err instanceof Error ? err.message : err)
    return null
  }
}

// ---------------------------------------------------------------------------
// 内部方法
// ---------------------------------------------------------------------------

/**
 * 搜索网易云音乐歌曲 ID
 */
async function searchNeteaseSong(title: string, artist: string): Promise<number | null> {
  const keyword = `${title} ${artist}`
  const excludeFilter = EXCLUDE_KEYWORDS.map(k => `-${k}`).join(' ')

  const url = `${NETEASE_SEARCH_URL}?s=${encodeURIComponent(keyword + ' ' + excludeFilter)}&type=1&limit=5`

  const response = await fetch(url, {
    headers: {
      'Referer': 'https://music.163.com/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  // 解析搜索结果
  const songs = data?.result?.songs
  if (!Array.isArray(songs) || songs.length === 0) {
    return null
  }

  // 优先匹配歌名完全一致的结果
  const exactMatch = songs.find(
    (s: { name: string; artists?: Array<{ name: string }> }) => {
      const nameMatch = s.name?.includes(title) || title.includes(s.name)
      const artistMatch = !artist || s.artists?.some((a: { name: string }) =>
        a.name?.includes(artist) || artist.includes(a.name)
      )
      return nameMatch && artistMatch
    }
  )

  if (exactMatch) {
    return exactMatch.id
  }

  // 兜底：取第一个结果
  return songs[0]?.id ?? null
}

/**
 * 验证音频 URL 是否可访问
 */
async function verifyAudioUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    })

    // 网易云可能会返回 302 跳转到实际音频文件
    // HEAD 请求成功（200）或重定向（302）都算有效
    return response.ok || response.status === 302
  } catch {
    return false
  }
}
