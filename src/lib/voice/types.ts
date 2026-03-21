/**
 * Voice 模块类型定义
 * 用于声音克隆和音色管理
 */

/**
 * 声音配置文件
 */
export interface VoiceProfile {
  id: string
  userId: string
  /** 模型文件路径 */
  modelPath: string
  /** 参考音频路径 */
  referenceAudioPath: string
  /** 样本时长（秒） */
  sampleDuration: number
  /** 质量评分 0-1 */
  quality: number
  /** 创建时间 */
  createdAt: Date
  /** 过期时间 */
  expiresAt: Date
  /** 用户类型 */
  userType: 'guest' | 'wechat'
}

/**
 * 视频处理结果
 */
export interface VideoProcessResult {
  /** 提取的纯净人声路径 */
  audioPath: string
  /** 时长（秒） */
  duration: number
  /** 质量评分 0-1 */
  quality: number
  /** 问题描述 */
  issues: string[]
}

/**
 * 音频质量检测结果
 */
export interface AudioQualityResult {
  /** 质量评分 0-1 */
  score: number
  /** 时长（秒） */
  duration: number
  /** 问题列表 */
  issues: string[]
  /** 信噪比估算 */
  snr?: number
  /** 音量级别 */
  volumeLevel?: number
  /** 是否静音 */
  isSilent?: boolean
}

/**
 * 声音克隆选项
 */
export interface VoiceCloneOptions {
  /** 用户音频文件路径（纯净人声） */
  audioPath: string
  /** 用户 ID */
  userId: string
  /** 录音对应的文本（如果是朗读模式） */
  text?: string
  /** 用户类型 */
  userType: 'guest' | 'wechat'
}

/**
 * 音色转换选项
 */
export interface VoiceConvertOptions {
  /** 输入文本 */
  text: string
  /** 用户声音配置 */
  voiceProfile: VoiceProfile
  /** 输出路径 */
  outputPath: string
  /** 目标方言 */
  dialect?: string
}

/**
 * 上传来源类型
 */
export type UploadSourceType = 'video' | 'audio' | 'recording'

/**
 * 声音上传请求
 */
export interface VoiceUploadRequest {
  /** 文件路径 */
  filePath: string
  /** 来源类型 */
  sourceType: UploadSourceType
  /** 用户 ID */
  userId: string
}

/**
 * 声音上传响应
 */
export interface VoiceUploadResponse {
  /** 处理后的音频路径 */
  audioPath: string
  /** 时长 */
  duration: number
  /** 质量评分 */
  quality: number
  /** 是否需要重新录制 */
  needsRerecord: boolean
  /** 提示信息 */
  message: string
}
