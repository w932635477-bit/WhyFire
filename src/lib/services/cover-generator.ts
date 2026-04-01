/**
 * 方言翻唱生成器（Upload & Cover Pipeline）
 *
 * 2 步 Pipeline（无 Seed-VC）：
 *   1. 可选：Claude 生成带品牌信息的方言歌词
 *   2. SunoAPI Upload & Cover（保留原曲旋律，用方言重新演绎）
 *   3. 可选：SunoAPI Create Music Video
 *
 * 异步模式：
 *   - POST 提交任务 → 立即返回 taskId
 *   - 后台异步执行（歌词→翻唱）
 *   - GET 轮询状态 → 返回当前阶段和进度
 *   - 内存存储任务状态（单实例够用）
 */

import { getSunoApiClient } from '@/lib/music/suno-api-client'
import type { UploadCoverResult, MusicVideoResult } from '@/lib/music/suno-api-client'
import { generateWithClaude } from '@/lib/ai/claude-client'
import { VIRAL_DIALECT_CONFIGS } from '@/lib/ai/prompts/viral-lyrics-prompts'
import { getTimeContext } from '@/lib/ai/context/festival-service'
import { getTrendingService } from '@/lib/ai/context/trending-service'
import { getOSSsignedUrl } from '@/lib/oss'
import { getCoverCache } from '@/lib/cache/cover-cache'
import type { DialectCode } from '@/types/dialect'

// ============================================================================
// 类型定义
// ============================================================================

export interface CoverGenerationParams {
  userId: string
  /** 原曲公网 URL（OSS 或外链） */
  songUrl: string
  /** 目标方言 */
  dialect: DialectCode
  /** 自定义歌词（用户直接编辑） */
  customLyrics?: string
  /** 品牌信息（AI 据此生成歌词） */
  brandMessage?: string
  /** 人声性别 */
  vocalGender?: 'm' | 'f'
}

export type CoverGenerationStep = 'submitting' | 'lyrics' | 'cover' | 'completed' | 'failed'

export interface CoverGenerationProgress {
  step: CoverGenerationStep
  stepName: string
  progress: number
  message?: string
}

export interface CoverGenerationResult {
  audioUrl: string
  /** 流式音频 URL，比 audioUrl 早 30-50 秒可用（V5 TEXT_SUCCESS 时即可播放） */
  streamAudioUrl?: string
  audioId: string
  taskId: string
  duration: number
  lyrics?: string
  dialect: DialectCode
  pipeline: 'upload-cover'
  /** true = 流式结果，完整 audioUrl 尚未可用 */
  isPartial?: boolean
}

export interface MusicVideoGenerationResult {
  videoUrl: string
  taskId: string
}

export type CoverProgressCallback = (progress: CoverGenerationProgress) => void

// ============================================================================
// 异步任务存储
// ============================================================================

export type TaskStatus = 'processing' | 'completed' | 'failed'

export interface AsyncTaskState {
  taskId: string
  type: 'cover' | 'music-video'
  status: TaskStatus
  step: CoverGenerationStep | 'mv-submitting' | 'mv-polling'
  stepName: string
  progress: number
  message: string
  /** 最终结果 */
  result?: CoverGenerationResult | MusicVideoGenerationResult
  error?: string
  createdAt: number
}

class TaskStore {
  private tasks = new Map<string, AsyncTaskState>()
  private maxAge = 30 * 60 * 1000 // 30 分钟自动清理

  set(taskId: string, state: AsyncTaskState) {
    this.tasks.set(taskId, state)
  }

  get(taskId: string): AsyncTaskState | undefined {
    return this.tasks.get(taskId)
  }

  update(taskId: string, partial: Partial<AsyncTaskState>) {
    const existing = this.tasks.get(taskId)
    if (existing) {
      this.tasks.set(taskId, { ...existing, ...partial })
    }
  }

  cleanup() {
    const now = Date.now()
    for (const [id, task] of this.tasks) {
      if (now - task.createdAt > this.maxAge) {
        this.tasks.delete(id)
      }
    }
  }
}

const taskStore = new TaskStore()

