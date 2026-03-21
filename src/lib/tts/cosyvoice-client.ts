/**
 * CosyVoice TTS 客户端
 * 阿里云 CosyVoice 3 API 集成
 * 支持 8 种方言
 *
 * API 文档: https://help.aliyun.com/zh/model-studio/developer-reference/cosyvoice-api
 */

import type { DialectCodeV2 } from '@/types/dialect-v2'
import { DIALECT_CONFIGS_V2, COSYVOICE_VOICE_IDS, getDialectConfigV2 } from '@/types/dialect-v2'

/**
 * TTS 请求选项
 */
export interface CosyVoiceOptions {
  /** 要合成的文本 */
  text: string
  /** 目标方言 */
  dialect: DialectCodeV2
  /** 语速 0.5 - 2.0，默认 1.0 */
  speed?: number
  /** 输出格式 */
  format?: 'mp3' | 'wav' | 'pcm'
  /** 参考音频路径（用于声音克隆） */
  refAudioPath?: string
  /** 参考音频对应的文本 */
  refText?: string
}

/**
 * TTS 响应结果
 */
export interface CosyVoiceResult {
  /** 音频 URL 或 base64 */
  audioUrl: string
  /** 音频时长（秒） */
  duration: number
  /** 方言代码 */
  dialect: DialectCodeV2
  /** 提供商标识 */
  provider: 'cosyvoice'
  /** 请求 ID */
  requestId?: string
}

/**
 * CosyVoice API 配置
 */
interface CosyVoiceConfig {
  apiKey: string
  baseUrl: string
  model: string
  timeout: number
}

/**
 * CosyVoice API 请求体
 */
interface CosyVoiceRequest {
  model: string
  input: {
    text: string
  }
  parameters: {
    voice: string
    speed?: number
    format?: string
    // 声音克隆参数
    ref_audio?: string
    ref_text?: string
  }
}

/**
 * CosyVoice API 响应体
 */
interface CosyVoiceResponse {
  output: {
    audio: string
  }
  usage: {
    characters: number
    duration: number
  }
  request_id: string
}

/**
 * CosyVoice TTS 客户端
 * 支持方言语音合成和声音克隆
 */
export class CosyVoiceClient {
  private config: CosyVoiceConfig

  constructor() {
    const apiKey = process.env.ALIBABA_CLOUD_API_KEY || process.env.DASHSCOPE_API_KEY
    if (!apiKey) {
      console.warn('[CosyVoice] ALIBABA_CLOUD_API_KEY not set, TTS will fail')
    }

    this.config = {
      apiKey: apiKey || '',
      baseUrl: process.env.COSYVOICE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts',
      model: process.env.COSYVOICE_MODEL || 'cosyvoice-v1',
      timeout: 60000,
    }
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!this.config.apiKey
  }

  /**
   * 生成语音
   */
  async generate(options: CosyVoiceOptions): Promise<CosyVoiceResult> {
    const {
      text,
      dialect,
      speed = 1.0,
      format = 'mp3',
      refAudioPath,
      refText,
    } = options

    // 验证方言
    const dialectConfig = getDialectConfigV2(dialect)
    if (!dialectConfig) {
      throw new Error(`Unsupported dialect: ${dialect}`)
    }

    // 检查 API Key
    if (!this.isConfigured()) {
      throw new Error('Alibaba Cloud API key not configured')
    }

    // 获取 CosyVoice Voice ID
    const voiceId = COSYVOICE_VOICE_IDS[dialect]

    // 构建请求
    const requestBody: CosyVoiceRequest = {
      model: this.config.model,
      input: {
        text,
      },
      parameters: {
        voice: voiceId,
        speed,
        format,
      },
    }

    // 如果有参考音频，添加声音克隆参数
    if (refAudioPath && refText) {
      requestBody.parameters.ref_audio = refAudioPath
      requestBody.parameters.ref_text = refText
    }

    try {
      const response = await this.callApi(requestBody)
      const audioBuffer = Buffer.from(response.output.audio, 'base64')

      // 上传到存储并获取 URL
      const audioUrl = await this.uploadAudio(audioBuffer, dialect, format)

      return {
        audioUrl,
        duration: response.usage.duration,
        dialect,
        provider: 'cosyvoice',
        requestId: response.request_id,
      }
    } catch (error) {
      console.error('[CosyVoice] TTS generation failed:', error)
      throw error
    }
  }

  /**
   * 调用 CosyVoice API
   */
  private async callApi(requestBody: CosyVoiceRequest): Promise<CosyVoiceResponse> {
    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.timeout),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`CosyVoice API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * 上传音频到存储
   * TODO: 集成实际的存储服务（Supabase Storage / OSS）
   */
  private async uploadAudio(
    buffer: Buffer,
    dialect: DialectCodeV2,
    format: string
  ): Promise<string> {
    // 临时方案：返回 base64 data URL
    // 生产环境应该上传到 Supabase Storage 或阿里云 OSS
    const base64 = buffer.toString('base64')
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav'
    return `data:${mimeType};base64,${base64}`
  }

  /**
   * 批量生成（用于长文本分段）
   */
  async generateBatch(
    segments: string[],
    dialect: DialectCodeV2,
    options?: { speed?: number; refAudioPath?: string; refText?: string }
  ): Promise<CosyVoiceResult[]> {
    const results: CosyVoiceResult[] = []

    for (const text of segments) {
      const result = await this.generate({
        text,
        dialect,
        speed: options?.speed,
        refAudioPath: options?.refAudioPath,
        refText: options?.refText,
      })
      results.push(result)
    }

    return results
  }

  /**
   * 使用参考音频生成语音（声音克隆模式）
   */
  async generateWithReference(
    text: string,
    dialect: DialectCodeV2,
    refAudioPath: string,
    refText: string,
    options?: { speed?: number }
  ): Promise<CosyVoiceResult> {
    return this.generate({
      text,
      dialect,
      refAudioPath,
      refText,
      speed: options?.speed,
    })
  }

  /**
   * 测试方言支持
   */
  async testDialect(dialect: DialectCodeV2): Promise<boolean> {
    const config = getDialectConfigV2(dialect)
    if (!config) return false

    try {
      await this.generate({
        text: config.sampleText,
        dialect,
        speed: 1.0,
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取支持的方言列表
   */
  getSupportedDialects(): DialectCodeV2[] {
    return Object.keys(DIALECT_CONFIGS_V2) as DialectCodeV2[]
  }

  /**
   * 带重试的语音生成
   */
  async generateWithRetry(
    options: CosyVoiceOptions,
    maxRetries: number = 3
  ): Promise<CosyVoiceResult> {
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.generate(options)
      } catch (error) {
        lastError = error as Error
        console.warn(`[CosyVoice] Attempt ${i + 1} failed:`, error)

        // 指数退避
        if (i < maxRetries - 1) {
          await this.sleep(1000 * Math.pow(2, i))
        }
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 单例实例
let clientInstance: CosyVoiceClient | null = null

/**
 * 获取 CosyVoice 客户端实例
 */
export function getCosyVoiceClient(): CosyVoiceClient {
  if (!clientInstance) {
    clientInstance = new CosyVoiceClient()
  }
  return clientInstance
}
