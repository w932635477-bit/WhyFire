/**
 * MiniMax API 类型定义
 * 音乐生成相关类型
 */

// 支持的方言类型
// 注意: MiniMax API 目前只直接支持 mandarin 和 cantonese
// dongbei 和 sichuan 需要映射到 mandarin，但歌词内容保持方言特色
export type MiniMaxDialect = 'mandarin' | 'cantonese' | 'dongbei' | 'sichuan'

/**
 * 方言映射到 MiniMax API 支持的类型
 * dongbei 和 sichuan 方言的歌词使用方言特色词汇，
 * 但音乐生成时映射到 mandarin
 */
export const DIALECT_TO_MINIMAX_MAPPING: Record<string, 'mandarin' | 'cantonese'> = {
  mandarin: 'mandarin',
  cantonese: 'cantonese',
  dongbei: 'mandarin', // 东北话映射到普通话，歌词保持东北话特色
  sichuan: 'mandarin', // 四川话映射到普通话，歌词保持四川话特色
}

/**
 * 获取 MiniMax API 支持的方言类型
 */
export function getMiniMaxDialect(dialect: MiniMaxDialect): 'mandarin' | 'cantonese' {
  return DIALECT_TO_MINIMAX_MAPPING[dialect] || 'mandarin'
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
