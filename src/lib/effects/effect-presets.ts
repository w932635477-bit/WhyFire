/**
 * 特效预设系统
 * 一键应用适合不同 Rap 风格的特效组合
 *
 * 注意：滤镜系统已简化，所有预设都使用默认滤镜
 */

import { EffectPresetType, EffectPreset, SubtitleEffectType, SubtitleEffectConfig } from './types'

/**
 * 特效预设配置
 * 所有预设都使用默认滤镜 eq=contrast=1.1:saturation=1.1
 */
export const EFFECT_PRESETS: Record<EffectPresetType, EffectPreset> = {
  'trap-king': {
    id: 'trap-king',
    name: 'Trap King',
    description: '硬核 Trap 风格，冲击力强',
    icon: '👑',
    subtitleEffect: 'punch',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#FFD700',
      accentColor: '#FF0000',
      fontSize: 56,
      outlineWidth: 4,
      effectIntensity: 1.2,
    },
  },
  'lofi-vibes': {
    id: 'lofi-vibes',
    name: 'Lofi Vibes',
    description: '轻松 Lofi 风格，怀旧温暖',
    icon: '🎧',
    subtitleEffect: 'wave',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#FFF5E6',
      secondaryColor: '#FFB347',
      fontSize: 48,
      outlineWidth: 2,
      animationSpeed: 0.8,
      effectIntensity: 0.7,
    },
  },
  'cyber-night': {
    id: 'cyber-night',
    name: 'Cyber Night',
    description: '赛博朋克夜景风格',
    icon: '🌙',
    subtitleEffect: 'neon-pulse',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#00FFFF',
      secondaryColor: '#FF00FF',
      accentColor: '#00FF00',
      fontSize: 52,
      outlineWidth: 3,
      effectIntensity: 1.3,
    },
  },
  'old-school': {
    id: 'old-school',
    name: 'Old School',
    description: '经典 Hip-Hop 老派风格',
    icon: '🎤',
    subtitleEffect: 'karaoke-plus',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#FFA500',
      fontSize: 50,
      outlineWidth: 3,
      animationSpeed: 0.9,
    },
  },
  'hardcore': {
    id: 'hardcore',
    name: 'Hardcore',
    description: '极限硬核风格，爆炸冲击',
    icon: '💣',
    subtitleEffect: 'explosion',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#FF0000',
      secondaryColor: '#FFFF00',
      accentColor: '#FF4500',
      fontSize: 60,
      outlineWidth: 5,
      effectIntensity: 1.5,
    },
  },
  'melodic-flow': {
    id: 'melodic-flow',
    name: 'Melodic Flow',
    description: '旋律流动，柔和优美',
    icon: '🌊',
    subtitleEffect: 'bounce-3d',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#E0E7FF',
      secondaryColor: '#818CF8',
      fontSize: 48,
      outlineWidth: 2,
      animationSpeed: 1.1,
      effectIntensity: 0.8,
    },
  },
  'underground': {
    id: 'underground',
    name: 'Underground',
    description: '地下暗黑风格',
    icon: '🖤',
    subtitleEffect: 'glitch-text',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#CCCCCC',
      secondaryColor: '#333333',
      accentColor: '#666666',
      fontSize: 54,
      outlineWidth: 2,
      effectIntensity: 1.0,
    },
  },
}

/**
 * 获取特效预设
 */
export function getEffectPreset(type: EffectPresetType): EffectPreset {
  return EFFECT_PRESETS[type]
}

/**
 * 获取所有特效预设列表
 */
export function getAllEffectPresets(): EffectPreset[] {
  return Object.values(EFFECT_PRESETS)
}

/**
 * 获取推荐的预设
 */
export function getRecommendedPresets(style: string): EffectPresetType[] {
  const styleMapping: Record<string, EffectPresetType[]> = {
    'trap': ['trap-king', 'cyber-night', 'hardcore'],
    'lofi': ['lofi-vibes', 'old-school'],
    'melodic': ['melodic-flow', 'lofi-vibes'],
    'hardcore': ['hardcore', 'trap-king'],
    'cyberpunk': ['cyber-night', 'trap-king'],
    'old-school': ['old-school', 'underground'],
    'drill': ['hardcore', 'trap-king', 'underground'],
    'rnb': ['melodic-flow', 'lofi-vibes'],
    'default': ['old-school', 'trap-king', 'melodic-flow'],
  }

  return styleMapping[style] || styleMapping['default']
}
