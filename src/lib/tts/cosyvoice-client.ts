/**
 * CosyVoice 3/3.5 TTS 客户端
 * 支持方言语音合成
 * API 文档: https://help.aliyun.com/zh/model-studio/cosyvoice-websocket-api
 *
 * 模型选择:
 * - cosyvoice-v3-flash (默认): 支持系统音色 + 复刻音色，推荐用于方言 TTS
 * - cosyvoice-v3.5-flash: 仅支持复刻音色，支持更强大的指令控制
 *
 * 支持的方言 (通过 instruction 指令):
 * - 普通话 (mandarin)
 * - 粤语 (cantonese)
 * - 四川话 (sichuan)
 * - 东北话 (dongbei)
 * - 山东话 (shandong)
 * - 上海话 (wu)
 * - 河南话 (henan)
 * - 湖南话 (xiang)
 */

import type { DialectCode } from '@/types/dialect'
import { DIALECT_CONFIGS } from '@/types/dialect'
import { randomUUID } from 'crypto'
import WebSocket from 'ws'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * CosyVoice 方言代码（MVP 需求中指定的 8 种）
 */
export type CosyVoiceDialect =
  | 'mandarin'
  | 'cantonese'
  | 'sichuan'
  | 'dongbei'
  | 'shandong'
  | 'wu'
  | 'henan'
  | 'xiang'

/**
 * TTS 请求选项
 */
export interface CosyVoiceTTSOptions {
  /** 待合成的文本 */
  text: string
  /** 方言类型 */
  dialect: CosyVoiceDialect
  /** 语速 (0.5 - 2.0)，默认 1.0 */
  rate?: number
  /** 音高 (0.5 - 2.0)，默认 1.0 */
  pitch?: number
  /** 音量 (0 - 100)，默认 50 */
  volume?: number
  /** 音频格式 */
  format?: 'mp3' | 'wav' | 'pcm' | 'opus'
  /** 采样率 */
  sampleRate?: 8000 | 16000 | 22050 | 24000 | 44100 | 48000
  /** 复刻音色 ID（使用用户克隆的声音） */
  voiceId?: string
  /** 是否开启字级别时间戳 */
  wordTimestampEnabled?: boolean
  /** 语言提示，提升合成效果 */
  languageHints?: string[]
  /** 方言指令（用于控制方言、情感等） */
  instruction?: string
}

/**
 * TTS 响应结果
 */
export interface CosyVoiceTTSResult {
  /** 音频数据 (Buffer) */
  audioBuffer: Buffer
  /** 音频 URL（如果上传到存储） */
  audioUrl?: string
  /** 估算时长（秒） */
  duration: number
  /** 方言 */
  dialect: CosyVoiceDialect
  /** 服务提供商 */
  provider: 'cosyvoice'
  /** 计费字符数 */
  characters: number
  /** 字级别时间戳信息 */
  wordTimestamps?: WordTimestamp[]
}

/**
 * 字级别时间戳
 */
export interface WordTimestamp {
  text: string
  beginIndex: number
  endIndex: number
  beginTime: number
  endTime: number
}

/**
 * WebSocket 消息头
 */
interface WSHeader {
  action?: string
  task_id?: string
  streaming: string
  event?: string
  error_code?: string
  error_message?: string
  attributes?: Record<string, unknown>
}

/**
 * WebSocket 消息载荷
 */
interface WSPayload {
  task_group?: string
  task?: string
  function?: string
  model?: string
  parameters?: CosyVoiceParameters
  input?: {
    text?: string
  }
  output?: {
    type?: string
    sentence?: {
      index: number
      words: Array<{
        text: string
        begin_index: number
        end_index: number
        begin_time: number
        end_time: number
      }>
    }
    original_text?: string
  }
  usage?: {
    characters: number
  }
}

/**
 * WebSocket 消息
 */
interface WSMessage {
  header: WSHeader
  payload: WSPayload
}

/**
 * CosyVoice 参数
 */
interface CosyVoiceParameters {
  text_type: string
  voice: string
  format: string
  sample_rate: number
  volume: number
  rate: number
  pitch: number
  enable_ssml?: boolean
  word_timestamp_enabled?: boolean
  language_hints?: string[]
  instruction?: string
}

/**
 * CosyVoice 模型类型
 * - v3: 支持系统音色 + 复刻音色
 * - v3.5: 仅支持复刻音色，效果更好
 */
export type CosyVoiceModel = 'cosyvoice-v3-flash' | 'cosyvoice-v3-plus' | 'cosyvoice-v3.5-flash' | 'cosyvoice-v3.5-plus'

/**
 * CosyVoice API 配置
 */
interface CosyVoiceConfig {
  apiKey: string
  /** WebSocket URL */
  wsUrl: string
  /** 连接超时 */
  timeout: number
  /** 默认模型（使用系统音色时） */
  model: CosyVoiceModel
  /** 高级模型（使用复刻音色时） */
  advancedModel: CosyVoiceModel
  /** 默认系统音色 */
  defaultVoice: string
}