// 定期清理过期任务
setInterval(() => taskStore.cleanup(), 5 * 60 * 1000).unref()

// ============================================================================
// 方言到翻唱风格映射（偏流行/民谣，不是 rap）
// ============================================================================

const DIALECT_COVER_STYLE: Partial<Record<DialectCode, string>> = {
  original: 'chinese pop, mandarin pop',
  mandarin: 'chinese pop, mandarin pop',
  cantonese: 'cantonese pop, hong kong pop, cantonese song',
  sichuan: 'sichuan dialect pop, chinese folk pop',
  dongbei: 'northeastern chinese pop, dongbei folk pop',
  shaanxi: 'shaanxi dialect pop, qinqiang pop',
  wu: 'wu dialect pop, shanghai pop',
  minnan: 'taiwanese pop, minnan pop',
  tianjin: 'tianjin dialect pop, northern folk pop',
  nanjing: 'nanjing dialect pop, jiangsu folk pop',
}

// ============================================================================
// 翻唱生成器
// ============================================================================

export class CoverGenerator {
  private sunoApiClient = getSunoApiClient()

  // ---------------------------------------------------------------------------
  // 异步模式 API
  // ---------------------------------------------------------------------------

  /**
   * 提交异步翻唱任务，立即返回 taskId
   */
  startGeneration(params: CoverGenerationParams): string {
    const taskId = `cover-${params.userId}-${Date.now()}`

    const state: AsyncTaskState = {
      taskId,
      type: 'cover',
      status: 'processing',
      step: 'submitting',
      stepName: '提交任务',
      progress: 0,
      message: '正在提交翻唱任务...',
      createdAt: Date.now(),
    }
    taskStore.set(taskId, state)

    // 后台异步执行
    this.executeGeneration(taskId, params).catch((err) => {
      taskStore.update(taskId, {
        status: 'failed',
        step: 'failed',
        stepName: '失败',
        progress: 0,
        message: err instanceof Error ? err.message : '翻唱生成失败',
        error: err instanceof Error ? err.message : '翻唱生成失败',
      })
    })

    return taskId
  }

  /**
   * 提交异步 MV 任务，立即返回 taskId
   */
  startMusicVideoGeneration(taskId: string, audioId: string, author?: string, domainName?: string): string {
    const mvTaskId = `mv-${Date.now()}`

    const state: AsyncTaskState = {
      taskId: mvTaskId,
      type: 'music-video',
      status: 'processing',
      step: 'mv-submitting',
      stepName: '提交 MV',
      progress: 0,
      message: '正在提交 MV 生成任务...',
      createdAt: Date.now(),
    }
    taskStore.set(mvTaskId, state)

    // 后台异步执行
    this.executeMusicVideo(mvTaskId, taskId, audioId, author, domainName).catch((err) => {
      taskStore.update(mvTaskId, {
        status: 'failed',
        step: 'failed',
        stepName: '失败',
        progress: 0,
        message: err instanceof Error ? err.message : 'MV 生成失败',
        error: err instanceof Error ? err.message : 'MV 生成失败',
      })
    })

    return mvTaskId
  }

  /**
   * 查询任务状态
   */
  getTaskStatus(taskId: string): AsyncTaskState | undefined {
    return taskStore.get(taskId)
  }

  // ---------------------------------------------------------------------------
  // 内部：异步执行翻唱
  // ---------------------------------------------------------------------------

