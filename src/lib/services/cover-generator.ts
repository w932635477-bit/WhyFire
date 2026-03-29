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
  audioId: string
  taskId: string
  duration: number
  lyrics?: string
  dialect: DialectCode
  pipeline: 'upload-cover'
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
  startMusicVideoGeneration(taskId: string, audioId: string, author?: string): string {
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
    this.executeMusicVideo(mvTaskId, taskId, audioId, author).catch((err) => {
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
          prompt: hasCustomLyrics ? lyrics : undefined,
          style: hasCustomLyrics ? dialectStyle : undefined,
          title: hasCustomLyrics ? `方言翻唱-${dialect}` : undefined,
          audioWeight: 0.5,
          styleWeight: 0.7,
          vocalGender,
          model: 'V4_5PLUS',
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

    if (coverResult.status === 'failed' || !coverResult.audioUrl) {
      throw new Error(coverResult.error || '翻唱生成失败')
    }

    // 完成
    const result: CoverGenerationResult = {
      audioUrl: coverResult.audioUrl,
      audioId: coverResult.audioId || '',
      taskId: coverResult.taskId,
      duration: coverResult.duration || 0,
      lyrics,
      dialect,
      pipeline: 'upload-cover',
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
   */
  private async pollCoverWithProgress(taskId: string, sunoTaskId: string): Promise<UploadCoverResult> {
    const maxAttempts = 120
    const interval = 5000
    let lastProgress = 30
    let lastUnknownStatus = ''

    let consecutiveErrors = 0

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let info
      try {
        info = await this.sunoApiClient.fetchRecordInfo(sunoTaskId)
        consecutiveErrors = 0
      } catch (fetchErr) {
        consecutiveErrors++
        if (consecutiveErrors >= 10) {
          console.error(`[CoverGenerator] ${consecutiveErrors} consecutive fetch errors, giving up: ${sunoTaskId}`)
          return { taskId: sunoTaskId, status: 'failed', error: `网络请求连续失败 (${consecutiveErrors} 次): ${fetchErr instanceof Error ? fetchErr.message : 'fetch failed'}` }
        }
        console.warn(`[CoverGenerator] Poll fetch error (${consecutiveErrors}/10), retrying: ${fetchErr instanceof Error ? fetchErr.message : 'unknown'}`)
        taskStore.update(taskId, {
          progress: Math.round(lastProgress),
          message: '网络波动，正在重试...',
        })
        await new Promise(resolve => setTimeout(resolve, interval))
        continue
      }

      // 根据轮询状态推算进度
      const sunoStatus = info.data.status

      // 每 10 次打印一次状态日志
      if (attempt % 10 === 0) {
        console.log(`[CoverGenerator] Poll ${attempt + 1}/${maxAttempts}: sunoStatus=${sunoStatus}, sunoTaskId=${sunoTaskId}`)
      }

      if (sunoStatus === 'PENDING') {
        lastProgress = Math.min(35 + attempt * 0.5, 85)
      } else if (sunoStatus === 'TEXT_SUCCESS') {
        lastProgress = Math.min(50 + attempt * 0.5, 90)
      } else if (sunoStatus === 'FIRST_SUCCESS') {
        lastProgress = Math.min(80 + attempt * 0.5, 95)
      } else if (sunoStatus === 'SUCCESS') {
        console.log(`[CoverGenerator] SunoAPI task completed: ${sunoTaskId}`)
        return this.sunoApiClient.parseCoverRecordInfo(sunoTaskId, info)
      } else if (sunoStatus === 'CREATE_TASK_FAILED' || sunoStatus === 'GENERATE_AUDIO_FAILED') {
        return { taskId: sunoTaskId, status: 'failed', error: `SunoAPI task failed: ${sunoStatus}` }
      } else {
        // 未知状态：记录日志
        if (sunoStatus !== lastUnknownStatus) {
          console.warn(`[CoverGenerator] Unknown sunoStatus="${sunoStatus}", sunoTaskId=${sunoTaskId}, full response:`, JSON.stringify(info.data).substring(0, 500))
          lastUnknownStatus = sunoStatus
        }
      }

      taskStore.update(taskId, {
        progress: Math.round(lastProgress),
        message: sunoStatus === 'PENDING'
          ? 'AI 正在分析原曲...'
          : sunoStatus === 'TEXT_SUCCESS'
          ? '正在生成翻唱音频...'
          : sunoStatus === 'FIRST_SUCCESS'
          ? '即将完成...'
          : `处理中 (${sunoStatus})...`,
      })

      await new Promise(resolve => setTimeout(resolve, interval))
    }

    console.error(`[CoverGenerator] Polling timeout: sunoTaskId=${sunoTaskId}, lastStatus=${lastUnknownStatus || 'known'}`)
    return { taskId: sunoTaskId, status: 'failed', error: '翻唱生成超时，请稍后重试' }
  }

  // ---------------------------------------------------------------------------
  // 内部：异步执行 MV
  // ---------------------------------------------------------------------------

  private async executeMusicVideo(mvTaskId: string, taskId: string, audioId: string, author?: string): Promise<void> {
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
      prompt: hasCustomLyrics ? lyrics : undefined,
      style: hasCustomLyrics ? dialectStyle : undefined,
      title: hasCustomLyrics ? `方言翻唱-${dialect}` : undefined,
      audioWeight: 0.5,
      styleWeight: 0.7,
      vocalGender,
      model: 'V4_5PLUS',
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
