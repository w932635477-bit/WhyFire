/**
 * FFmpeg 模块导出
 */

export { FFmpegClient, getFFmpegClient, resetFFmpegClient } from './ffmpeg-client'
export {
  VideoSynthesizer,
  createVideoSynthesizer,
  downloadVideoBlob,
  revokeVideoUrl,
} from './video-synthesizer'
export type {
  FFmpegProgress,
  VideoSynthesisOptions,
  FFmpegLoadOptions,
  FFmpegLogMessage,
  FFmpegClientStatus,
  SharedArrayBufferSupport,
  WriteFileOptions,
  ReadFileOptions,
  FFmpegExecResult,
} from './types'
export type {
  SynthesisStage,
  SynthesisProgress,
  VideoSynthesizerOptions,
  VideoSynthesizerResult,
} from './video-synthesizer'
export {
  VIDEO_TRANSITIONS,
  getTransitionFilter,
  calculateTransitionOffset,
  getDefaultTransition,
  getAvailableTransitions,
  getTransitionInfo,
} from './transitions'
export type {
  TransitionType,
  VideoTransition,
} from './transitions'

// 滤镜系统已简化，重新导出默认滤镜
export {
  DEFAULT_VIDEO_FILTER,
  DEFAULT_VIDEO_FILTER_CONFIG,
  getDefaultVideoFilter,
  getDefaultVideoFilterConfig,
} from '../effects/video-filters'
