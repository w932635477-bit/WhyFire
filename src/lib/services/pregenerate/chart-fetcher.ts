/**
 * 抖音热歌榜拉取
 *
 * 使用 Serper API 搜索抖音热歌榜，解析歌曲信息。
 * 搜索结果中的歌名/歌手提取依赖正则匹配，
 * 当解析失败时返回空列表（不阻塞预生成流程）。
 */

// ============================================================================
// 类型
// ============================================================================

export interface ChartSong {
  title: string
  artist: string
  rank: number
}

// ============================================================================
// 常量
// ============================================================================

const SERPER_API_KEY = process.env.SERPER_API_KEY || ''
const SERPER_BASE_URL = 'https://google.serper.dev'

/** 搜索 query 列表（多 query 提高覆盖率） */
const CHART_QUERIES = [
  '抖音热歌榜 最新 TOP10 歌曲名单',
  '抖音热门音乐排行榜 2026 最新',
  '抖音最火歌曲排行 TOP10',
]

/**
 * 从文本中提取歌名和歌手的正则模式
 * 匹配常见格式：
 *   1. 歌名 - 歌手
 *   2. 歌名（歌手）
 *   3. 《歌名》歌手
 *   4. 歌名 歌手
 */
const SONG_PATTERNS = [
  /[《「]([^》」]{1,30})[》」]\s*[—\-·]*\s*([^\s,，、|/]{1,20})/g,
  /(\d{1,2})[.、．)\s]+([^\s—\-·(（《]{1,30})\s*[—\-·]+\s*([^\s,，|/]{1,20})/g,
]

// ============================================================================
// 实现
// ============================================================================

/**
 * 拉取抖音热歌榜 TOP N
 */
export async function fetchDouyinChart(topN: number = 10): Promise<ChartSong[]> {
  if (!SERPER_API_KEY) {
    console.warn('[ChartFetcher] SERPER_API_KEY not set, skipping chart fetch')
    return []
  }

  const allSongs: ChartSong[] = []

  for (const query of CHART_QUERIES) {
    try {
      const songs = await searchAndParse(query, topN)
      allSongs.push(...songs)
    } catch (err) {
      console.warn(`[ChartFetcher] Query "${query}" failed:`, err instanceof Error ? err.message : err)
    }
  }

  // 去重（按歌名 + 歌手），保留 rank 最低的
  const seen = new Map<string, ChartSong>()
  for (const song of allSongs) {
    const key = `${song.title}|${song.artist}`.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, song)
    }
  }

  const unique = [...seen.values()]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, topN)

  console.log(`[ChartFetcher] Fetched ${unique.length} unique chart songs (${allSongs.length} total before dedup)`)
  return unique
}

// ---------------------------------------------------------------------------
// 内部方法
// ---------------------------------------------------------------------------

/**
 * 调用 Serper API 搜索并解析歌曲
 */
async function searchAndParse(query: string, topN: number): Promise<ChartSong[]> {
  const response = await fetch(`${SERPER_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      gl: 'cn',
      hl: 'zh-cn',
      num: 10,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`Serper API ${response.status}`)
  }

  const data = await response.json()
  return extractSongsFromResults(data, topN)
}

/**
 * 从 Serper 搜索结果中提取歌曲信息
 */
function extractSongsFromResults(
  data: { organic?: Array<{ title: string; snippet: string }>; knowledgeGraph?: { description?: string } },
  topN: number
): ChartSong[] {
  const songs: ChartSong[] = []
  const seen = new Set<string>()

  // 从 organic results 提取
  const items = data.organic || []
  for (const item of items) {
    const text = `${item.title} ${item.snippet || ''}`
    const extracted = parseSongList(text)

    for (const song of extracted) {
      const key = `${song.title}|${song.artist}`.toLowerCase()
      if (!seen.has(key) && song.title.length >= 2) {
        seen.add(key)
        songs.push(song)
      }
    }
  }

  // 从 knowledge graph 提取
  if (data.knowledgeGraph?.description) {
    const extracted = parseSongList(data.knowledgeGraph.description)
    for (const song of extracted) {
      const key = `${song.title}|${song.artist}`.toLowerCase()
      if (!seen.has(key) && song.title.length >= 2) {
        seen.add(key)
        songs.push(song)
      }
    }
  }

  return songs.slice(0, topN)
}

/**
 * 从一段文本中解析歌曲列表
 */
function parseSongList(text: string): ChartSong[] {
  const songs: ChartSong[] = []

  for (const pattern of SONG_PATTERNS) {
    // 重置正则 lastIndex
    pattern.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      // 根据匹配到的分组数判断格式
      if (match.length === 4) {
        // 格式: 序号. 歌名 - 歌手
        const rank = parseInt(match[1], 10)
        const title = match[2].trim()
        const artist = match[3].trim()
        if (rank >= 1 && rank <= 50 && title) {
          songs.push({ title, artist, rank })
        }
      } else if (match.length === 3) {
        // 格式: 《歌名》歌手
        const title = match[1].trim()
        const artist = match[2].trim()
        songs.push({ title, artist, rank: songs.length + 1 })
      }
    }
  }

  return songs
}
