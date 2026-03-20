/**
 * MiniMax API 类型定义
 * 音乐生成相关类型
 */

// 支持的方言/语言类型
// MiniMax Music API 通过歌词内容自动识别语言，无需显式指定
// 支持的语言：普通话、粤语、英语
export type MiniMaxDialect = 'mandarin' | 'cantonese' | 'english'

/**
 * 方言显示名称
 */
export const DIALECT_LABELS: Record<MiniMaxDialect, string> = {
  mandarin: '普通话',
  cantonese: '粤语',
  english: 'English',
}

// 支持的音乐风格
export type MiniMaxMusicStyle = 'pop' | 'rap' | 'electronic'

// 音乐生成参数
export interface MusicGenerationParams {
  /** 歌词内容 */
  lyrics: string
  /** 方言: mandarin(普通话) | cantonese(粤语) */
  dialect: MiniMaxDialect
  /** 音乐风格: pop | rap | electronic */
  style: MiniMaxMusicStyle
  /** 音频时长(秒), 默认 30 秒 */
  duration?: number
}

// MiniMax API 请求体
export interface MiniMaxMusicRequest {
  /** 歌词文本 */
  lyrics: string
  /** 语言/方言 */
  language: MiniMaxDialect
  /** 音乐风格 */
  style: MiniMaxMusicStyle
  /** 生成音频时长 */
  audio_length: number
}

// MiniMax API 响应 - 任务创建成功
export interface MiniMaxTaskResponse {
  /** 基础响应 */
  base_resp: {
    status_code: number
    status_msg: string
  }
  /** 任务数据 */
  data: {
    /** 任务 ID */
    task_id: string
  }
}

// MiniMax API 响应 - 任务状态查询
export interface MiniMaxTaskStatusResponse {
  /** 基础响应 */
  base_resp: {
    status_code: number
    status_msg: string
  }
  /** 任务数据 */
  data: {
    /** 任务 ID */
    task_id: string
    /** 任务状态: pending | processing | completed | failed */
    status: 'pending' | 'processing' | 'completed' | 'failed'
    /** 生成的音频文件信息 (仅在 completed 状态时返回) */
    audio_file?: {
      /** 音频下载 URL */
      download_url: string
      /** 音频时长(秒) */
      duration: number
    }
    /** 错误信息 (仅在 failed 状态时返回) */
    error?: string
  }
}

// 音乐生成结果 (内部使用)
export interface MusicGenerationResult {
  /** 任务 ID */
  taskId: string
  /** 任务状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** 音频下载 URL (completed 时有值) */
  audioUrl?: string
  /** 音频时长(秒) */
  duration?: number
  /** 错误信息 (failed 时有值) */
  error?: string
}

// API 路由响应 - 创建任务
export interface MusicGenerateRouteResponse {
  code: number
  data: {
    taskId: string
    status: string
  }
  message?: string
}

// API 路由响应 - 查询状态
export interface MusicStatusRouteResponse {
  code: number
  data: MusicGenerationResult
  message?: string
}

// MiniMax 客户端配置
export interface MiniMaxClientConfig {
  /** API Key */
  apiKey: string
  /** Group ID */
  groupId: string
  /** API 基础 URL */
  baseUrl?: string
  /** 请求超时(毫秒) */
  timeout?: number
  /** 重试次数 */
  maxRetries?: number
}

// MiniMax API 错误
export class MiniMaxError extends Error {
  public statusCode: number
  public taskId?: string

  constructor(message: string, statusCode: number, taskId?: string) {
    super(message)
    this.name = 'MiniMaxError'
    this.statusCode = statusCode
    this.taskId = taskId
  }
}
