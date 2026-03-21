/**
 * Suno Music Generation Client
 * 通过 Evolink API 调用 Suno AI 音乐生成
 * 文档: https://docs.evolink.ai
 */

import type { DialectCode } from '@/types/dialect'

/**
 * Suno 模型类型
 */
export type SunoModel =
  | 'suno-v4-beta'
  | 'suno-v4.5-beta'      // 推荐
  | 'suno-v4.5plus-beta'
  | 'suno-v4.5all-beta'
  | 'suno-v5-beta'

/**
 * 音乐生成请求参数
 */
export interface SunoGenerationRequest {
  /** 歌词内容 */
  lyrics: string
  /** 方言/语言 */
  dialect: DialectCode
  /** 音乐风格 */
  style?: string
  /** 歌曲标题 */
  title?: string
  /** 模型 */
  model?: SunoModel
  /** 是否纯音乐 */
  instrumental?: boolean
  /** 人声性别偏好 */
  vocalGender?: 'm' | 'f'
  /** 回调URL */
  callbackUrl?: string
}

/**
 * 音乐生成结果
 */
export interface SunoGenerationResult {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audioUrl?: string
  duration?: number
  title?: string
  style?: string
  imageUrl?: string
}

/**
 * 任务状态响应
 */
interface TaskResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  results?: string[]
  result_data?: Array<{
    result_id: string
    duration: number
    title: string
    tags: string
    audio_url: string
    image_url: string
  }>
  error?: {
    code: string
    message: string
    type: string
  }
}

/**
 * 方言到 Suno 风格的映射
 */
const DIALECT_STYLE_MAP: Partial<Record<DialectCode, string>> = {
  mandarin: 'mandopop, chinese pop, c-pop',
  cantonese: 'cantonese pop, cantopop, hong kong pop',
  sichuan: 'chinese rap, mandopop, regional chinese',
  dongbei: 'chinese rap, mandopop, northeastern chinese',
  shandong: 'chinese pop, mandopop',
  henan: 'chinese pop, mandopop',
  shaanxi: 'chinese rap, mandopop, folk',
  wu: 'chinese pop, shanghainese style',
  minnan: 'taiwanese pop, hokkien',
  hakka: 'chinese folk, traditional',
  xiang: 'chinese pop, mandopop',
  gan: 'chinese pop, mandopop',
  jin: 'chinese pop, mandopop',
  lanyin: 'chinese pop, mandopop',
  jianghuai: 'chinese pop, mandopop',
  xinan: 'chinese pop, mandopop',
  jiaoliao: 'chinese pop, mandopop',
  zhongyuan: 'chinese pop, mandopop',
  english: 'pop, rap, hip-hop',
}

/**
 * 音乐风格映射
 */
const MUSIC_STYLE_MAP: Record<string, string> = {
  rap: 'rap, hip-hop, trap, rhythmic',
  pop: 'pop, catchy, upbeat',
  electronic: 'electronic, edm, synth',
  rock: 'rock, guitar, drums',
  chill: 'lo-fi, chill, ambient, relaxed',
}

/**
 * Suno Music Client
 */
export class SunoClient {
  private apiKey: string
  private baseUrl: string = 'https://api.evolink.ai'
  private timeout: number = 180000 // 3分钟超时

  constructor() {
    this.apiKey = process.env.SUNO_API_KEY || ''
    if (!this.apiKey) {
      console.warn('[Suno] SUNO_API_KEY not set')
    }
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * 生成音乐
   */
  async generate(request: SunoGenerationRequest): Promise<SunoGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error('Suno API key not configured. Please set SUNO_API_KEY.')
    }

    const {
      lyrics,
      dialect,
      style = 'rap',
      title = 'WhyFire Generated',
      model = 'suno-v4.5-beta',
      vocalGender,
      callbackUrl,
    } = request