  private async executeGeneration(taskId: string, params: CoverGenerationParams): Promise<void> {
    const { dialect, vocalGender } = params

    // 缓存查询：只对"使用原歌词"或"自定义歌词"模式做缓存（AI 生成歌词每次不同）
    const useCache = !params.brandMessage
    if (useCache) {
      const cached = getCoverCache().get(params.songUrl, dialect, vocalGender)
      if (cached) {
        console.log(`[CoverGenerator] Cache HIT: returning cached result for ${dialect}`)
        taskStore.update(taskId, {
          status: 'completed',
          step: 'completed',
          stepName: '完成',
          progress: 100,
          message: '翻唱生成完成（缓存命中）',
          result: {
            audioUrl: cached.audioUrl,
            audioId: cached.audioId,
            taskId: cached.sunoTaskId,
            duration: cached.duration,
            lyrics: cached.lyrics,
            dialect,
            pipeline: 'upload-cover',
          },
        })
        return
      }
    }

    // 如果 songUrl 是 OSS 私有链接，生成签名 URL 供 SunoAPI 下载
    let songUrl = params.songUrl
    if (songUrl.includes('.aliyuncs.com/') && !songUrl.includes('Signature=')) {
      const objectKey = songUrl.split('.aliyuncs.com/')[1]?.split('?')[0]
      if (objectKey) {
        songUrl = getOSSsignedUrl(objectKey, 3600) // 1 小时有效
        console.log(`[CoverGenerator] Using signed URL for SunoAPI: ${objectKey}`)
      }
    }

    if (!this.sunoApiClient.isConfigured()) {
      throw new Error('SunoAPI 未配置。请设置 SUNOAPI_API_KEY。')
    }

    let lyrics = params.customLyrics
    const dialectStyle = DIALECT_COVER_STYLE[dialect] || DIALECT_COVER_STYLE.original!
    if (!DIALECT_COVER_STYLE[dialect]) {
      console.warn(`[CoverGenerator] Unknown dialect "${dialect}", falling back to "original"`)
    }

    // Step 1: 可选歌词生成
    if (!lyrics && params.brandMessage) {
      taskStore.update(taskId, {
        step: 'lyrics',
        stepName: 'AI 生成歌词',
        progress: 10,
        message: '正在根据品牌信息生成方言歌词...',
      })

      lyrics = await this.generateCoverLyrics(params.brandMessage, dialect)

      taskStore.update(taskId, {
        step: 'lyrics',
        stepName: 'AI 生成歌词',
        progress: 20,
        message: '歌词生成完成',
      })
    }

    // Step 2: SunoAPI Upload & Cover
    taskStore.update(taskId, {
      step: 'cover',
      stepName: '方言翻唱',
      progress: 25,
      message: '正在提交翻唱任务到 Suno...',
    })

    // 先提交，获取 Suno taskId（带重试）
    const hasCustomLyrics = !!lyrics
    let sunoTaskId: string | undefined
    for (let retry = 0; retry < 3; retry++) {
      try {
        sunoTaskId = await this.sunoApiClient.submitCoverTask({
          uploadUrl: songUrl,
          customMode: hasCustomLyrics,
          instrumental: false,
          // customMode:false 时 prompt 必填（SunoAPI 文档要求），用作创意描述自动生成歌词
          // customMode:true 时 prompt 用作精确歌词
          prompt: hasCustomLyrics ? lyrics : `用${dialectStyle || dialect}方言重新演绎这首歌曲`,
          style: hasCustomLyrics ? dialectStyle : undefined,
          title: hasCustomLyrics ? `方言翻唱-${dialect}` : undefined,
          audioWeight: 0.5,
          styleWeight: 0.7,
          vocalGender,
          model: 'V4_5',
          negativeTags: 'singing badly, off-key, monotone, chanting',
        })
        break
      } catch (submitErr) {
        if (retry < 2) {
          console.warn(`[CoverGenerator] SunoAPI submit retry ${retry + 1}/3: ${submitErr instanceof Error ? submitErr.message : 'unknown'}`)
          taskStore.update(taskId, { message: `提交失败，正在重试 (${retry + 1}/3)...` })
          await new Promise(resolve => setTimeout(resolve, 5000))
        } else {
          throw submitErr
        }
      }
    }
    if (!sunoTaskId) throw new Error('SunoAPI 提交失败')

    taskStore.update(taskId, {
      progress: 30,
      message: 'Suno 正在用方言重新演绎...',
    })

    // 轮询 Suno 结果，逐步更新进度
    const coverResult = await this.pollCoverWithProgress(taskId, sunoTaskId)

    if (coverResult.status === 'failed') {
      throw new Error(coverResult.error || '翻唱生成失败')
    }

    // partial 结果（streamAudioUrl 可用，audioUrl 尚未就绪）不算失败
    const isPartial = coverResult.status === 'partial' && !!coverResult.streamAudioUrl

    // 非部分结果必须有 audioUrl
    if (!isPartial && !coverResult.audioUrl) {
      throw new Error('翻唱生成失败：未获得音频 URL')
    }

    // 完成
    const result: CoverGenerationResult = {
      audioUrl: coverResult.audioUrl || '',
      streamAudioUrl: coverResult.streamAudioUrl,
      audioId: coverResult.audioId || '',
      taskId: coverResult.taskId,
      duration: coverResult.duration || 0,
      lyrics,
      dialect,
      pipeline: 'upload-cover',
      isPartial,
    }

    // 写入缓存（仅完整结果 + "使用原歌词"或"自定义歌词"模式）
    if (useCache && !isPartial && result.audioUrl) {
      const cacheKey = getCoverCache().makeKey(params.songUrl, dialect, vocalGender)
      getCoverCache().set({
        cacheKey,
        songUrl: params.songUrl,
        dialect,
        audioUrl: result.audioUrl,
        audioId: result.audioId,
        sunoTaskId: result.taskId,
        duration: result.duration,
        lyrics,
        vocalGender,
        createdAt: Date.now(),
      })
    }

    taskStore.update(taskId, {
      status: 'completed',
      step: 'completed',
      stepName: '完成',
      progress: 100,
      message: '翻唱生成完成',
      result,
    })
  }

