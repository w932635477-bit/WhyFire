/**
 * 热门歌曲数据管理
 *
 * 管理用于预生成的歌曲列表。支持两种来源：
 * 1. 抖音热歌榜自动拉取（chart-fetcher + music-search）
 * 2. 手动添加歌曲（addManualSong）
 */

import { fetchDouyinChart, type ChartSong } from './chart-fetcher'
import { searchAudioUrl } from './music-search'

// ============================================================================
// 类型
// ============================================================================

export interface HotSong {
  id: string
  title: string
  artist: string
  audioUrl: string
  source: 'douyin-chart' | 'manual' | 'netease'
  /** 优先级：越小越高（排名越靠前） */
  priority: number
  active: boolean
}

// ============================================================================
// 数据存储
// ============================================================================

/** 当前歌曲列表（内存存储） */
let songStore: HotSong[] = []

/** 上次拉取时间戳 */
let lastFetchTime = 0

/** 拉取间隔（1 小时） */
const FETCH_INTERVAL = 60 * 60 * 1000

// ============================================================================
// 公开 API
// ============================================================================

/**
 * 获取活跃的热门歌曲列表（用于预生成）
 */
export function getActiveHotSongs(): HotSong[] {
  return songStore
    .filter(s => s.active && s.audioUrl)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * 获取所有歌曲（含不活跃的）
 */
function getAllSongs(): HotSong[] {
  return [...songStore].sort((a, b) => a.priority - b.priority)
}

/**
 * 从抖音热歌榜拉取歌曲并合并到列表
 *
 * 流程：chart-fetcher → music-search → merge
 */
export async function fetchAndMergeChartSongs(topN: number = 10): Promise<{ fetched: number; withAudio: number }> {
  console.log('[HotSongs] Fetching Douyin chart...')

  // 1. 拉取榜单
  const chartSongs = await fetchDouyinChart(topN)
  console.log(`[HotSongs] Chart returned ${chartSongs.length} songs`)

  // 2. 搜索音频 URL
  const newSongs: HotSong[] = []
  for (const chart of chartSongs) {
    const audio = await searchAudioUrl(chart.title, chart.artist)
    newSongs.push({
      id: `chart-${chart.title}-${chart.artist}`,
      title: chart.title,
      artist: chart.artist,
      audioUrl: audio?.audioUrl || '',
      source: audio ? 'netease' : 'douyin-chart',
      priority: chart.rank,
      active: !!audio,  // 有音频 URL 才激活
    })

    // 限流：避免网易云 API 限流
    if (chartSongs.indexOf(chart) < chartSongs.length - 1) {
      await sleep(500)
    }
  }

  // 3. 合并到 store（去重）
  mergeSongs(newSongs)
  lastFetchTime = Date.now()

  const withAudio = newSongs.filter(s => s.audioUrl).length
  console.log(`[HotSongs] Merged ${newSongs.length} songs, ${withAudio} with audio URL`)

  return { fetched: newSongs.length, withAudio }
}

/**
 * 手动添加歌曲
 */
export function addManualSong(song: { title: string; artist: string; audioUrl: string; priority?: number }): void {
  const newSong: HotSong = {
    id: `manual-${song.title}-${song.artist}`,
    title: song.title,
    artist: song.artist,
    audioUrl: song.audioUrl,
    source: 'manual',
    priority: song.priority ?? 100,
    active: true,
  }
  mergeSongs([newSong])
}

/**
 * 是否需要重新拉取
 */
export function needsRefresh(): boolean {
  return songStore.length === 0 || (Date.now() - lastFetchTime) > FETCH_INTERVAL
}

// 导出 getAllSongs 供 API 使用
export { getAllSongs as getHotSongList }

// ============================================================================
// 内部方法
// ============================================================================

/**
 * 合并歌曲到 store（按 id 去重，已存在的更新音频 URL）
 */
function mergeSongs(newSongs: HotSong[]): void {
  for (const song of newSongs) {
    const existing = songStore.findIndex(s => s.id === song.id)
    if (existing >= 0) {
      // 已存在：更新音频 URL（如果之前没有）
      if (!songStore[existing].audioUrl && song.audioUrl) {
        songStore[existing].audioUrl = song.audioUrl
        songStore[existing].source = song.source
        songStore[existing].active = true
      }
    } else {
      songStore.push(song)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
