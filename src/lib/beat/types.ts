/**
 * Beat 模块类型定义
 * Beat 管理和 BPM 检测
 */

/**
 * Beat 文件类型
 */
export interface BeatFile {
  /** Beat ID */
  id: string
  /** 文件名 */
  name: string
  /** 文件路径或 URL */
  path: string
  /** BPM (Beats Per Minute) */
  bpm: number
  /** 时长（秒） */
  duration: number
  /** 分类 */
  category: BeatCategory
  /** 标签 */
  tags: string[]
  /** 是否是预设 Beat */
  isPreset: boolean
  /** 创建时间 */
  createdAt: Date
  /** 缩略图 URL（可选） */
  thumbnailUrl?: string
  /** 描述 */
  description?: string
}

/**
 * Beat 分类
 */
export type BeatCategory =
  | 'energetic'   // 激情
  | 'funny'       // 搞笑
  | 'lyrical'     // 抒情
  | 'general'     // 通用
  | 'custom'      // 用户上传

/**
 * BPM 检测结果
 */
export interface BpmDetectResult {
  /** 检测到的 BPM */
  bpm: number
  /** 置信度 0-1 */
  confidence: number
  /** 候选 BPM 列表 */
  alternatives?: Array<{
    bpm: number
    confidence: number
  }>
}

/**
 * Beat 上传选项
 */
export interface BeatUploadOptions {
  /** 文件路径 */
  filePath: string
  /** 文件名 */
  name: string
  /** 用户 ID */
  userId: string
  /** 是否自动检测 BPM */
  autoDetectBpm?: boolean
}

/**
 * Beat 管理选项
 */
export interface BeatManagerOptions {
  /** 存储目录 */
  storageDir: string
  /** 最大文件大小（字节） */
  maxFileSize: number
  /** 支持的格式 */
  supportedFormats: string[]
}

/**
 * Beat 波形数据
 */
export interface WaveformData {
  /** 采样数据 */
  samples: number[]
  /** 采样率 */
  sampleRate: number
  /** 时长（秒） */
  duration: number
  /** 峰值 */
  peaks: number[]
}

/**
 * Beat 节拍信息
 */
export interface BeatTiming {
  /** 节拍时间点（秒） */
  beats: number[]
  /** 强拍索引 */
  downbeats: number[]
  /** BPM */
  bpm: number
  /** 时间签名 */
  timeSignature: [number, number] // 如 [4, 4] 表示 4/4 拍
}
