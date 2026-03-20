/**
 * 节拍分析结果
 * Note: bpm, offset, tempo 来自 web-audio-beat-detector 库
 * beatInterval, confidence 由应用计算
 */
export interface BeatAnalysisResult {
  /** 每分钟节拍数 (来自库) */
  bpm: number
  /** 第一拍的偏移时间 (秒) - 来自库，应用会转换为毫秒使用 */
  offset: number
  /** 精确节拍速度 (来自库) */
  tempo?: number
  /** 节拍间隔 (ms) - 由应用计算: 60000 / bpm */
  beatInterval: number
  /** 检测置信度 (0-1) - 由应用根据 BPM 合理性计算 */
  confidence?: number
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
