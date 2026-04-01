// src/lib/audio/index.ts

export * from './types'
export * from './beat-detector'
export * from './timestamp-mapper'
export * from './audio-extractor'
export * from './rhythm-adaptor'
// ffmpeg-processor 是 Node.js 模块（child_process），不能在 barrel 中导出
// 需要时请直接 import from '@/lib/audio/ffmpeg-processor'
// export * from './ffmpeg-processor'
export * from './demucs-client'
export * from './seed-vc-client'

