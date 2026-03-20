/**
 * MiniMax 库导出
 */

// 客户端
export { MiniMaxClient, getMiniMaxClient } from './client'

// 类型
export type {
  MiniMaxDialect,
  MiniMaxMusicStyle,
  MusicGenerationParams,
  MusicGenerationResult,
  MiniMaxMusicRequest,
  MiniMaxTaskResponse,
  MiniMaxTaskStatusResponse,
  MiniMaxClientConfig,
  MusicGenerateRouteResponse,
  MusicStatusRouteResponse,
} from './types'

export { MiniMaxError } from './types'
