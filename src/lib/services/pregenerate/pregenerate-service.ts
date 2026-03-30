/**
 * 翻唱预生成服务
 *
 * 后台管线：拉取热歌榜 → 遍历 歌曲×方言 → 调 CoverGenerator.generate() → 手动写缓存
 *
 * 特性：
 * - 幂等：已缓存的跳过
 * - 限流：每次 SunoAPI 调用间隔 12s
 * - 容错：单次失败继续，连续 5 次失败暂停
 * - 状态追踪：实时进度查询
 */

import { getCoverGenerator } from '@/lib/services/cover-generator'
import { getCoverCache } from '@/lib/cache/cover-cache'
import { getEnabledDialects } from '@/types/dialect'
import type { DialectCode } from '@/types/dialect'
import { fetchAndMergeChartSongs, getActiveHotSongs, needsRefresh, getHotSongList, type HotSong } from './hot-songs'

// ============================================================================
// 类型
// ============================================================================

export type PregenStatus = 'idle' | 'running' | 'completed' | 'failed' | 'stopping'

export interface PregenJobProgress {
  songId: string
  songTitle: string
  dialect: DialectCode
  status: 'pending' | 'skipped' | 'success' | 'failed'
  error?: string
  timestamp?: number
}

export interface PregenState {
  status: PregenStatus
  startedAt: number | null
  completedAt: number | null
  totalJobs: number
  completedJobs: number
  skippedJobs: number
  failedJobs: number
  currentSong: string | null
  currentDialect: DialectCode | null
  message: string
  jobs: PregenJobProgress[]
  songs: HotSong[]
}

// ============================================================================
// 常量
// ============================================================================

/** SunoAPI 调用间隔（毫秒） */
const DEFAULT_INTERVAL_MS = 12000

/** 连续失败上限 */
const MAX_CONSECUTIVE_FAILURES = 5

// ============================================================================
// 服务实现
// ============================================================================

class PregenerateService {
  private status: PregenStatus = 'idle'
  private state: PregenState = this.emptyState()
  private stopRequested = false
  private consecutiveFailures = 0

  /**
   * 启动预生成管线
   */
  async start(): Promise<PregenState> {
    if (this.status === 'running') {
      return { ...this.state, message: '预生成已在运行中' }
    }

    this.stopRequested = false
    this.consecutiveFailures = 0
    this.state = this.emptyState()
    this.state.status = 'running'
    this.state.startedAt = Date.now()
    this.state.message = '正在拉取热歌榜...'
    this.status = 'running'

    // 后台执行（fire-and-forget）
    this.runPipeline().catch(err => {
      console.error('[PregenerateService] Pipeline crashed:', err)
      this.status = 'failed'
      this.state.status = 'failed'
      this.state.message = `管线异常: ${err instanceof Error ? err.message : 'unknown'}`
    })

    return { ...this.state }
  }

  /**
   * 停止预生成
   */
  stop(): PregenState {
    if (this.status !== 'running') {
      return { ...this.state, message: '当前未在运行' }
    }
    this.stopRequested = true
    this.status = 'stopping'
    this.state.status = 'stopping'
    this.state.message = '正在停止（等待当前任务完成）...'
    return { ...this.state }
  }

  /**
   * 获取当前状态
   */
  getState(): PregenState {
    return { ...this.state, songs: getHotSongList() }
  }

  // ---------------------------------------------------------------------------
  // 内部：管线执行
  // ---------------------------------------------------------------------------

