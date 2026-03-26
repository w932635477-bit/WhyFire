/**
 * GPT-SoVITS 声音克隆客户端
 *
 * @deprecated 已废弃
 * 请使用 CosyVoice 声音复刻客户端代替: src/lib/tts/cosyvoice-clone-client.ts
 *
 * 原因：
 * - GPT-SoVITS 是独立模型，需要自部署
 * - CosyVoice 声音复刻 + TTS 使用同一平台，更容易打通
 * - CosyVoice 支持 instruction 参数控制方言发音
 *
 * 新方案流程：
 * 用户录音 → CosyVoice 声音复刻 → 复刻音色 + instruction(方言) → 方言语音
 *
 * 支持用户录音 -> 训练模型 -> 克隆声音
 *
 * 功能：
 * 1. 上传用户录音样本（30秒 - 2分钟）
 * 2. 训练声音模型
 * 3. 使用克隆的声音进行 TTS
 *
 * 部署方式：
 * - 自部署: 设置 GPT_SOVITS_API_URL 环境变量
 * - 云服务: 使用官方 API（如果有）
 *
 * GitHub: https://github.com/RVC-Boss/GPT-SoVITS
 */

import { randomUUID } from 'crypto'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 声音克隆状态
 */
export type VoiceCloningStatus =
  | 'pending'
  | 'processing'
  | 'training'
  | 'completed'
  | 'failed'

/**
 * 声音克隆请求
 */
export interface VoiceCloningRequest {
  /** 音频数据（Base64 或 URL） */
  audioData?: string
  /** 音频 URL */
  audioUrl?: string
  /** 用户 ID */
  userId: string
  /** 声音名称 */
  voiceName?: string
  /** 音频时长（秒） */
  duration?: number
}

/**
 * 声音克隆结果
 */
export interface VoiceCloningResult {
  /** 克隆任务 ID */
  taskId: string
  /** 状态 */
  status: VoiceCloningStatus
  /** 克隆的音色 ID */
  voiceId?: string
  /** 进度 (0-100) */
  progress?: number
  /** 错误信息 */
  error?: string
  /** 训练时长（秒） */
  trainingTime?: number
}

/**
 * 声音模型信息
 */
export interface VoiceModel {
  /** 音色 ID */
  voiceId: string
  /** 用户 ID */
  userId: string
  /** 声音名称 */
  name: string
  /** 创建时间 */
  createdAt: Date
  /** 过期时间 */
  expiresAt: Date
  /** 状态 */
  status: 'active' | 'expired' | 'processing'
  /** 样本时长（秒） */
  sampleDuration: number
  /** 音色质量评分 (0-100) */
  qualityScore?: number
}

/**
 * TTS 请求（使用克隆声音）
 */
export interface GPTSoVITSTTSRequest {
  /** 文本 */
  text: string
  /** 克隆的音色 ID */
  voiceId: string
  /** 语速 */
  speed?: number
  /** 音频格式 */
  format?: 'mp3' | 'wav'
  /** 情感 */
  emotion?: string
  /** 参考音频（可选，用于情感控制） */
  referenceAudio?: string
}

/**
 * TTS 响应
 */
export interface GPTSoVITSTTSResult {
  /** 音频数据 */
  audioBuffer: Buffer
  /** 音频 URL */
  audioUrl?: string
  /** 时长（秒） */
  duration: number
  /** 音色 ID */
  voiceId: string
  /** 提供商 */
  provider: 'gpt_sovits'
}

/**
 * GPT-SoVITS API 配置
 */
interface GPTSoVITSConfig {
  /** API URL（自部署地址） */
  apiUrl: string
  /** API Key（如果需要） */
  apiKey?: string
  /** 请求超时 */
  timeout: number
  /** 是否启用 */
  enabled: boolean
}

// ============================================================================
// GPT-SoVITS 客户端
// ============================================================================

/**
 * GPT-SoVITS 声音克隆客户端
 *
 * 使用说明：
 * 1. 用户录音（30秒 - 2分钟）
 * 2. 调用 cloneVoice() 上传并训练
 * 3. 轮询 getCloningStatus() 等待训练完成
 * 4. 使用返回的 voiceId 进行 TTS
 */
