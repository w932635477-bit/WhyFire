/**
 * 视频特效系统类型定义
 */

// ============================================
// 字幕特效类型
// ============================================

/**
 * 字幕特效类型
 */
export type SubtitleEffectType =
  | 'karaoke-plus'     // 增强卡拉OK
  | 'punch'            // 打击效果
  | 'bounce-3d'        // 3D弹跳
  | 'glitch-text'      // 故障文字
  | 'neon-pulse'       // 霓虹脉冲
  | 'wave'             // 波浪
  | 'explosion'        // 爆炸

/**
 * 字幕特效配置
 */
export interface SubtitleEffect {
  /** 特效ID */
  id: SubtitleEffectType
  /** 特效名称 */
  name: string
  /** 特效描述 */
  description: string
  /** 特效图标 */
  icon: string
  /** 适合的音乐风格 */
  suitableStyles: string[]
  /** 生成ASS特效标签 */
  generateASSEffect: (line: LyricLineWithWords, config: SubtitleEffectConfig) => string
}

/**
 * 字幕特效基础配置
 */
export interface SubtitleEffectConfig {
  /** 主颜色 */
  primaryColor: string
  /** 次要颜色 */
  secondaryColor: string
  /** 强调颜色 */
  accentColor?: string
  /** 字体大小 */
  fontSize: number
  /** 字体名称 */
  fontFamily: string
  /** 描边颜色 */
  outlineColor: string
  /** 描边宽度 */
  outlineWidth: number
  /** 是否启用阴影 */
  shadowEnabled: boolean
  /** 动画速度 (0.5-2.0, 1.0为正常) */
  animationSpeed?: number
  /** 特效强度 (0.5-2.0, 1.0为正常) */
  effectIntensity?: number
}

/**
 * 带词级时间戳的歌词行
 */
export interface LyricLineWithWords {
  id: string
  text: string
  startTime: number // milliseconds
  endTime: number
  words?: LyricWord[]
}

export interface LyricWord {
  text: string
  startTime: number
  endTime: number
}

// ============================================
// 视频滤镜类型（简化版）
// ============================================

/**
 * 视频滤镜类型
 * 只有一个默认选项
 */
export type VideoFilterType = 'default'

/**
 * 视频滤镜配置（简化版）
 */
export interface VideoFilter {
  id: 'default'
  name: string
  description: string
  icon: string
  /** FFmpeg 滤镜字符串 */
  ffmpegFilter: string
  /** 适合的风格 */
  suitableStyles?: string[]
}

// ============================================
// 特效预设类型
// ============================================

/**
 * 特效预设类型
 */
export type EffectPresetType =
  | 'trap-king'
  | 'lofi-vibes'
  | 'cyber-night'
  | 'old-school'
  | 'hardcore'
  | 'melodic-flow'
  | 'underground'

/**
 * 特效预设配置
 */
export interface EffectPreset {
  id: EffectPresetType
  name: string
  description: string
  icon: string
  /** 字幕特效 */
  subtitleEffect: SubtitleEffectType
  /** 视频滤镜 */
  videoFilter: VideoFilterType
  /** 额外的视频滤镜 */
  additionalFilters?: VideoFilterType[]
  /** 字幕配置覆盖 */
  subtitleConfig?: Partial<SubtitleEffectConfig>
}

// ============================================
// 综合特效配置
// ============================================

/**
 * 用户选择的特效配置
 */
export interface UserEffectsConfig {
  /** 字幕特效 */
  subtitleEffect: SubtitleEffectType
  /** 视频滤镜 */
  videoFilter: VideoFilterType
  /** 额外滤镜列表 */
  additionalFilters?: VideoFilterType[]
  /** 或使用预设（预设优先） */
  preset?: EffectPresetType
  /** 字幕配置 */
  subtitleConfig: SubtitleEffectConfig
}

/**
 * 渲染后的特效配置（用于实际渲染）
 */
export interface RenderedEffectsConfig {
  /** ASS 字幕内容 */
  assContent: string
  /** FFmpeg 滤镜链 */
  ffmpegFilterChain: string
  /** 字幕文件名 */
  subtitleFilename: string
}
