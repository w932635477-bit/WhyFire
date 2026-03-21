/**
 * Rhythm Adaptor 类型定义
 * 用于将普通语音转换为有节奏的 Rap
 */

/**
 * 节奏配置
 */
export interface RhythmConfig {
  /** BPM (Beats Per Minute) */
  bpm: number
  /** 是否启用人性化处理 */
  enableHumanization?: boolean
  /** 时间拉伸模式 */
  stretchMode?: 'simple' | 'high_quality'
  /** 人性化偏移范围（毫秒） */
  humanizeRange?: number
  /** 每拍细分（1=四分音符, 2=八分音符, 4=十六分音符） */
  subdivision?: 1 | 2 | 4
}

/**
 * 音节信息
 */
export interface Syllable {
  /** 音节文本 */
  text: string
  /** 开始时间（毫秒） */
  startTime: number
  /** 结束时间（毫秒） */
  endTime: number
  /** 持续时间（毫秒） */
  duration: number
  /** 音高（可选） */
  pitch?: number
  /** 能量/音量 */
  energy?: number
}

/**
 * 节拍对齐信息
 */
export interface BeatAlignment {
  /** 目标开始时间（毫秒） */
  targetStartTime: number
  /** 目标结束时间（毫秒） */
  targetEndTime: number
  /** 原始音节索引 */
  syllableIndex: number
  /** 所在拍号（0-indexed） */
  beatIndex: number
  /** 拍内位置 (0-1) */
  beatPosition: number
  /** 拉伸比例 */
  stretchRatio: number
  /** 人性化偏移（毫秒） */
  humanizeOffset?: number
}

/**
 * Rhythm Adaptor 处理结果
 */
export interface RhythmAdaptorResult {
  /** 输出音频路径 */
  audioPath: string
  /** 处理时间（毫秒） */
  processingTime: number
  /** 详细信息 */
  details: {
    /** 音节总数 */
    syllableCount: number
    /** 总时长（秒） */
    duration: number
    /** BPM */
    bpm: number
    /** 节拍数 */
    beatCount: number
  }
  /** 对齐信息 */
  alignments: BeatAlignment[]
}

/**
 * 音节切分结果
 */
export interface SyllableSegmentResult {
  /** 音节列表 */
  syllables: Syllable[]
  /** 总时长 */
  duration: number
  /** 原始文本 */
  text: string
}

/**
 * 节拍对齐结果
 */
export interface BeatAlignResult {
  /** 对齐信息列表 */
  alignments: BeatAlignment[]
  /** 总时长（毫秒） */
  totalDuration: number
  /** BPM */
  bpm: number
  /** 节拍数 */
  beatCount: number
}

/**
 * 时间拉伸选项
 */
export interface TimeStretchOptions {
  /** 输入音频路径 */
  inputPath: string
  /** 输出音频路径 */
  outputPath: string
  /** 拉伸比例 */
  ratio: number
  /** 拉伸模式 */
  mode?: 'simple' | 'high_quality'
  /** 保持音高 */
  preservePitch?: boolean
}

/**
 * 人性化处理选项
 */
export interface HumanizeOptions {
  /** 时间偏移范围（毫秒） */
  timeRange: number
  /** 音量变化范围 (0-1) */
  volumeRange?: number
  /** 音高变化范围（半音） */
  pitchRange?: number
  /** 随机种子（可选，用于可重复结果） */
  seed?: number
}
