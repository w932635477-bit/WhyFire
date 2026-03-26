/**
 * 声音克隆服务模块
 *
 * @deprecated 此模块已废弃
 * 请使用 CosyVoice 声音复刻客户端代替: src/lib/tts/cosyvoice-clone-client.ts
 *
 * 新方案：
 * - 用户录音 → CosyVoice 声音复刻 → 复刻音色 + instruction(方言) → 方言语音
 * - 统一使用阿里云 DashScope API，无需自部署
 */

export {
  GPTSoVITSClient,
  getGPTSoVITSClient,
  validateRecording,
  getRecommendedRecordingText,
} from './gpt-sovits-client'

export type {
  VoiceCloningStatus,
  VoiceCloningRequest,
  VoiceCloningResult,
  VoiceModel,
  GPTSoVITSTTSRequest,
  GPTSoVITSTTSResult,
} from './gpt-sovits-client'
