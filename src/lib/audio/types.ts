/**
 * 节拍分析结果
 */
export interface BeatAnalysisResult {
  /** 每分钟节拍数 */
  bpm: number
  /** 第一拍的偏移时间 (ms) */
  offset: number
  /** 节拍间隔 (ms) */
  beatInterval: number
  /** 检测置信度 (0-1) */
  confidence: number
}

/**
 * 节拍分析器配置
 */
export interface BeatDetectorConfig {
  /** 最小 BPM */
  minBpm?: number
  /** 最大 BPM */
  maxBpm?: number
  /** 是否输出详细日志 */
  debug?: boolean
}

/**
 * 时间戳映射配置
 */
export interface TimestampMappingConfig {
  /** 是否对齐到节拍 */
  alignToBeats: boolean
  /** 每个词的最小时长 (ms) */
  minWordDuration: number
  /** 是否生成 words 数组 */
  generateWords: boolean
}