export class GPTSoVITSClient {
  private config: GPTSoVITSConfig

  constructor() {
    const apiUrl = process.env.GPT_SOVITS_API_URL
    const apiKey = process.env.GPT_SOVITS_API_KEY

    if (!apiUrl) {
      console.warn('[GPT-SoVITS] GPT_SOVITS_API_URL not set, voice cloning will be disabled')
    }

    this.config = {
      apiUrl: apiUrl || '',
      apiKey: apiKey,
      timeout: 300000, // 5 分钟超时（训练可能需要较长时间）
      enabled: !!apiUrl,
    }
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.config.enabled
  }

  /**
   * 克隆声音
   * @param request 克隆请求
   * @returns 克隆结果
   */
  async cloneVoice(request: VoiceCloningRequest): Promise<VoiceCloningResult> {
    if (!this.isConfigured()) {
      throw new Error('GPT-SoVITS API not configured. Please set GPT_SOVITS_API_URL.')
    }

    const taskId = randomUUID()
    console.log(`[GPT-SoVITS] Starting voice cloning, taskId: ${taskId}`)

    try {
      // 步骤 1: 上传音频
      const uploadResult = await this.uploadAudio(request)

      // 步骤 2: 启动训练
      const trainResult = await this.startTraining({
        taskId,
        audioPath: uploadResult.audioPath,
        userId: request.userId,
        voiceName: request.voiceName,
      })

      return {
        taskId,
        status: 'training',
        progress: 0,
        voiceId: trainResult.voiceId,
      }
    } catch (error) {
      console.error('[GPT-SoVITS] Voice cloning failed:', error)
      return {
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 获取克隆状态
   * @param taskId 任务 ID
   * @returns 克隆状态
   */
  async getCloningStatus(taskId: string): Promise<VoiceCloningResult> {
    if (!this.isConfigured()) {
      throw new Error('GPT-SoVITS API not configured')
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/voice/status/${taskId}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.status}`)
      }

      const data = await response.json()

      return {
        taskId,
        status: data.status,
        voiceId: data.voice_id,
        progress: data.progress,
        error: data.error,
        trainingTime: data.training_time,
      }
    } catch (error) {
      console.error('[GPT-SoVITS] Failed to get cloning status:', error)
      throw error
    }
  }

  /**
   * 使用克隆的声音进行 TTS
   * @param request TTS 请求
   * @returns TTS 结果
   */
  async synthesize(request: GPTSoVITSTTSRequest): Promise<GPTSoVITSTTSResult> {
    if (!this.isConfigured()) {
      throw new Error('GPT-SoVITS API not configured')
    }

    const { text, voiceId, speed = 1.0, format = 'mp3', emotion, referenceAudio } = request

    console.log(`[GPT-SoVITS] Synthesizing speech, voiceId: ${voiceId}, text length: ${text.length}`)

    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/tts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          speed,
          format,
          emotion,
          reference_audio: referenceAudio,
        }),
        signal: AbortSignal.timeout(60000),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`TTS failed: ${response.status} - ${error}`)
      }

      // 获取音频数据
      const audioBuffer = Buffer.from(await response.arrayBuffer())

      // 估算时长
      const duration = Math.ceil(text.length / 3.5)

      return {
        audioBuffer,
        duration,
        voiceId,
        provider: 'gpt_sovits',
      }
    } catch (error) {
      console.error('[GPT-SoVITS] TTS failed:', error)
      throw error
    }
  }

  /**
   * 获取用户的声音模型列表
   * @param userId 用户 ID
   * @returns 声音模型列表
   */
  async getVoiceModels(userId: string): Promise<VoiceModel[]> {
    if (!this.isConfigured()) {
      return []
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/voice/list?user_id=${userId}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`Failed to get voice models: ${response.status}`)
      }

      const data = await response.json()

      return data.voices.map((v: Record<string, unknown>) => ({
        voiceId: v.voice_id as string,
        userId: v.user_id as string,
        name: v.name as string,
        createdAt: new Date(v.created_at as string),
        expiresAt: new Date(v.expires_at as string),
        status: v.status as 'active' | 'expired' | 'processing',
        sampleDuration: v.sample_duration as number,
        qualityScore: v.quality_score as number | undefined,
      }))
    } catch (error) {
      console.error('[GPT-SoVITS] Failed to get voice models:', error)
      return []
    }
  }

  /**
   * 删除声音模型
   * @param voiceId 音色 ID
   */
  async deleteVoiceModel(voiceId: string): Promise<void> {
    if (!this.isConfigured()) {
      return
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/voice/${voiceId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete voice model: ${response.status}`)
      }

      console.log(`[GPT-SoVITS] Voice model deleted: ${voiceId}`)
    } catch (error) {
      console.error('[GPT-SoVITS] Failed to delete voice model:', error)
      throw error
    }
  }

