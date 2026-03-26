/**
 * 音乐生成模块导出
 *
 * 核心服务:
 * - Suno: AI 音乐生成 (Rap)
 * - BGM Library: 背景音乐库
 */

// Suno 客户端导出
export {
  getSunoClient,
  type SunoClient,
  type SunoModel,
  type SunoGenerationRequest,
  type SunoGenerationResult,
} from './suno-client'

// BGM 库导出
export {
  BGM_LIBRARY,
  getBGMById,
  getDefaultBGM,
  listAllBGM,
  toSunoStyle,
  type BGMMetadata,
} from './bgm-library'
