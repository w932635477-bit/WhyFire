/**
 * SunoAPI.org 客户端
 *
 * 功能:
 *   1. Add Vocals — 在自定义 BGM 上生成人声
 *   2. Upload & Cover — 方言翻唱（保留原曲旋律，用方言重新演绎）
 *   3. Create Music Video — 从音频生成 MP4 视频
 *
 * API 文档: https://docs.sunoapi.org
 * 端点:
 *   POST /api/v1/generate/add-vocals     — Add Vocals 提交
 *   POST /api/v1/generate/upload-cover   — Upload & Cover 提交
 *   GET  /api/v1/generate/record-info    — 音乐任务轮询
 *   POST /api/v1/mp4/generate             — MV 提交
 *   GET  /api/v1/mp4/record-info         — MV 任务轮询
 */

import type { DialectCode } from '@/types/dialect'
import { proxiedFetch } from '@/lib/fetch'

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
  audioId?: string              // SunoAPI 音频 ID（MV 生成需要）
  duration?: number
  title?: string
  tags?: string
  imageUrl?: string
  error?: string
}

// Upload & Cover — 方言翻唱
export interface UploadCoverRequest {
  /** 原曲公网 URL */
  uploadUrl: string
  /** 是否自定义模式（true=使用自定义歌词/风格） */
  customMode: boolean
  /** 是否纯乐器（false=含人声） */
  instrumental: boolean
  /** 模型版本 */
  model?: SunoApiModel
  /** 歌词内容 */
  prompt?: string
  /** 方言风格标签 */
  style?: string
  /** 歌曲标题 */
  title?: string
  /** 排除的风格标签 */
  negativeTags?: string
  /** 人声性别 */
  vocalGender?: 'm' | 'f'
  /** 风格权重 0-1 */
  styleWeight?: number
  /** 原曲保留权重 0-1（越高越像原曲） */
  audioWeight?: number
  /** 回调 URL */
  callBackUrl?: string
}

export interface UploadCoverResult {
  taskId: string
  status: 'pending' | 'completed' | 'partial' | 'failed'
  audioUrl?: string
  /** 流式音频 URL，TEXT_SUCCESS / FIRST_SUCCESS 时可用（~42-88s），比 audioUrl 早 30-50s */
  streamAudioUrl?: string
  audioId?: string              // 关键：MV 生成需要此字段
  duration?: number
  title?: string
  tags?: string
  imageUrl?: string
  /** true 表示流式结果，完整 audioUrl 尚未可用，后台仍在轮询 */
  isPartial?: boolean
  error?: string
}

// Create Music Video — 生成 MP4
export interface CreateMusicVideoRequest {
  /** 音乐生成任务的 taskId */
  taskId: string
  /** 音乐生成结果的 audioId */
  audioId: string
  /** 作者名（最多 50 字符） */
  author?: string
  /** 水印域名（最多 50 字符，显示在视频底部） */
  domainName?: string
  /** 回调 URL */
  callBackUrl?: string
}

export interface MusicVideoResult {
  taskId: string
  status: 'pending' | 'completed' | 'failed'
  videoUrl?: string
  error?: string
}

// Timestamped Lyrics — 逐词时间戳歌词
export interface TimestampedWord {
  /** 词文本 */
  word: string
  /** 对齐是否成功 */
  success: boolean
  /** 开始时间（秒） */
  startS: number
  /** 结束时间（秒） */
  endS: number
  /** 对齐概率 */
  palign: number
}

