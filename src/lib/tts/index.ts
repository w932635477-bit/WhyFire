/**
 * TTS 服务模块
 */

// Fish Audio TTS (保留作为备用)
export { FishAudioClient, getFishAudioClient } from './fish-audio-client'
export type { TTSOptions, TTSResult } from './fish-audio-client'

// CosyVoice TTS (主要 TTS 服务)
export {
  CosyVoiceClient,
  getCosyVoiceClient,
  isCosyVoiceDialect,
} from './cosyvoice-client'
export type {
  CosyVoiceDialect,
  CosyVoiceTTSOptions,
  CosyVoiceTTSResult,
  WordTimestamp,
} from './cosyvoice-client'
