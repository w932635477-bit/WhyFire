/**
 * CosyVoice 声音复刻客户端
 *
 * 用于克隆用户声音，生成可用于 TTS 的音色
 * API 文档: https://help.aliyun.com/zh/model-studio/cosyvoice-clone-design-api
 *
 * 代理配置: 由 src/lib/proxy.ts 统一管理
 */

// 导入全局代理配置（必须在其他模块之前）
import '@/lib/proxy'

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
    // 官方文档: https://help.aliyun.com/zh/model-studio/cosyvoice-clone-design-api
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization'
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async createVoice(options: CreateVoiceOptions): Promise<CreateVoiceResult> {
    if (!this.apiKey) {
      return { success: false, error: 'DASHSCOPE_API_KEY 未配置' }
    }

    try {
      console.log('[CosyVoice] Creating voice with prefix:', options.prefix)

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'voice-enrollment',
          input: {
            action: 'create_voice',
            target_model: options.targetModel || 'cosyvoice-v3.5-plus',
            prefix: options.prefix,
            url: options.audioUrl,
            language_hints: options.languageHints || ['zh'],
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[CosyVoice] API error:', response.status, errorText)
        return { success: false, error: `API 错误: ${response.status} - ${errorText}` }
      }

      const data = await response.json()
      const voiceId = data.output?.voice_id || data.data?.voice_id

      if (!voiceId) {
        console.error('[CosyVoice] No voice_id in response:', data)
        return { success: false, error: '未返回 voice_id' }
      }

      console.log('[CosyVoice] Voice created:', voiceId)
      return { success: true, voiceId }
    } catch (error) {
      console.error('[CosyVoice] createVoice error:', error)
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
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'voice-enrollment',
            input: {
              action: 'query_voice',
              voice_id: voiceId,
            },
          }),
        })

        if (!response.ok) {
          return { ready: false, error: `查询失败: ${response.status}` }
        }

        const data = await response.json()
        const status = data.output?.status || data.data?.status

        console.log(`[CosyVoice] Voice ${voiceId} status: ${status}`)

        // 阿里云返回的状态可能是: completed, ready, OK
        if (status === 'completed' || status === 'ready' || status === 'OK') {
          return { ready: true, status: 'completed' }
        }

        if (status === 'failed') {
          return { ready: false, status: 'failed', error: '审核未通过' }
        }
      } catch (error) {
        return { ready: false, error: error instanceof Error ? error.message : '查询错误' }
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, interval))
    }

    return { ready: false, error: '等待超时' }
  }

  async deleteVoice(voiceId: string): Promise<DeleteVoiceResult> {
    if (!this.apiKey) {
      return { success: false, error: 'DASHSCOPE_API_KEY 未配置' }
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'voice-enrollment',
          input: {
            action: 'delete_voice',
            voice_id: voiceId,
          },
        }),
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