  /**
   * 轮询翻唱结果，带进度更新
   *
   * V5 优化策略：
   * - 统一 2 秒轮询（V5 生成快，需要更密轮询）
   * - TEXT_SUCCESS 时检查 streamAudioUrl，有就立即返回（~42s）
   * - FIRST_SUCCESS 时确认可用（~88s）
   * - 总超时 90 秒（V5 不应该超过这个时间）
   */
  private async pollCoverWithProgress(taskId: string, sunoTaskId: string): Promise<UploadCoverResult> {
    const pollInterval = 2000
    const maxAttempts = 45          // 2s * 45 = 90s
    const startTime = Date.now()
    let lastProgress = 30
    let lastUnknownStatus = ''

    let consecutiveErrors = 0

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const elapsedSec = Math.round((Date.now() - startTime) / 1000)

      let info
      try {
        info = await this.sunoApiClient.fetchRecordInfo(sunoTaskId)
        consecutiveErrors = 0
      } catch (fetchErr) {
        consecutiveErrors++
        if (consecutiveErrors >= 5) {
          console.error(`[CoverGenerator] ${consecutiveErrors} consecutive fetch errors, giving up: ${sunoTaskId}`)
          return { taskId: sunoTaskId, status: 'failed', error: `网络请求连续失败 (${consecutiveErrors} 次): ${fetchErr instanceof Error ? fetchErr.message : 'fetch failed'}` }
        }
        console.warn(`[CoverGenerator] Poll fetch error (${consecutiveErrors}/5), retrying: ${fetchErr instanceof Error ? fetchErr.message : 'unknown'}`)
        taskStore.update(taskId, {
          progress: Math.round(lastProgress),
          message: '网络波动，正在重试...',
        })
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        continue
      }

      const sunoStatus = info.data.status

      if (attempt % 5 === 0) {
        console.log(`[CoverGenerator] Poll ${attempt + 1}/${maxAttempts} (${elapsedSec}s): sunoStatus=${sunoStatus}, sunoTaskId=${sunoTaskId}`)
      }

      if (sunoStatus === 'PENDING') {
        lastProgress = Math.min(35 + attempt * 1, 60)
      } else if (sunoStatus === 'TEXT_SUCCESS') {
        lastProgress = Math.min(60 + attempt * 0.5, 80)
        // V5 流式交付：TEXT_SUCCESS 时 streamAudioUrl 可能已可用（~42s）
        const parsed = this.sunoApiClient.parseCoverRecordInfo(sunoTaskId, info)
        if (parsed.status === 'partial' && parsed.streamAudioUrl) {
          const totalSec = Math.round((Date.now() - startTime) / 1000)
          console.log(`[CoverGenerator] Stream audio available at TEXT_SUCCESS (${totalSec}s): ${sunoTaskId}`)
          return parsed
        }
      } else if (sunoStatus === 'FIRST_SUCCESS') {
        lastProgress = Math.min(85 + attempt * 0.3, 95)
        // FIRST_SUCCESS 时流式 URL 一定可用
        const parsed = this.sunoApiClient.parseCoverRecordInfo(sunoTaskId, info)
        if (parsed.status === 'partial' && parsed.streamAudioUrl) {
          const totalSec = Math.round((Date.now() - startTime) / 1000)
          console.log(`[CoverGenerator] Stream audio confirmed at FIRST_SUCCESS (${totalSec}s): ${sunoTaskId}`)
          return parsed
        }
      } else if (sunoStatus === 'SUCCESS') {
        const totalSec = Math.round((Date.now() - startTime) / 1000)
        console.log(`[CoverGenerator] SunoAPI task completed in ${totalSec}s: ${sunoTaskId}`)
        return this.sunoApiClient.parseCoverRecordInfo(sunoTaskId, info)
      } else if (sunoStatus === 'CREATE_TASK_FAILED' || sunoStatus === 'GENERATE_AUDIO_FAILED') {
        return { taskId: sunoTaskId, status: 'failed', error: `SunoAPI task failed: ${sunoStatus}` }
      } else if (sunoStatus === 'SENSITIVE_WORD_ERROR') {
        return { taskId: sunoTaskId, status: 'failed', error: '歌词包含敏感内容，请修改后重试' }
      } else {
        if (sunoStatus !== lastUnknownStatus) {
          console.warn(`[CoverGenerator] Unknown sunoStatus="${sunoStatus}", sunoTaskId=${sunoTaskId}, full response:`, JSON.stringify(info.data).substring(0, 500))
          lastUnknownStatus = sunoStatus
        }
      }

      // 进度消息带时间提示
      const timeHint = elapsedSec > 20 ? ` (${elapsedSec}秒)` : ''
      taskStore.update(taskId, {
        progress: Math.round(lastProgress),
        message: sunoStatus === 'PENDING'
          ? `AI 正在分析原曲${timeHint}...`
          : sunoStatus === 'TEXT_SUCCESS'
          ? `正在生成翻唱音频${timeHint}...`
          : sunoStatus === 'FIRST_SUCCESS'
          ? '即将完成...'
          : `处理中 (${sunoStatus})${timeHint}...`,
      })

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    const totalElapsed = Math.round((Date.now() - startTime) / 1000)
    console.error(`[CoverGenerator] Polling timeout after ${totalElapsed}s: sunoTaskId=${sunoTaskId}, lastStatus=${lastUnknownStatus || 'known'}`)
    return { taskId: sunoTaskId, status: 'failed', error: `翻唱生成超时 (${totalElapsed}秒)，请稍后重试` }
  }

