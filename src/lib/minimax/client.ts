/**
 * MiniMax API 客户端
 * 用于音乐生成
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import {
  MiniMaxClientConfig,
  MiniMaxDialect,
  MiniMaxMusicStyle,
  MusicGenerationParams,
  MusicGenerationResult,
  MiniMaxError,
} from './types'

// 默认配置
const DEFAULT_BASE_URL = 'https://api.minimaxi.com/v1'
const DEFAULT_TIMEOUT = 180000 // 180 秒（音乐生成需要较长时间）
const DEFAULT_MODEL = 'music-2.5+'

// 风格映射
const STYLE_TO_PROMPT: Record<MiniMaxMusicStyle, string> = {
  rap: 'Rap,嘻哈,节奏感强,动感,现代',
  pop: '流行音乐,轻快,朗朗上口,现代',
  electronic: '电子音乐,节奏感强,动感,合成器,现代',
}

/**
 * MiniMax API 客户端类
 */
export class MiniMaxClient {
  private apiKey: string
  private groupId: string
  private baseUrl: string
  private timeout: number

  constructor(config: MiniMaxClientConfig) {
    this.apiKey = config.apiKey
    this.groupId = config.groupId
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL
    this.timeout = config.timeout || DEFAULT_TIMEOUT
  }

  /**
   * 生成音乐
   *
   * 注意：MiniMax API 没有 language 参数，方言是通过歌词内容自动识别的：
   * - 写粤语歌词 → 模型会用粤语发音演唱
   * - 写普通话歌词（带方言词汇）→ 模型会用普通话发音演唱方言词汇
   */
  async generateMusic(params: MusicGenerationParams): Promise<string> {
    const { lyrics, dialect, style = 'rap', duration = 30 } = params

    if (!lyrics || lyrics.trim().length === 0) {
      throw new MiniMaxError('歌词内容不能为空', 400)
    }

    const stylePrompt = STYLE_TO_PROMPT[style] || STYLE_TO_PROMPT.rap

    // 构建提示词，包含风格和时长
    // 注意：MiniMax API 没有 language 参数，方言由歌词内容决定
    const prompt = `${stylePrompt},时长约${Math.round(duration)}秒`

    const requestBody = {
      model: DEFAULT_MODEL,
      prompt,
      lyrics: this.formatLyrics(lyrics),
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3',
      },
    }

    console.log(`[MiniMax] 开始生成音乐...`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseUrl}/music_generation`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new MiniMaxError(`HTTP 错误: ${response.status} - ${errorText}`, response.status)
      }

      const data = await response.json()

      if (data.base_resp?.status_code !== 0) {
        throw new MiniMaxError(
          data.base_resp?.status_msg || '音乐生成失败',
          data.base_resp?.status_code || -1
        )
      }

      if (data.data?.audio) {
        const audioHex = data.data.audio
        const audioBuffer = Buffer.from(audioHex, 'hex')

        // 生成文件名
        const fileName = `music-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`

        // 确保目录存在
        const audioDir = join(process.cwd(), 'public', 'audio')
        if (!existsSync(audioDir)) {
          mkdirSync(audioDir, { recursive: true })
        }

        // 保存文件
        const filePath = join(audioDir, fileName)
        writeFileSync(filePath, audioBuffer)

        const audioUrl = `/audio/${fileName}`
        console.log(`[MiniMax] 音乐生成成功: ${audioUrl}`)

        return audioUrl
      }

      throw new MiniMaxError('未返回音频数据', -1)
    } catch (error) {
      clearTimeout(timeoutId)

      // 处理超时错误
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MiniMaxError(
          '音乐生成超时，请稍后重试。音乐生成通常需要 1-2 分钟，请耐心等待。',
          408
        )
      }

      if (error instanceof MiniMaxError) {
        throw error
      }
      throw new MiniMaxError(
        error instanceof Error ? error.message : '未知错误',
        -1
      )
    }
  }

  /**
   * 格式化歌词
   */
  private formatLyrics(lyrics: string): string {
    if (lyrics.includes('[verse]') || lyrics.includes('[Verse]')) {
      return lyrics
    }

    const paragraphs = lyrics.split(/\n\n+/).filter(p => p.trim())
    if (paragraphs.length <= 1) {
      return `[Verse]\n${lyrics}`
    }

    return paragraphs.map((p, i) => {
      if (i === 0) return `[Verse]\n${p}`
      if (i === paragraphs.length - 1) return `[Chorus]\n${p}`
      return `[Verse]\n${p}`
    }).join('\n\n')
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(taskId: string): Promise<MusicGenerationResult> {
    return { taskId, status: 'completed' }
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    }
  }
}

// 单例客户端
let minimaxClient: MiniMaxClient | null = null

/**
 * 获取 MiniMax 客户端实例
 */
export function getMiniMaxClient(): MiniMaxClient {
  if (!minimaxClient) {
    const apiKey = process.env.MINIMAX_API_KEY
    const groupId = process.env.MINIMAX_GROUP_ID

    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY 环境变量未配置')
    }

    if (!groupId) {
      throw new Error('MINIMAX_GROUP_ID 环境变量未配置')
    }

    minimaxClient = new MiniMaxClient({ apiKey, groupId })
  }

  return minimaxClient
}

export default MiniMaxClient
