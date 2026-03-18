/**
 * MiniMax API 客户端
 * 用于音乐生成
 */

import {
  MiniMaxClientConfig,
  MiniMaxDialect,
  MiniMaxMusicRequest,
  MiniMaxMusicStyle,
  MiniMaxTaskResponse,
  MiniMaxTaskStatusResponse,
  MusicGenerationParams,
  MusicGenerationResult,
  MiniMaxError,
} from './types'

// 默认配置
const DEFAULT_BASE_URL = 'https://api.minimax.chat/v1'
const DEFAULT_TIMEOUT = 60000 // 60 秒
const DEFAULT_MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 秒

/**
 * MiniMax API 客户端类
 */
export class MiniMaxClient {
  private apiKey: string
  private groupId: string
  private baseUrl: string
  private timeout: number
  private maxRetries: number

  constructor(config: MiniMaxClientConfig) {
    this.apiKey = config.apiKey
    this.groupId = config.groupId
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL
    this.timeout = config.timeout || DEFAULT_TIMEOUT
    this.maxRetries = config.maxRetries || DEFAULT_MAX_RETRIES
  }

  /**
   * 创建音乐生成任务
   * @param params 音乐生成参数
   * @returns 任务 ID
   */
  async generateMusic(params: MusicGenerationParams): Promise<string> {
    const { lyrics, dialect, style, duration = 30 } = params

    // 验证参数
    this.validateParams(lyrics, dialect, style)

    // 构建请求体
    const requestBody: MiniMaxMusicRequest = {
      lyrics,
      language: dialect,
      style,
      audio_length: duration,
    }

    // 调用 API (带重试)
    const response = await this.requestWithRetry<MiniMaxTaskResponse>(
      `${this.baseUrl}/music_generation`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      }
    )

    // 检查响应
    if (response.base_resp.status_code !== 0) {
      throw new MiniMaxError(
        response.base_resp.status_msg || '音乐生成任务创建失败',
        response.base_resp.status_code
      )
    }

    const taskId = response.data?.task_id
    if (!taskId) {
      throw new MiniMaxError('未返回任务 ID', -1)
    }

    console.log(`[MiniMax] 音乐生成任务已创建: ${taskId}`)
    return taskId
  }

  /**
   * 查询任务状态
   * @param taskId 任务 ID
   * @returns 任务状态和结果
   */
  async getTaskStatus(taskId: string): Promise<MusicGenerationResult> {
    const url = `${this.baseUrl}/music_generation/query?task_id=${taskId}`

    const response = await this.requestWithRetry<MiniMaxTaskStatusResponse>(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    // 检查响应
    if (response.base_resp.status_code !== 0) {
      throw new MiniMaxError(
        response.base_resp.status_msg || '任务状态查询失败',
        response.base_resp.status_code,
        taskId
      )
    }

    const data = response.data
    const result: MusicGenerationResult = {
      taskId: data.task_id,
      status: data.status,
    }

    // 如果任务完成,添加音频信息
    if (data.status === 'completed' && data.audio_file) {
      result.audioUrl = data.audio_file.download_url
      result.duration = data.audio_file.duration
    }

    // 如果任务失败,添加错误信息
    if (data.status === 'failed' && data.error) {
      result.error = data.error
    }

    return result
  }

  /**
   * 轮询等待任务完成
   * @param taskId 任务 ID
   * @param interval 轮询间隔(毫秒), 默认 3000
   * @param maxWait 最大等待时间(毫秒), 默认 300000 (5分钟)
   * @returns 任务结果
   */
  async waitForCompletion(
    taskId: string,
    interval: number = 3000,
    maxWait: number = 300000
  ): Promise<MusicGenerationResult> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWait) {
      const status = await this.getTaskStatus(taskId)

      if (status.status === 'completed') {
        console.log(`[MiniMax] 任务 ${taskId} 已完成`)
        return status
      }

      if (status.status === 'failed') {
        console.error(`[MiniMax] 任务 ${taskId} 失败:`, status.error)
        return status
      }

      // 等待一段时间后继续轮询
      await this.sleep(interval)
    }

    throw new MiniMaxError('任务超时', -1, taskId)
  }

  /**
   * 发送带重试的请求
   */
  private async requestWithRetry<T>(
    url: string,
    options: RequestInit,
    retryCount: number = 0
  ): Promise<T> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new MiniMaxError(
          `HTTP 错误: ${response.status} - ${errorText}`,
          response.status
        )
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      // 判断是否需要重试
      if (this.shouldRetry(error, retryCount)) {
        console.warn(
          `[MiniMax] 请求失败,正在重试 (${retryCount + 1}/${this.maxRetries})...`,
          error instanceof Error ? error.message : String(error)
        )
        await this.sleep(RETRY_DELAY * (retryCount + 1)) // 指数退避
        return this.requestWithRetry<T>(url, options, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: unknown, retryCount: number): boolean {
    if (retryCount >= this.maxRetries) {
      return false
    }

    // 网络错误或 5xx 错误可以重试
    if (error instanceof TypeError) {
      return true // 网络错误
    }

    if (error instanceof MiniMaxError) {
      return error.statusCode >= 500 || error.statusCode === 429 // 服务器错误或限流
    }

    return false
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Group-Id': this.groupId,
    }
  }

  /**
   * 验证参数
   */
  private validateParams(
    lyrics: string,
    dialect: MiniMaxDialect,
    style: MiniMaxMusicStyle
  ): void {
    if (!lyrics || lyrics.trim().length === 0) {
      throw new MiniMaxError('歌词内容不能为空', 400)
    }

    const validDialects: MiniMaxDialect[] = ['mandarin', 'cantonese']
    if (!validDialects.includes(dialect)) {
      throw new MiniMaxError(
        `不支持的方言: ${dialect}, 支持的方言: ${validDialects.join(', ')}`,
        400
      )
    }

    const validStyles: MiniMaxMusicStyle[] = ['pop', 'rap', 'electronic']
    if (!validStyles.includes(style)) {
      throw new MiniMaxError(
        `不支持的音乐风格: ${style}, 支持的风格: ${validStyles.join(', ')}`,
        400
      )
    }
  }

  /**
   * 延时函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
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

    minimaxClient = new MiniMaxClient({
      apiKey,
      groupId,
    })
  }

  return minimaxClient
}

/**
 * 便捷函数: 生成音乐并等待完成
 */
export async function generateMusicWithWait(
  params: MusicGenerationParams
): Promise<MusicGenerationResult> {
  const client = getMiniMaxClient()
  const taskId = await client.generateMusic(params)
  return client.waitForCompletion(taskId)
}

// 默认导出
export default MiniMaxClient