  // ---------------------------------------------------------------------------
  // 内部：异步执行 MV
  // ---------------------------------------------------------------------------

  private async executeMusicVideo(mvTaskId: string, taskId: string, audioId: string, author?: string, domainName?: string): Promise<void> {
    taskStore.update(mvTaskId, {
      step: 'mv-polling',
      stepName: '生成 MV',
      progress: 5,
      message: '正在提交 MV 生成任务到 Suno...',
    })

    const mvResult = await this.sunoApiClient.createMusicVideo({
      taskId,
      audioId,
      author,
      domainName,
    })

    if (mvResult.status === 'failed' || !mvResult.videoUrl) {
      throw new Error(mvResult.error || 'MV 生成失败')
    }

    taskStore.update(mvTaskId, {
      status: 'completed',
      step: 'completed',
      stepName: '完成',
      progress: 100,
      message: 'MV 生成完成',
      result: {
        videoUrl: mvResult.videoUrl,
        taskId: mvResult.taskId,
      },
    })
  }

  // ---------------------------------------------------------------------------
  // 同步模式（保留向后兼容）
  // ---------------------------------------------------------------------------

  /**
   * 同步生成方言翻唱（内部使用，向后兼容）
   */
  async generate(
    params: CoverGenerationParams,
    onProgress?: CoverProgressCallback
  ): Promise<CoverGenerationResult> {
    const { userId, songUrl, dialect, vocalGender } = params
    const taskId = `${userId}-cover-${Date.now()}`

    if (!this.sunoApiClient.isConfigured()) {
      throw new Error('SunoAPI 未配置。请设置 SUNOAPI_API_KEY。')
    }

    let lyrics = params.customLyrics
    const dialectStyle = DIALECT_COVER_STYLE[dialect] || DIALECT_COVER_STYLE.original!

    if (!lyrics && params.brandMessage) {
      onProgress?.({ step: 'lyrics', stepName: '生成歌词', progress: 0, message: '正在根据品牌信息生成方言歌词...' })
      lyrics = await this.generateCoverLyrics(params.brandMessage, dialect)
      onProgress?.({ step: 'lyrics', stepName: '生成歌词', progress: 100, message: '歌词生成完成' })
    }

    onProgress?.({ step: 'cover', stepName: '方言翻唱', progress: 0, message: '正在提交翻唱任务...' })

    const hasCustomLyrics = !!lyrics
    const coverResult = await this.sunoApiClient.uploadCover({
      uploadUrl: songUrl,
      customMode: hasCustomLyrics,
      instrumental: false,
      prompt: hasCustomLyrics ? lyrics : `用${dialectStyle || dialect}方言重新演绎这首歌曲`,
      style: hasCustomLyrics ? dialectStyle : undefined,
      title: hasCustomLyrics ? `方言翻唱-${dialect}` : undefined,
      audioWeight: 0.5,
      styleWeight: 0.7,
      vocalGender,
      model: 'V4_5',
      negativeTags: 'singing badly, off-key, monotone, chanting',
    })

    if (coverResult.status === 'failed' || !coverResult.audioUrl) {
      throw new Error(coverResult.error || '翻唱生成失败')
    }

    onProgress?.({ step: 'cover', stepName: '方言翻唱', progress: 100, message: '翻唱生成完成' })

    return {
      audioUrl: coverResult.audioUrl,
      audioId: coverResult.audioId || '',
      taskId: coverResult.taskId,
      duration: coverResult.duration || 0,
      lyrics,
      dialect,
      pipeline: 'upload-cover',
    }
  }

