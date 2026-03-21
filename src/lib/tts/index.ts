/**
 * TTS 服务模块
 */

// 新版 CosyVoice 客户端
export { CosyVoiceClient, getCosyVoiceClient } from './cosyvoice-client'
export type {
  CosyVoiceOptions,
  CosyVoiceResult,
} from './cosyvoice-client'

// 旧版 Fish Audio 客户端（保留兼容）
/**
 * @deprecated 使用 CosyVoiceClient 替代
 */
export { FishAudioClient, getFishAudioClient } from './fish-audio-client'
export type { TTSOptions, TTSResult } from './fish-audio-client'