  /**
   * 上传音频文件
   */
  private async uploadAudio(
    request: VoiceCloningRequest
  ): Promise<{ audioPath: string }> {
    const formData = new FormData()

    if (request.audioData) {
      // Base64 数据
      formData.append('audio_data', request.audioData)
    } else if (request.audioUrl) {
      // URL
      formData.append('audio_url', request.audioUrl)
    } else {
      throw new Error('Either audioData or audioUrl is required')
    }

    formData.append('user_id', request.userId)

    if (request.voiceName) {
      formData.append('voice_name', request.voiceName)
    }

    const response = await fetch(`${this.config.apiUrl}/api/v1/voice/upload`, {
      method: 'POST',
      headers: {
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: formData,
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Audio upload failed: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return { audioPath: data.audio_path }
  }

  /**
   * 启动训练
   */
  private async startTraining(params: {
    taskId: string
    audioPath: string
    userId: string
    voiceName?: string
  }): Promise<{ voiceId: string }> {
    const response = await fetch(`${this.config.apiUrl}/api/v1/voice/train`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        task_id: params.taskId,
        audio_path: params.audioPath,
        user_id: params.userId,
        voice_name: params.voiceName || `voice_${Date.now()}`,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Training failed: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return { voiceId: data.voice_id }
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }

  /**
   * 上传音频到存储
   * TODO: 集成实际的存储服务（Supabase Storage / S3）
   */
  async uploadAudioToStorage(
    buffer: Buffer,
    voiceId: string,
    format: string
  ): Promise<string> {
    // 临时方案：返回 base64 data URL
    // 生产环境应该上传到 Supabase Storage
    const base64 = buffer.toString('base64')
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav'
    return `data:${mimeType};base64,${base64}`
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let clientInstance: GPTSoVITSClient | null = null

/**
 * 获取 GPT-SoVITS 客户端实例
 */
export function getGPTSoVITSClient(): GPTSoVITSClient {
  if (!clientInstance) {
    clientInstance = new GPTSoVITSClient()
  }
  return clientInstance
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 验证录音质量
 * 简单的客户端验证，实际验证应在服务端进行
 */
export function validateRecording(audioBuffer: Buffer): {
  valid: boolean
  duration: number
  issues: string[]
} {
  const issues: string[] = []

  // 简单的文件大小检查
  // 假设 MP3 格式，128kbps，每秒约 16KB
  const estimatedDuration = audioBuffer.length / 16000

  if (estimatedDuration < 30) {
    issues.push('录音时长不足 30 秒，建议录制 1-2 分钟')
  }

  if (estimatedDuration > 180) {
    issues.push('录音时长超过 3 分钟，建议控制在 1-2 分钟')
  }

  return {
    valid: issues.length === 0,
    duration: Math.round(estimatedDuration),
    issues,
  }
}

/**
 * 获取推荐的录音文本
 * 用户朗读这些文本用于声音克隆
 */
export function getRecommendedRecordingText(): string {
  return `
    欢迎来到 WhyFire 方言 Rap 生成系统。
    请用自然、清晰的语调朗读以下内容。
    今天的天气真好，阳光明媚，微风轻拂。
    我是一名热爱音乐的创作者，喜欢用方言表达自己的情感。
    Rap 是一种充满活力的音乐形式，它让我们能够自由地表达想法。
    请继续保持自然语调，不要紧张，就像平时说话一样。
    录音将用于创建您的专属声音模型，让您用自己的声音唱出方言 Rap。
    感谢您的参与，让我们一起创造独特的音乐体验。
  `.trim().replace(/\s+/g, ' ')
}
