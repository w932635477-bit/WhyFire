/**
 * FFmpeg.wasm 类型定义
 */

/**
 * FFmpeg 执行进度信息
 */
export interface FFmpegProgress {
  /** 进度比例 (0-1) */
  ratio: number
  /** 当前处理时间（毫秒） */
  time: number
  /** 总时长（毫秒），可能为 0 如果未知 */
  duration?: number
}

/**
 * 视频分辨率类型
 */
export type VideoResolution = '720p' | '1080p'

/**
 * 视频分辨率配置
 */
export const VIDEO_RESOLUTIONS: Record<VideoResolution, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
}

/**
 * 视频合成选项
 */
export interface VideoSynthesisOptions {
  /** 输入视频文件名（在 FFmpeg 虚拟文件系统中） */
  inputVideo: string
  /** 输入音频文件名（在 FFmpeg 虚拟文件系统中） */
  inputAudio: string
  /** 输出视频文件名 */
  outputVideo: string
  /** 可选：字幕文件名 */
  subtitleFile?: string
  /** 可选：输出分辨率（默认 '720p'） */
  resolution?: VideoResolution
}

/**
 * FFmpeg 加载选项
 */
export interface FFmpegLoadOptions {
  /** 核心文件 URL */
  coreURL?: string
  /** 是否使用多线程（需要 SharedArrayBuffer 支持） */
  multiThread?: boolean
  /** 加载进度回调 */
  onProgress?: (progress: number) => void
  /** 日志回调 */
  onLog?: (message: FFmpegLogMessage) => void
}

/**
 * FFmpeg 日志消息
 */
export interface FFmpegLogMessage {
  /** 日志类型 */
  type: string
  /** 日志消息内容 */
  message: string
}

/**
 * FFmpeg 客户端状态
 */
export type FFmpegClientStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * SharedArrayBuffer 支持检测结果
 */
export interface SharedArrayBufferSupport {
  /** 是否支持 SharedArrayBuffer */
  supported: boolean
  /** 不支持时的原因 */
  reason?: string
  /** 建议的操作 */
  suggestion?: string
}

/**
 * 文件写入选项
 */
export interface WriteFileOptions {
  /** 是否覆盖已存在的文件 */
  overwrite?: boolean
}

/**
 * 文件读取选项
 */
export interface ReadFileOptions {
  /** 文件格式 */
  encoding?: 'binary' | 'utf8'
}

/**
 * FFmpeg 命令执行结果
 */
export interface FFmpegExecResult {
  /** 是否成功 */
  success: boolean
  /** 退出码 */
  exitCode: number
  /** 执行时间（毫秒） */
  duration: number
}