/**
 * CosyVoice 方言到 instruction 的映射
 * 基于 CosyVoice v3 的方言指令支持
 */
const DIALECT_INSTRUCTION_MAP: Record<CosyVoiceDialect, string> = {
  mandarin: '请用标准普通话说话。',
  cantonese: '请用广东话表达。',
  sichuan: '请用四川话表达。',
  dongbei: '请用东北话表达。',
  shandong: '请用山东话表达。',
  wu: '请用上海话表达。',
  henan: '请用河南话表达。',
  xiang: '请用湖南话表达。',
}

/**
 * 检查方言是否被 CosyVoice 支持
 */
export function isCosyVoiceDialect(dialect: DialectCode): dialect is CosyVoiceDialect {
  const supportedDialects: CosyVoiceDialect[] = [
    'mandarin',
    'cantonese',
    'sichuan',
    'dongbei',
    'shandong',
    'wu',
    'henan',
    'xiang',
  ]
  return supportedDialects.includes(dialect as CosyVoiceDialect)
}

// ============================================================================
// CosyVoice 客户端
// ============================================================================

/**
 * CosyVoice TTS 客户端
 * 使用 WebSocket 协议与阿里云 DashScope API 通信
 */
export class CosyVoiceClient {
  private config: CosyVoiceConfig

