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
import { DEFAULT_VIDEO_FILTER, DEFAULT_VIDEO_FILTER_CONFIG } from './video-filters'
import { EFFECT_PRESETS } from './effect-presets'

/**
 * 默认用户特效配置
 */
export const DEFAULT_USER_EFFECTS_CONFIG: UserEffectsConfig = {
  subtitleEffect: 'karaoke-plus',
  videoFilter: 'default', // 使用默认滤镜
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
   * @deprecated 滤镜选择已简化，此方法不再有效果
   */
  setVideoFilter(filter: VideoFilterType): void {
    this.config.preset = undefined // 清除预设
    // 滤镜设置已简化，始终使用默认滤镜
    console.log('[EffectsConfigEngine] 滤镜选择已简化，使用默认滤镜')
  }

  /**
   * 添加额外滤镜
   * @deprecated 滤镜组合已不再支持
   */
  addAdditionalFilter(filter: VideoFilterType): void {
    console.log('[EffectsConfigEngine] 额外滤镜已不再支持，使用默认滤镜')
  }

  /**
   * 移除额外滤镜
   * @deprecated 滤镜组合已不再支持
   */
  removeAdditionalFilter(filter: VideoFilterType): void {
    console.log('[EffectsConfigEngine] 额外滤镜已不再支持，使用默认滤镜')
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

    // 使用默认滤镜（不再支持滤镜选择）
    const ffmpegFilterChain = DEFAULT_VIDEO_FILTER

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
    const preset = this.config.preset ? EFFECT_PRESETS[this.config.preset] : undefined

    return {
      subtitleEffectName: subtitleEffect.name,
      videoFilterName: DEFAULT_VIDEO_FILTER_CONFIG.name,
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

    // 滤镜验证已简化，始终使用默认滤镜

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
