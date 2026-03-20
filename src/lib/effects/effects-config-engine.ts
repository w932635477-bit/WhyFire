/**
 * 特效配置引擎
 * 将用户选择的特效配置转换为实际渲染所需的格式
 */

import {
  UserEffectsConfig,
  RenderedEffectsConfig,
  SubtitleEffectType,
  VideoFilterType,
  EffectPresetType,
  LyricLineWithWords,
  SubtitleEffectConfig,
} from './types'
import { generateASSSubtitle, DEFAULT_SUBTITLE_CONFIG, SUBTITLE_EFFECTS } from './subtitle-effects'
import { combineFilters, VIDEO_FILTERS } from './video-filters'
import { EFFECT_PRESETS } from './effect-presets'

/**
 * 默认用户特效配置
 */
export const DEFAULT_USER_EFFECTS_CONFIG: UserEffectsConfig = {
  subtitleEffect: 'karaoke-plus',
  videoFilter: 'none',
  subtitleConfig: DEFAULT_SUBTITLE_CONFIG,
}

/**
 * 特效配置引擎类
 */
export class EffectsConfigEngine {
  private config: UserEffectsConfig

  constructor(config: Partial<UserEffectsConfig> = {}) {
    this.config = { ...DEFAULT_USER_EFFECTS_CONFIG, ...config }

    // 如果提供了预设，自动应用
    if (config.preset) {
      this.setPreset(config.preset)
    }
  }

  /**
   * 设置预设（预设会覆盖单独的特效选择）
   */
  setPreset(presetType: EffectPresetType): void {
    const preset = EFFECT_PRESETS[presetType]
    this.config.preset = presetType
    this.config.subtitleEffect = preset.subtitleEffect
    this.config.videoFilter = preset.videoFilter
    this.config.additionalFilters = preset.additionalFilters

    if (preset.subtitleConfig) {
      this.config.subtitleConfig = {
        ...this.config.subtitleConfig,
        ...preset.subtitleConfig,
      }
    }
  }

  /**
   * 设置字幕特效
   */
  setSubtitleEffect(effect: SubtitleEffectType): void {
    this.config.preset = undefined // 清除预设
    this.config.subtitleEffect = effect
  }

  /**
   * 设置视频滤镜
   */
  setVideoFilter(filter: VideoFilterType): void {
    this.config.preset = undefined // 清除预设
    this.config.videoFilter = filter
  }

  /**
   * 添加额外滤镜
   */
  addAdditionalFilter(filter: VideoFilterType): void {
    if (!this.config.additionalFilters) {
      this.config.additionalFilters = []
    }
    if (!this.config.additionalFilters.includes(filter)) {
      this.config.additionalFilters.push(filter)
    }
  }

  /**
   * 移除额外滤镜
   */
  removeAdditionalFilter(filter: VideoFilterType): void {
    if (this.config.additionalFilters) {
      this.config.additionalFilters = this.config.additionalFilters.filter((f) => f !== filter)
    }
  }

  /**
   * 更新字幕配置
   */
  updateSubtitleConfig(config: Partial<SubtitleEffectConfig>): void {
    this.config.subtitleConfig = {
      ...this.config.subtitleConfig,
      ...config,
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): UserEffectsConfig {
    return { ...this.config }
  }

  /**
   * 渲染特效配置（生成实际的渲染数据）
   */
  render(lyrics: LyricLineWithWords[], subtitleFilename: string = 'subs.ass'): RenderedEffectsConfig {
    // 生成 ASS 字幕内容
    const assContent = generateASSSubtitle(
      lyrics,
      this.config.subtitleEffect,
      this.config.subtitleConfig
    )

    // 生成 FFmpeg 滤镜链
    const allFilters: VideoFilterType[] = [
      this.config.videoFilter,
      ...(this.config.additionalFilters || []),
    ].filter((f) => f !== 'none')

    const ffmpegFilterChain = combineFilters(allFilters)

    return {
      assContent,
      ffmpegFilterChain,
      subtitleFilename,
    }
  }

  /**
   * 获取当前特效的预览信息
   */
  getPreviewInfo(): {
    subtitleEffectName: string
    videoFilterName: string
    presetName?: string
  } {
    const subtitleEffect = SUBTITLE_EFFECTS[this.config.subtitleEffect]
    const videoFilter = VIDEO_FILTERS[this.config.videoFilter]
    const preset = this.config.preset ? EFFECT_PRESETS[this.config.preset] : undefined

    return {
      subtitleEffectName: subtitleEffect.name,
      videoFilterName: videoFilter.name,
      presetName: preset?.name,
    }
  }

  /**
   * 验证配置是否有效
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 验证字幕特效
    if (!SUBTITLE_EFFECTS[this.config.subtitleEffect]) {
      errors.push(`无效的字幕特效: ${this.config.subtitleEffect}`)
    }

    // 验证视频滤镜
    if (!VIDEO_FILTERS[this.config.videoFilter]) {
      errors.push(`无效的视频滤镜: ${this.config.videoFilter}`)
    }

    // 验证额外滤镜
    if (this.config.additionalFilters) {
      for (const filter of this.config.additionalFilters) {
        if (!VIDEO_FILTERS[filter]) {
          errors.push(`无效的额外滤镜: ${filter}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

/**
 * 创建特效配置引擎
 */
export function createEffectsEngine(config?: Partial<UserEffectsConfig>): EffectsConfigEngine {
  return new EffectsConfigEngine(config)
}

/**
 * 快速渲染特效配置（无需创建引擎实例）
 */
export function renderEffects(
  lyrics: LyricLineWithWords[],
  config: Partial<UserEffectsConfig> = {}
): RenderedEffectsConfig {
  const engine = new EffectsConfigEngine(config)
  return engine.render(lyrics)
}