  /**
   * 检查服务可用性
   */
  async checkServices(): Promise<{ sunoApi: boolean }> {
    return { sunoApi: this.sunoApiClient.isConfigured() }
  }

  // ---------------------------------------------------------------------------
  // 内部方法
  // ---------------------------------------------------------------------------

  private async generateCoverLyrics(brandMessage: string, dialect: DialectCode): Promise<string> {
    try {
      const timeContext = getTimeContext()
      const trendingService = getTrendingService()
      const trendingTopics = await trendingService.getTrendingTopics({ limit: 3 })
      const viralConfig = VIRAL_DIALECT_CONFIGS[dialect]

      const dialectName = viralConfig?.name || '方言'
      const topicsStr = trendingTopics.map(t => t.title).filter(Boolean).join('、')

      const prompt = `你是一个方言歌词创作专家。请根据以下信息创作一段适合翻唱的${dialectName}歌词。

品牌/产品信息：${brandMessage}

要求：
1. 歌词要融入品牌信息，但听起来自然、有趣
2. 使用${dialectName}的特色表达和俚语
3. 歌词节奏感强，适合演唱
4. 长度适中，约 200-300 字
5. 结尾要有记忆点，方便传播
${timeContext ? `\n时间背景：${timeContext}` : ''}
${topicsStr ? `热点话题：${topicsStr}` : ''}

请直接输出歌词内容，不要加任何说明文字。`

      const result = await generateWithClaude(prompt)

      if (result) {
        console.log('[CoverGenerator] AI 歌词生成成功')
        return result
      }

      return brandMessage
    } catch (error) {
      console.error('[CoverGenerator] 歌词生成失败:', error)
      return brandMessage
    }
  }
}

// ============================================================================
// 单例
// ============================================================================

let generatorInstance: CoverGenerator | null = null

export function getCoverGenerator(): CoverGenerator {
  if (!generatorInstance) {
    generatorInstance = new CoverGenerator()
  }
  return generatorInstance
}