  constructor() {
    const apiKey = process.env.DASHSCOPE_API_KEY
    if (!apiKey) {
      console.warn('[CosyVoice] DASHSCOPE_API_KEY not set, TTS will not work')
    }

    // 判断是否使用国际节点
    const isInternational = process.env.DASHSCOPE_REGION === 'international'
    const wsUrl = isInternational
      ? 'wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference/'
      : 'wss://dashscope.aliyuncs.com/api-ws/v1/inference/'

    this.config = {
      apiKey: apiKey || '',
      wsUrl,
      timeout: 60000, // 60 秒超时
      model: 'cosyvoice-v3-flash', // 系统音色模型（支持方言）
      advancedModel: 'cosyvoice-v3.5-flash', // 复刻音色模型（效果更好）
      defaultVoice: 'longanyang', // 默认系统音色
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
   * @param options TTS 选项
   * @returns TTS 结果
   */
  async generate(options: CosyVoiceTTSOptions): Promise<CosyVoiceTTSResult> {
    const {
      text,
      dialect,
      rate = 1.0,
      pitch = 1.0,
      volume = 50,
      format = 'mp3',
      sampleRate = 22050,
      voiceId,
      wordTimestampEnabled = false,
      languageHints,
      instruction,
    } = options

    // 检查配置
    if (!this.isConfigured()) {
      throw new Error('CosyVoice API key not configured. Please set DASHSCOPE_API_KEY.')
    }

    // 检查方言支持
    if (!isCosyVoiceDialect(dialect)) {
      throw new Error(`Unsupported dialect: ${dialect}. CosyVoice only supports: mandarin, cantonese, sichuan, dongbei, shandong, wu, henan, xiang`)
    }

    // 根据是否使用复刻音色选择模型
    // v3.5 系列仅支持复刻音色，无系统音色
    const model = voiceId ? this.config.advancedModel : this.config.model
    const voice = voiceId || this.config.defaultVoice

    console.log(`[CosyVoice] Generating speech for dialect: ${dialect}, text length: ${text.length}`)
    console.log(`[CosyVoice] Using model: ${model}, voice: ${voiceId ? 'cloned' : 'system'}`)

    // 生成任务 ID
    const taskId = randomUUID()
    console.log(`[CosyVoice] Task ID: ${taskId}`)

    // 收集音频数据
    const audioChunks: Buffer[] = []
    let characters = 0
    const wordTimestamps: WordTimestamp[] = []

    return new Promise((resolve, reject) => {
      // 建立 WebSocket 连接
      const ws = new WebSocket(this.config.wsUrl, {
        headers: {
          Authorization: `bearer ${this.config.apiKey}`,
        },
      })

      // 连接超时处理
      const timeoutId = setTimeout(() => {
        ws.close()
        reject(new Error('WebSocket connection timeout'))
      }, this.config.timeout)

      // 连接成功
      ws.on('open', () => {
        console.log('[CosyVoice] WebSocket connected')

        // 构建参数
        // 注意: instruction 参数仅对复刻音色有效，系统音色需要固定格式
        const parameters: CosyVoiceParameters = {
          text_type: 'PlainText',
          voice,
          format,
          sample_rate: sampleRate,
          volume,
          rate,
          pitch,
          enable_ssml: false,
          word_timestamp_enabled: wordTimestampEnabled,
          language_hints: languageHints || this.getLanguageHints(dialect),
        }

        // 仅复刻音色支持自定义 instruction
        // 系统音色的 instruction 必须使用固定格式（参考音色列表文档）
        if (voiceId && instruction) {
          parameters.instruction = instruction
        } else if (voiceId && !instruction) {
          // 复刻音色默认使用方言指令
          parameters.instruction = DIALECT_INSTRUCTION_MAP[dialect]
        }

        // 发送 run-task 指令
        const runTaskMessage: WSMessage = {
          header: {
            action: 'run-task',
            task_id: taskId,
            streaming: 'duplex',
          },
          payload: {
            task_group: 'audio',
            task: 'tts',
            function: 'SpeechSynthesizer',
            model,
            parameters,
            input: {},
          },
        }

        ws.send(JSON.stringify(runTaskMessage))
        console.log('[CosyVoice] Sent run-task command')
      })

      // 接收消息
      ws.on('message', (data: WebSocket.Data, isBinary: boolean) => {
        if (isBinary) {
          // 二进制音频数据
          const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
          audioChunks.push(buffer)
          return
        }

        // 文本消息（事件）
        try {
          const message: WSMessage = JSON.parse(data.toString())
          const event = message.header.event

          switch (event) {
            case 'task-started':
              console.log('[CosyVoice] Task started, sending text...')
              // 发送 continue-task 指令
              const continueTaskMessage: WSMessage = {
                header: {
                  action: 'continue-task',
                  task_id: taskId,
                  streaming: 'duplex',
                },
                payload: {
                  input: {
                    text,
                  },
                },
              }
              ws.send(JSON.stringify(continueTaskMessage))

              // 发送 finish-task 指令
              const finishTaskMessage: WSMessage = {
                header: {
                  action: 'finish-task',
                  task_id: taskId,
                  streaming: 'duplex',
                },
                payload: {
                  input: {},
                },
              }
              ws.send(JSON.stringify(finishTaskMessage))
              console.log('[CosyVoice] Sent finish-task command')
              break

            case 'result-generated':
              // 处理 result-generated 事件
              if (message.payload.output?.type === 'sentence-end') {
                // 更新计费字符数
                if (message.payload.usage?.characters) {
                  characters = message.payload.usage.characters
                }
              }
              // 收集字级别时间戳
              if (message.payload.output?.sentence?.words) {
                for (const word of message.payload.output.sentence.words) {
                  wordTimestamps.push({
                    text: word.text,
                    beginIndex: word.begin_index,
                    endIndex: word.end_index,
                    beginTime: word.begin_time,
                    endTime: word.end_time,
                  })
                }
              }
              break

            case 'task-finished':
              console.log('[CosyVoice] Task finished')
              clearTimeout(timeoutId)
              ws.close()

              // 合并音频数据
              const audioBuffer = Buffer.concat(audioChunks)

              // 估算时长（约 3-4 字/秒）
              const duration = Math.ceil(text.length / 3.5)

              resolve({
                audioBuffer,
                duration,
                dialect,
                provider: 'cosyvoice',
                characters,
                wordTimestamps: wordTimestamps.length > 0 ? wordTimestamps : undefined,
              })
              break

            case 'task-failed':
              console.error('[CosyVoice] Task failed:', message.header.error_message)
              clearTimeout(timeoutId)
              ws.close()
              reject(new Error(`CosyVoice task failed: ${message.header.error_message}`))
              break
          }
        } catch (error) {
          console.error('[CosyVoice] Failed to parse message:', error)
        }
      })

      // 错误处理
      ws.on('error', (error: Error) => {
        console.error('[CosyVoice] WebSocket error:', error)
        clearTimeout(timeoutId)
        reject(error)
      })

      // 连接关闭
      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`[CosyVoice] WebSocket closed: ${code} - ${reason.toString()}`)
        clearTimeout(timeoutId)
      })
    })
  }

  /**
   * 根据方言获取语言提示
   */
  private getLanguageHints(dialect: CosyVoiceDialect): string[] {
    // 所有方言都是中文变体
    return ['zh']
  }

  /**
   * 上传音频到存储
   * TODO: 集成实际的存储服务（Supabase Storage / S3）
   */
  async uploadAudio(
    buffer: Buffer,
    dialect: CosyVoiceDialect,
    format: string
  ): Promise<string> {
    // 临时方案：返回 base64 data URL
    // 生产环境应该上传到 Supabase Storage
    const base64 = buffer.toString('base64')
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav'
    return `data:${mimeType};base64,${base64}`
  }

  /**
   * 批量生成（用于长文本分段）
   */
  async generateBatch(
    segments: string[],
    dialect: CosyVoiceDialect,
    options?: Partial<CosyVoiceTTSOptions>
  ): Promise<CosyVoiceTTSResult[]> {
    const results: CosyVoiceTTSResult[] = []

    for (const text of segments) {
      const result = await this.generate({
        text,
        dialect,
        ...options,
      })
      results.push(result)
    }

    return results
  }

  /**
   * 测试方言支持
   */
  async testDialect(dialect: CosyVoiceDialect): Promise<boolean> {
    const config = DIALECT_CONFIGS[dialect]
    if (!config) return false

    try {
      await this.generate({
        text: config.sampleText,
        dialect,
      })
      return true
    } catch {
      return false
    }
  }
}

// ============================================================================
// 单例实例
// ============================================================================

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
