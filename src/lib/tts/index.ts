/**
 * TTS 服务模块
 *
 * 使用 CosyVoice 3 进行方言语音合成
 * 支持 8 种方言: 普通话、粤语、四川话、东北话、山东话、上海话、河南话、湖南话
 */

// CosyVoice 3 TTS - 方言语音合成
export {
  CosyVoiceClient,
  getCosyVoiceClient,
  isCosyVoiceDialect,
  type CosyVoiceDialect,
  type CosyVoiceTTSOptions,
  type CosyVoiceTTSResult,
  type CosyVoiceModel,
  type WordTimestamp,
} from './cosyvoice-client'