  private async runPipeline(): Promise<void> {
    try {
      // Step 1: 拉取热歌榜
      console.log('[PregenerateService] Step 1: Fetching chart songs...')
      this.state.message = '正在拉取抖音热歌榜...'

      let fetchResult: { fetched: number; withAudio: number }
      try {
        fetchResult = await fetchAndMergeChartSongs(10)
      } catch (err) {
        console.error('[PregenerateService] Chart fetch failed:', err)
        this.state.message = `热歌榜拉取失败: ${err instanceof Error ? err.message : 'unknown'}`
        this.status = 'failed'
        this.state.status = 'failed'
        return
      }

      if (this.stopRequested) {
        this.finish('stopped')
        return
      }

      // Step 2: 获取活跃歌曲
      const songs = getActiveHotSongs()
      if (songs.length === 0) {
        this.state.message = `拉取到 ${fetchResult.fetched} 首歌，但无可用音频 URL（网易云搜索未命中）`
        this.status = 'failed'
        this.state.status = 'failed'
        return
      }

      const dialects = getEnabledDialects().map(d => d.code)
      const totalJobs = songs.length * dialects.length

      console.log(`[PregenerateService] Step 2: ${songs.length} songs × ${dialects.length} dialects = ${totalJobs} jobs`)

      // 初始化 job 列表
      this.state.jobs = []
      for (const song of songs) {
        for (const dialect of dialects) {
          this.state.jobs.push({
            songId: song.id,
            songTitle: song.title,
            dialect,
            status: 'pending',
          })
        }
      }
      this.state.totalJobs = totalJobs
      this.state.songs = songs

      // Step 3: 遍历执行
      const cache = getCoverCache()
      const generator = getCoverGenerator()

      for (const song of songs) {
        if (this.stopRequested) break

        for (const dialect of dialects) {
          if (this.stopRequested) break

          // 更新当前状态
          this.state.currentSong = song.title
          this.state.currentDialect = dialect
          this.state.message = `正在生成: ${song.title} (${dialect})`

          // 幂等：检查缓存
          const existingCache = cache.get(song.audioUrl, dialect)
          if (existingCache) {
            this.markJob(song.id, dialect, 'skipped')
            continue
          }

          // 调 CoverGenerator.generate()（同步模式）
          // 注意：generate() 不写缓存，需要手动写入
          try {
            console.log(`[PregenerateService] Generating: ${song.title} × ${dialect}`)

            const result = await generator.generate({
              userId: 'pregenerate',
              songUrl: song.audioUrl,
              dialect,
            })

            // 手动写入缓存（generate() 不写缓存，只有 executeGeneration() 写）
            cache.set({
              cacheKey: cache.makeKey(song.audioUrl, dialect),
              songUrl: song.audioUrl,
              dialect,
              audioUrl: result.audioUrl,
              audioId: result.audioId,
              sunoTaskId: result.taskId,
              duration: result.duration,
              createdAt: Date.now(),
            })

            this.consecutiveFailures = 0
            this.markJob(song.id, dialect, 'success')
            console.log(`[PregenerateService] ✓ ${song.title} × ${dialect}`)
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'unknown'
            console.warn(`[PregenerateService] ✗ ${song.title} × ${dialect}: ${errMsg}`)
            this.markJob(song.id, dialect, 'failed', errMsg)
            this.consecutiveFailures++

            // 连续失败上限检查
            if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              console.error(`[PregenerateService] ${MAX_CONSECUTIVE_FAILURES} consecutive failures, pausing pipeline`)
              this.finish('failed', `连续 ${MAX_CONSECUTIVE_FAILURES} 次失败，管线已暂停`)
              return
            }
          }

          // 限流间隔
          await sleep(DEFAULT_INTERVAL_MS)
        }
      }

      // 完成
      if (this.stopRequested) {
        this.finish('stopped')
      } else {
        this.finish('completed')
      }
    } catch (err) {
      console.error('[PregenerateService] Pipeline error:', err)
      this.finish('failed', err instanceof Error ? err.message : 'unknown error')
    }
  }

  // ---------------------------------------------------------------------------
  // 内部：辅助方法
  // ---------------------------------------------------------------------------

  private markJob(songId: string, dialect: DialectCode, status: 'skipped' | 'success' | 'failed', error?: string): void {
    const job = this.state.jobs.find(j => j.songId === songId && j.dialect === dialect)
    if (job) {
      job.status = status
      job.error = error
      job.timestamp = Date.now()
    }

    if (status === 'success') this.state.completedJobs++
    if (status === 'skipped') this.state.skippedJobs++
    if (status === 'failed') this.state.failedJobs++
  }

  private finish(status: 'completed' | 'failed' | 'stopped', message?: string): void {
    this.status = status === 'stopped' ? 'idle' : status
    this.state.status = status === 'stopped' ? 'idle' : status
    this.state.completedAt = Date.now()
    this.state.currentSong = null
    this.state.currentDialect = null

    const elapsed = this.state.startedAt
      ? Math.round((Date.now() - this.state.startedAt) / 1000)
      : 0

    this.state.message = message || (
      status === 'completed'
        ? `完成！${this.state.completedJobs} 成功, ${this.state.skippedJobs} 跳过, ${this.state.failedJobs} 失败 (耗时 ${elapsed}s)`
        : status === 'failed'
        ? `失败: ${message || 'unknown'}`
        : `已停止 (已完成 ${this.state.completedJobs} 个任务)`
    )

    console.log(`[PregenerateService] Pipeline ${status}: ${this.state.message}`)
  }

  private emptyState(): PregenState {
    return {
      status: 'idle',
      startedAt: null,
      completedAt: null,
      totalJobs: 0,
      completedJobs: 0,
      skippedJobs: 0,
      failedJobs: 0,
      currentSong: null,
      currentDialect: null,
      message: '空闲',
      jobs: [],
      songs: [],
    }
  }
}

// ============================================================================
// 单例
// ============================================================================

let serviceInstance: PregenerateService | null = null

export function getPregenerateService(): PregenerateService {
  if (!serviceInstance) {
    serviceInstance = new PregenerateService()
  }
  return serviceInstance
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
