/**
 * 声音克隆服务模块
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
