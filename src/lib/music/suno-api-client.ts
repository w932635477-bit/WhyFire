/**
 * SunoAPI.org 客户端 — Add Vocals 功能
 *
 * 核心能力：上传自定义 BGM → Suno 在你的伴奏上生成人声
 * 这解决了 "Suno 生成的 Rap 节拍和用户选的 BGM 不匹配" 的问题
 *
 * API 文档: https://docs.sunoapi.org
 * 端点:
 *   POST /api/v1/generate/add-vocals  — 提交任务
 *   GET  /api/v1/generate/record-info   — 轮询状态
 */

import type { DialectCode } from '@/types/dialect'

// ============================================================================
// 类型定义
// ============================================================================

export type SunoApiModel = 'V4_5' | 'V4_5PLUS' | 'V5'

export interface AddVocalsRequest {
  /** BGM/伴奏音频的公开 URL */
  uploadUrl: string
  /** 歌词内容（支持中文） */
  prompt: string
  /** 歌曲标题 */
  title: string
  /** 音乐风格 */
  style: string
  /** 排除的风格标签 */
  negativeTags?: string
  /** 人声性别 */
  vocalGender?: 'm' | 'f'
  /** 风格权重 0~1 */
  styleWeight?: number
  /** 原始音频保留权重 0~1（越高越保留原 BGM 特征） */
  audioWeight?: number
  /** 模型版本 */
  model?: SunoApiModel
  /** 回调 URL */
  callBackUrl?: string
}

export interface AddVocalsResult {
  taskId: string
  status: 'pending' | 'completed' | 'failed'
  audioUrl?: string
  duration?: number
  title?: string
  tags?: string
  imageUrl?: string
  error?: string
}

/** Add Vocals 任务提交响应 */
interface AddVocalsSubmitResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

/** 轮询状态值 */
type RecordStatus =
  | 'PENDING'
  | 'TEXT_SUCCESS'
  | 'FIRST_SUCCESS'
  | 'SUCCESS'
  | 'CREATE_TASK_FAILED'
  | 'GENERATE_AUDIO_FAILED'

/** 轮询响应 */
interface RecordInfoResponse {
  code: number
  msg: string
  data: {
    taskId: string
    status: RecordStatus
    response?: {
      sunoData?: Array<{
        id: string
        audioUrl: string
        streamAudioUrl?: string
        imageUrl: string
        prompt: string
        modelName: string
        title: string
        tags: string
        createTime: string
        duration: number
      }>
    }
  }
}

// ============================================================================
// 客户端实现
// ============================================================================

export class SunoApiClient {
  private apiKey: string
  private baseUrl: string
  private pollInterval = 5000
  private maxPollAttempts = 120 // 10 分钟超时

  constructor() {
    this.apiKey = process.env.SUNOAPI_API_KEY || ''
    this.baseUrl = process.env.SUNOAPI_BASE_URL || 'https://api.sunoapi.org'

    if (!this.apiKey) {
      console.warn('[SunoAPI] SUNOAPI_API_KEY not set')
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Add Vocals — 在自定义 BGM 上生成人声
   *
   * 流程:
   * 1. 提交任务（BGM URL + 歌词 → taskId）
   * 2. 轮询状态直到完成
   * 3. 返回带人声的完整音频 URL
   */
  async addVocals(request: AddVocalsRequest): Promise<AddVocalsResult> {
    if (!this.isConfigured()) {
      throw new Error('SunoAPI API key not configured. Set SUNOAPI_API_KEY.')
    }

    console.log('[SunoAPI] Submitting Add Vocals task')
    console.log(`  BGM: ${request.uploadUrl}`)
    console.log(`  Style: ${request.style}`)
    console.log(`  Model: ${request.model || 'V4_5PLUS'}`)

    // Step 1: 提交任务
    const taskId = await this.submitTask(request)
    console.log(`[SunoAPI] Task submitted: ${taskId}`)

    // Step 2: 轮询结果
    return this.pollResult(taskId)
  }

  /**
   * 获取任务状态（外部轮询用）
   */
  async getStatus(taskId: string): Promise<AddVocalsResult> {
    const info = await this.fetchRecordInfo(taskId)
    return this.parseRecordInfo(taskId, info)
  }

  // ---------------------------------------------------------------------------
  // 内部方法
  // ---------------------------------------------------------------------------

  private async submitTask(request: AddVocalsRequest): Promise<string> {
    const body: Record<string, any> = {
      uploadUrl: request.uploadUrl,
      prompt: request.prompt,
      title: request.title,
      style: request.style,
      model: request.model || 'V4_5PLUS',
      audioWeight: request.audioWeight ?? 0.6,
    }

    if (request.negativeTags) body.negativeTags = request.negativeTags
    if (request.vocalGender) body.vocalGender = request.vocalGender
    if (request.styleWeight !== undefined) body.styleWeight = request.styleWeight
    // callBackUrl 是 SunoAPI 必填参数，未提供时用占位值
    body.callBackUrl = request.callBackUrl || 'https://httpbin.org/post'

    const res = await fetch(`${this.baseUrl}/api/v1/generate/add-vocals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    } as any)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`SunoAPI submit failed (${res.status}): ${text}`)
    }

    const data: AddVocalsSubmitResponse = await res.json()
    if (data.code !== 200 || !data.data?.taskId) {
      throw new Error(`SunoAPI submit error: ${data.msg}`)
    }

    return data.data.taskId
  }

  private async fetchRecordInfo(taskId: string): Promise<RecordInfoResponse> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/generate/record-info?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(15000),
      } as any
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`SunoAPI poll failed (${res.status}): ${text}`)
    }

    return await res.json()
  }

  private async pollResult(taskId: string): Promise<AddVocalsResult> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      const info = await this.fetchRecordInfo(taskId)
      const parsed = this.parseRecordInfo(taskId, info)

      console.log(`[SunoAPI] Poll ${attempt + 1}: status=${info.data.status}`)

      if (info.data.status === 'SUCCESS') {
        return parsed
      }

      if (info.data.status === 'CREATE_TASK_FAILED' || info.data.status === 'GENERATE_AUDIO_FAILED') {
        return {
          taskId,
          status: 'failed',
          error: `SunoAPI task failed: ${info.data.status}`,
        }
      }

      // PENDING / TEXT_SUCCESS / FIRST_SUCCESS → 继续等待
      await this.sleep(this.pollInterval)
    }

    return {
      taskId,
      status: 'failed',
      error: 'Polling timeout (>10 min)',
    }
  }

  private parseRecordInfo(taskId: string, info: RecordInfoResponse): AddVocalsResult {
    if (info.data.status === 'SUCCESS' && info.data.response?.sunoData?.length) {
      const song = info.data.response.sunoData[0]
      return {
        taskId,
        status: 'completed',
        audioUrl: song.audioUrl,
        duration: song.duration,
        title: song.title,
        tags: song.tags,
        imageUrl: song.imageUrl,
      }
    }

    if (info.data.status === 'CREATE_TASK_FAILED' || info.data.status === 'GENERATE_AUDIO_FAILED') {
      return {
        taskId,
        status: 'failed',
        error: `Task failed: ${info.data.status}`,
      }
    }

    return {
      taskId,
      status: 'pending',
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// 单例
// ============================================================================

let clientInstance: SunoApiClient | null = null

export function getSunoApiClient(): SunoApiClient {
  if (!clientInstance) {
    clientInstance = new SunoApiClient()
  }
  return clientInstance
}
