/**
 * 音乐生成模块导出
 *
 * 核心服务:
 * - CosyVoice 3: 方言 TTS (支持 8 种方言)
 * - GPT-SoVITS: 用户声音克隆
 */

// 主要导出
export {
  // 核心功能
  generateMusic,
  startVoiceCloning,
  getVoiceCloningStatus,

  // 辅助功能
  getSupportedDialects,
  isDialectSupported,
  getRecommendedProvider,
  getAvailableProviders,
  isSystemAvailable,
  getSystemStatus,

  // 常量
  MVP_DIALECTS,
  DIALECT_LABELS,
} from './music-router'

// 类型导出
export type {
  MusicStyle,
  MusicProvider,
  MusicGenerationParams,
  MusicGenerationResult,
  VoiceCloningParams,
  VoiceCloningStatusResult,
  DialectType,
} from './music-router'

// 保留旧导出（向后兼容）
export type { MusicGenerationParams as LegacyMusicGenerationParams } from './music-router'
