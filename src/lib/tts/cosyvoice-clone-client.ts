/**
 * CosyVoice 声音复刻客户端
 *
 * 用于克隆用户声音，生成可用于 TTS 的音色
 * API 文档: https://help.aliyun.com/zh/model-studio/cosyvoice-clone-design-api
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface CreateVoiceOptions {
  /** 音频 URL（公网可访问） */
  audioUrl: string
  /** 音色前缀（仅允许数字和英文字母，不超过10个字符） */
  prefix: string
  /** 目标模型 */
  targetModel?: string
  /** 语言提示 */
  languageHints?: string[]
}

export interface CreateVoiceResult {
  success: boolean
  voiceId?: string
  error?: string
}

export interface VoiceStatusResult {
  ready: boolean
  status?: 'created' | 'pending' | 'completed' | 'failed'
  error?: string
}

export interface DeleteVoiceResult {
  success: boolean
  error?: string
}

interface ICosyVoiceCloneClient {
  isConfigured(): boolean
  createVoice(options: CreateVoiceOptions): Promise<CreateVoiceResult>
  waitForVoiceReady(voiceId: string, timeout?: number, interval?: number): Promise<VoiceStatusResult>
  deleteVoice(voiceId: string): Promise<DeleteVoiceResult>
}

// ============================================================================
// 实现
// ============================================================================

class CosyVoiceCloneClient implements ICosyVoiceCloneClient {
  private apiKey: string | undefined
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/v2'
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async createVoice(options: CreateVoiceOptions): Promise<CreateVoiceResult> {
    if (!this.apiKey) {
      return { success: false, error: 'DASHSCOPE_API_KEY 未配置' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.targetModel || 'cosyvoice-v3-flash',
          voice_prefix: options.prefix,
          ref_audio_urls: [options.audioUrl],
          language_hints: options.languageHints || ['zh'],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `API 错误: ${response.status} - ${errorText}` }
      }

      const data = await response.json()
      const voiceId = data.output?.voice_id || data.data?.voice_id

      if (!voiceId) {
        return { success: false, error: '未返回 voice_id' }
      }

      return { success: true, voiceId }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }

  async waitForVoiceReady(
    voiceId: string,
    timeout: number = 300000,
    interval: number = 5000
  ): Promise<VoiceStatusResult> {
    if (!this.apiKey) {
      return { ready: false, error: 'DASHSCOPE_API_KEY 未配置' }
    }

    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        })

        if (!response.ok) {
          return { ready: false, error: `查询失败: ${response.status}` }
        }

        const data = await response.json()
        const status = data.output?.status || data.data?.status

        if (status === 'completed' || status === 'ready') {
          return { ready: true, status: 'completed' }
        }

        if (status === 'failed') {
          return { ready: false, status: 'failed', error: '审核未通过' }
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, interval))
      } catch (error) {
        return { ready: false, error: error instanceof Error ? error.message : '查询错误' }
      }
    }

    return { ready: false, error: '等待超时' }
  }

  async deleteVoice(voiceId: string): Promise<DeleteVoiceResult> {
    if (!this.apiKey) {
      return { success: false, error: 'DASHSCOPE_API_KEY 未配置' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        return { success: false, error: `删除失败: ${response.status}` }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '删除错误' }
    }
  }
}

// ============================================================================
// 单例导出
// ============================================================================

let clientInstance: CosyVoiceCloneClient | null = null

export function getCosyVoiceCloneClient(): ICosyVoiceCloneClient {
  if (!clientInstance) {
    clientInstance = new CosyVoiceCloneClient()
  }
  return clientInstance
}
