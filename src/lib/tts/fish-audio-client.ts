/**
 * Fish Audio TTS 客户端
 * 支持 18+ 种中国方言
 * API 文档: https://fish.audio/docs
 */

import type { DialectCode } from '@/types/dialect'
import { DIALECT_VOICE_MAP, DIALECT_CONFIGS } from '@/types/dialect'

/**
 * TTS 请求选项
 */
export interface TTSOptions {
  text: string
  dialect: DialectCode
  speed?: number      // 0.5 - 2.0，默认 1.0
  format?: 'mp3' | 'wav' | 'pcm'
}

/**
 * TTS 响应结果
 */
export interface TTSResult {
  audioUrl: string
  duration: number
  dialect: DialectCode
  provider: 'fish_audio'
}

/**
 * Fish Audio API 配置
 */
interface FishAudioConfig {
  apiKey: string
  baseUrl: string
  timeout: number
}

/**
 * Fish Audio TTS 客户端
 */
export class FishAudioClient {
  private config: FishAudioConfig

  constructor() {
    const apiKey = process.env.FISH_AUDIO_API_KEY
    if (!apiKey) {
      console.warn('[FishAudio] FISH_AUDIO_API_KEY not set, TTS will use fallback')
    }

    this.config = {
      apiKey: apiKey || '',
      baseUrl: process.env.FISH_AUDIO_BASE_URL || 'https://api.fish.audio',
      timeout: 30000,
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
  async generate(options: TTSOptions): Promise<TTSResult> {
    const { text, dialect, speed = 1.0, format = 'mp3' } = options

    // 获取方言对应的 Voice ID
    const voiceId = DIALECT_VOICE_MAP[dialect]
    if (!voiceId) {
      throw new Error(`Unsupported dialect: ${dialect}`)
    }

    // 检查 API Key
    if (!this.isConfigured()) {
      throw new Error('Fish Audio API key not configured')
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          speed,
          format,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Fish Audio API error: ${response.status} - ${error}`)
      }

      // 获取音频数据
      const audioBuffer = await response.arrayBuffer()

      // 上传到存储并获取 URL
      const audioUrl = await this.uploadAudio(audioBuffer, dialect, format)

      // 估算时长（约 3-4 字/秒）
      const duration = Math.ceil(text.length / 3.5)

      return {
        audioUrl,
        duration,
        dialect,
        provider: 'fish_audio',
      }
    } catch (error) {
      console.error('[FishAudio] TTS generation failed:', error)
      throw error
    }
  }

  /**
   * 上传音频到存储
   * TODO: 集成实际的存储服务（Supabase Storage / S3）
   */
  private async uploadAudio(
    buffer: ArrayBuffer,
    dialect: DialectCode,
    format: string
  ): Promise<string> {
    // 临时方案：返回 base64 data URL
    // 生产环境应该上传到 Supabase Storage
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav'
    return `data:${mimeType};base64,${base64}`
  }

  /**
   * 批量生成（用于长文本分段）
   */
  async generateBatch(
    segments: string[],
    dialect: DialectCode,
    options?: { speed?: number }
  ): Promise<TTSResult[]> {
    const results: TTSResult[] = []

    for (const text of segments) {
      const result = await this.generate({
        text,
        dialect,
        speed: options?.speed,
      })
      results.push(result)
    }

    return results
  }

  /**
   * 测试方言支持
   */
  async testDialect(dialect: DialectCode): Promise<boolean> {
    const config = DIALECT_CONFIGS[dialect]
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
}

// 单例实例
let clientInstance: FishAudioClient | null = null

/**
 * 获取 Fish Audio 客户端实例
 */
export function getFishAudioClient(): FishAudioClient {
  if (!clientInstance) {
    clientInstance = new FishAudioClient()
  }
  return clientInstance
}
