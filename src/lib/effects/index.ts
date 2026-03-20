/**
 * 视频特效系统
 * 导出所有特效相关模块
 */

// Types
export * from './types'

// Subtitle Effects
export {
  SUBTITLE_EFFECTS,
  DEFAULT_SUBTITLE_CONFIG,
  getSubtitleEffect,
  getAllSubtitleEffects,
  generateASSSubtitle,
} from './subtitle-effects'

// Video Filters
export {
  VIDEO_FILTERS,
  getVideoFilter,
  getAllVideoFilters,
  combineFilters,
  getRecommendedFilters,
} from './video-filters'

// Effect Presets
export {
  EFFECT_PRESETS,
  getEffectPreset,
  getAllEffectPresets,
  getRecommendedPresets,
} from './effect-presets'

// Effects Config Engine
export {
  EffectsConfigEngine,
  DEFAULT_USER_EFFECTS_CONFIG,
  createEffectsEngine,
  renderEffects,
} from './effects-config-engine'