export interface TimestampedLyricsResult {
  alignedWords: TimestampedWord[]
  waveformData?: string
  hootCer?: number
  isStreamed?: boolean
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
  | 'SENSITIVE_WORD_ERROR'
  | 'CALLBACK_EXCEPTION'

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

/** MV 轮询状态值 */
type Mp4RecordStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'CREATE_TASK_FAILED'
  | 'GENERATE_MP4_FAILED'
  | 'CALLBACK_EXCEPTION'

/** MV 轮询响应 */
interface Mp4RecordInfoResponse {
  code: number
  msg: string
  data: {
    taskId: string
    musicId?: string
    response?: {
      videoUrl: string
    }
    successFlag?: 'SUCCESS' | 'PENDING' | 'GENERATE_MP4_FAILED' | 'CREATE_TASK_FAILED' | boolean
    errorMessage?: string
  }
}

/** MV 任务提交响应 */
interface Mp4SubmitResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

// ============================================================================
// 客户端实现
// ============================================================================

export class SunoApiClient {
  private apiKey: string
  private baseUrl: string
  private pollInterval = 2000     // 2 秒轮询（V5 生成快，需要更密的轮询）
  private maxPollAttempts = 90    // 3 分钟超时（2s * 90 = 180s），V5 通常 42-90s 完成

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
    console.log(`  Style: ${request.style}, Model: ${request.model || 'V4_5'}`)

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

  /**
   * Upload & Cover — 方言翻唱
   *
   * 上传一首歌，Suno 用指定方言重新演绎，保留原曲旋律
   * 适合做"方言翻唱热门歌"的传播内容
   *
   * 流程与 addVocals 相同：提交 → 轮询 → 返回
   */
  async uploadCover(request: UploadCoverRequest): Promise<UploadCoverResult> {
    if (!this.isConfigured()) {
      throw new Error('SunoAPI API key not configured. Set SUNOAPI_API_KEY.')
    }

    console.log('[SunoAPI] Submitting Upload & Cover task')
    console.log(`  Style: ${request.style || 'default'}, audioWeight: ${request.audioWeight ?? 0.5}`)

    // Step 1: 提交任务
    const taskId = await this.submitCoverTask(request)
    console.log(`[SunoAPI] Cover task submitted: ${taskId}`)

    // Step 2: 轮询结果（复用音乐轮询，但提取 audioId）
    return this.pollCoverResult(taskId)
  }

  /**
   * 获取翻唱任务状态（外部轮询用）
   */
  async getCoverStatus(taskId: string): Promise<UploadCoverResult> {
    const info = await this.fetchRecordInfo(taskId)
    return this.parseCoverRecordInfo(taskId, info)
  }

  /**
   * Create Music Video — 从音频生成 MP4
   *
   * 需要 cover/add-vocals 返回的 taskId + audioId
   * 视频保留 15 天
   */
  async createMusicVideo(request: CreateMusicVideoRequest): Promise<MusicVideoResult> {
    if (!this.isConfigured()) {
      throw new Error('SunoAPI API key not configured. Set SUNOAPI_API_KEY.')
    }

    console.log(`[SunoAPI] Submitting MV task: taskId=${request.taskId}, audioId=${request.audioId}`)

    // Step 1: 提交 MV 任务
    const mvTaskId = await this.submitMusicVideoTask(request)
    console.log(`[SunoAPI] MV task submitted: ${mvTaskId}`)

    // Step 2: 轮询 MV 结果
    return this.pollMusicVideoResult(mvTaskId)
  }

