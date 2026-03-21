/**
 * 功能开关配置
 * 用于切换新旧实现方案
 */

/**
 * 功能开关
 */
export const FeatureFlags = {
  /**
   * 使用新版方言配置（8 种方言）
   * @default true
   */
  USE_DIALECT_V2: process.env.USE_DIALECT_V2 !== 'false',

  /**
   * 使用 CosyVoice TTS（替代 Fish Audio）
   * @default true
   */
  USE_COSYVOICE_TTS: process.env.USE_COSYVOICE_TTS !== 'false',

  /**
   * 使用新版 Rhythm Adaptor
   * @default true
   */
  USE_RHYTHM_ADAPTOR_V2: process.env.USE_RHYTHM_ADAPTOR_V2 !== 'false',

  /**
   * 使用新版认证系统
   * @default true
   */
  USE_AUTH_V2: process.env.USE_AUTH_V2 !== 'false',

  /**
   * 使用新版 Beat 管理器
   * @default true
   */
  USE_BEAT_MANAGER_V2: process.env.USE_BEAT_MANAGER_V2 !== 'false',

  /**
   * 使用新版 Voice 模块
   * @default true
   */
  USE_VOICE_MODULE_V2: process.env.USE_VOICE_MODULE_V2 !== 'false',
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(feature: keyof typeof FeatureFlags): boolean {
  return FeatureFlags[feature]
}