    // 构建风格标签
    const dialectStyle = DIALECT_STYLE_MAP[dialect] || 'pop'
    const musicStyle = MUSIC_STYLE_MAP[style] || 'pop'
    const combinedStyle = `${musicStyle}, ${dialectStyle}`

    console.log(`[Suno] Generating music for dialect: ${dialect}, style: ${combinedStyle}`)

    // 创建任务
    const taskResponse = await this.createTask({
      model,
      custom_mode: true,
      instrumental: false,
      prompt: this.formatLyrics(lyrics, dialect),
      style: combinedStyle,
      title,
      vocal_gender: vocalGender,
      callback_url: callbackUrl,
    })

    const taskId = taskResponse.id
    console.log(`[Suno] Task created: ${taskId}`)

    // 轮询等待结果
    const result = await this.pollTask(taskId)

    return {
      taskId,
      status: result.status,
      audioUrl: result.audioUrl,
      duration: result.duration,
      title: result.title,
      style: result.style,
    }
  }

  /**
   * 创建生成任务
   */
  private async createTask(params: {
    model: SunoModel
    custom_mode: boolean
    instrumental: boolean
    prompt: string
    style: string
    title: string
    vocal_gender?: 'm' | 'f'
    callback_url?: string
  }): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/v1/audios/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Suno API error: ${response.status} - ${JSON.stringify(error)}`)
    }

    return await response.json()
  }

  /**
   * 轮询任务状态
   */
  private async pollTask(taskId: string): Promise<SunoGenerationResult> {
    const startTime = Date.now()
    const pollInterval = 3000 // 3秒轮询一次

    while (Date.now() - startTime < this.timeout) {
      const task = await this.getTaskStatus(taskId)

      console.log(`[Suno] Task ${taskId} status: ${task.status}, progress: ${task.progress}%`)

      if (task.status === 'completed') {
        // 返回第一个结果
        if (task.result_data && task.result_data.length > 0) {
          const firstResult = task.result_data[0]
          return {
            taskId,
            status: 'completed',
            audioUrl: firstResult.audio_url,
            duration: firstResult.duration,
            title: firstResult.title,
            style: firstResult.tags,
          }
        }
        // 兼容旧格式
        if (task.results && task.results.length > 0) {
          return {
            taskId,
            status: 'completed',
            audioUrl: task.results[0],
          }
        }
        throw new Error('Task completed but no results found')
      }

      if (task.status === 'failed') {
        throw new Error(`Task failed: ${task.error?.message || 'Unknown error'}`)
      }

      // 等待后继续轮询
      await this.sleep(pollInterval)
    }

    throw new Error('Task timeout - took longer than 3 minutes')
  }

  /**
   * 获取任务状态
   */
  private async getTaskStatus(taskId: string): Promise<TaskResponse> {
    const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to get task status: ${JSON.stringify(error)}`)
    }

    return await response.json()
  }

  /**
   * 格式化歌词（添加段落标签）
   */
  private formatLyrics(lyrics: string, _dialect: DialectCode): string {
    // 如果歌词已经有段落标签，直接返回
    if (lyrics.includes('[Verse]') || lyrics.includes('[Chorus]')) {
      return lyrics
    }

    // 否则添加基本段落标签
    const lines = lyrics.split('\n').filter(line => line.trim())
    const formatted: string[] = ['[Verse 1]']

    let lineCount = 0
    for (const line of lines) {
      formatted.push(line)
      lineCount++

      // 每4行切换段落
      if (lineCount === 4) {
        formatted.push('')
        formatted.push('[Chorus]')
        lineCount = 0
      }
    }

    return formatted.join('\n')
  }

  /**
   * 辅助方法：sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 单例实例
let clientInstance: SunoClient | null = null

/**
 * 获取 Suno 客户端实例
 */
export function getSunoClient(): SunoClient {
  if (!clientInstance) {
    clientInstance = new SunoClient()
  }
  return clientInstance
}