  /**
   * 获取 MV 任务状态（外部轮询用）
   */
  async getMusicVideoStatus(taskId: string): Promise<MusicVideoResult> {
    const res = await proxiedFetch(
      `${this.baseUrl}/api/v1/mp4/record-info?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(15000),
      } as any
    )

    if (!res.ok) {
      const text = await res.text()
      return { taskId, status: 'failed', error: `MV poll failed (${res.status}): ${text}` }
    }

    const data: Mp4RecordInfoResponse = await res.json()

    const flag = data.data.successFlag
    if ((flag === 'SUCCESS' || flag === true) && data.data.response?.videoUrl) {
      return {
        taskId: data.data.taskId,
        status: 'completed',
        videoUrl: data.data.response.videoUrl,
      }
    }

    if (flag === 'GENERATE_MP4_FAILED' || flag === 'CREATE_TASK_FAILED' || flag === false) {
      return { taskId, status: 'failed', error: data.data.errorMessage || 'MV generation failed' }
    }

    return { taskId, status: 'pending' }
  }

  /**
   * Get Timestamped Lyrics — 获取逐词时间戳歌词
   *
   * 需要 cover/add-vocals 返回的 taskId + audioId
   * 同步返回（非异步轮询）
   */
  async getTimestampedLyrics(taskId: string, audioId: string): Promise<TimestampedLyricsResult> {
    if (!this.isConfigured()) {
      throw new Error('SunoAPI API key not configured. Set SUNOAPI_API_KEY.')
    }

    console.log(`[SunoAPI] Fetching timestamped lyrics: taskId=${taskId}, audioId=${audioId}`)

    const res = await proxiedFetch(`${this.baseUrl}/api/v1/generate/get-timestamped-lyrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId, audioId }),
      signal: AbortSignal.timeout(30000),
    } as any)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`SunoAPI timestamped lyrics failed (${res.status}): ${text}`)
    }

    const data = await res.json()

    if (data.code !== 200) {
      throw new Error(`SunoAPI timestamped lyrics error: ${data.msg}`)
    }

    return data.data as TimestampedLyricsResult
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
      model: request.model || 'V4_5',
      audioWeight: request.audioWeight ?? 0.6,
    }

    if (request.negativeTags) body.negativeTags = request.negativeTags
    if (request.vocalGender) body.vocalGender = request.vocalGender
    if (request.styleWeight !== undefined) body.styleWeight = request.styleWeight
    // callBackUrl 是 SunoAPI 必填参数，未提供时用占位值
    body.callBackUrl = request.callBackUrl || process.env.SUNOAPI_CALLBACK_URL || 'https://httpbin.org/post'

    const res = await proxiedFetch(`${this.baseUrl}/api/v1/generate/add-vocals`, {
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

  /** 查询任务记录（公开，供 CoverGenerator 异步模式使用） */
  async fetchRecordInfo(taskId: string): Promise<RecordInfoResponse> {
    const res = await proxiedFetch(
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

  // ---------------------------------------------------------------------------
  // Cover 内部方法
  // ---------------------------------------------------------------------------

  /** 提交翻唱任务（公开，供 CoverGenerator 异步模式使用） */
  async submitCoverTask(request: UploadCoverRequest): Promise<string> {
    const body: Record<string, any> = {
      uploadUrl: request.uploadUrl,
      customMode: request.customMode,
      instrumental: request.instrumental,
      model: request.model || 'V4_5',
    }

    if (request.customMode) {
      if (request.prompt) body.prompt = request.prompt
      if (request.style) body.style = request.style
      if (request.title) body.title = request.title
      if (request.negativeTags) body.negativeTags = request.negativeTags
    }

    if (request.audioWeight !== undefined) body.audioWeight = request.audioWeight
    if (request.styleWeight !== undefined) body.styleWeight = request.styleWeight
    if (request.vocalGender) body.vocalGender = request.vocalGender
    body.callBackUrl = request.callBackUrl || process.env.SUNOAPI_CALLBACK_URL || 'https://httpbin.org/post'

    console.log(`[SunoAPI] submitCoverTask: model=${body.model}, customMode=${body.customMode}`)

    const res = await proxiedFetch(`${this.baseUrl}/api/v1/generate/upload-cover`, {
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
      throw new Error(`SunoAPI cover submit failed (${res.status}): ${text}`)
    }

    const data: AddVocalsSubmitResponse = await res.json()
    if (data.code !== 200 || !data.data?.taskId) {
      throw new Error(`SunoAPI cover submit error: ${data.msg}`)
    }

    return data.data.taskId
  }

  private async pollCoverResult(taskId: string): Promise<UploadCoverResult> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      const info = await this.fetchRecordInfo(taskId)

      console.log(`[SunoAPI] Cover poll ${attempt + 1}: status=${info.data.status}`)

      if (info.data.status === 'SUCCESS') {
        return this.parseCoverRecordInfo(taskId, info)
      }

      if (info.data.status === 'CREATE_TASK_FAILED' || info.data.status === 'GENERATE_AUDIO_FAILED') {
        return {
          taskId,
          status: 'failed',
          error: `Cover task failed: ${info.data.status}`,
        }
      }

      await this.sleep(this.pollInterval)
    }

    return {
      taskId,
      status: 'failed',
      error: 'Cover polling timeout (>10 min)',
    }
  }

  /** 解析翻唱任务记录（公开，供 CoverGenerator 异步模式使用） */
  parseCoverRecordInfo(taskId: string, info: RecordInfoResponse): UploadCoverResult {
    if (info.data.status === 'SUCCESS' && info.data.response?.sunoData?.length) {
      const song = info.data.response.sunoData[0]
      return {
        taskId,
        status: 'completed',
        audioUrl: song.audioUrl,
        audioId: song.id,          // 关键：MV 生成需要
        duration: song.duration,
        title: song.title,
        tags: song.tags,
        imageUrl: song.imageUrl,
      }
    }

    // V5 流式交付：TEXT_SUCCESS / FIRST_SUCCESS 时 streamAudioUrl 可用
    // TEXT_SUCCESS (~42s)：歌词完成，流式音频 URL 已可用
    // FIRST_SUCCESS (~88s)：第一首确认完成，流式音频稳定
    if ((info.data.status === 'TEXT_SUCCESS' || info.data.status === 'FIRST_SUCCESS')
        && info.data.response?.sunoData?.length) {
      const song = info.data.response.sunoData[0]
      if (song.streamAudioUrl) {
        return {
          taskId,
          status: 'partial',
          streamAudioUrl: song.streamAudioUrl,
          audioId: song.id,
          duration: song.duration,
          isPartial: true,
        }
      }
    }

    if (info.data.status === 'CREATE_TASK_FAILED' || info.data.status === 'GENERATE_AUDIO_FAILED') {
      return {
        taskId,
        status: 'failed',
        error: `Cover task failed: ${info.data.status}`,
      }
    }

    // 新增：敏感词错误处理
    if (info.data.status === 'SENSITIVE_WORD_ERROR') {
      return {
        taskId,
        status: 'failed',
        error: '歌词包含敏感内容，请修改后重试',
      }
    }

    return { taskId, status: 'pending' }
  }

  // ---------------------------------------------------------------------------
  // MV 内部方法
  // ---------------------------------------------------------------------------

  private async submitMusicVideoTask(request: CreateMusicVideoRequest): Promise<string> {
    const body: Record<string, any> = {
      taskId: request.taskId,
      audioId: request.audioId,
      callBackUrl: request.callBackUrl || 'https://httpbin.org/post',
    }

    if (request.author) body.author = request.author
    if (request.domainName) body.domainName = request.domainName

    const res = await proxiedFetch(`${this.baseUrl}/api/v1/mp4/generate`, {
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
      throw new Error(`SunoAPI MV submit failed (${res.status}): ${text}`)
    }

    const data: Mp4SubmitResponse = await res.json()
    if (data.code !== 200 || !data.data?.taskId) {
      throw new Error(`SunoAPI MV submit error: ${data.msg}`)
    }

    return data.data.taskId
  }

  private async pollMusicVideoResult(mvTaskId: string): Promise<MusicVideoResult> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      const result = await this.getMusicVideoStatus(mvTaskId)

      console.log(`[SunoAPI] MV poll ${attempt + 1}: status=${result.status}`)

      if (result.status === 'completed') return result
      if (result.status === 'failed') return result

      await this.sleep(this.pollInterval)
    }

    return {
      taskId: mvTaskId,
      status: 'failed',
      error: 'MV polling timeout (>10 min)',
    }
  }

  // ---------------------------------------------------------------------------
  // 工具方法
  // ---------------------------------------------------------------------------

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
