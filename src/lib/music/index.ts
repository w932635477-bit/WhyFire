/**
 * 音乐生成模块导出
 *
 * 核心服务:
 * - Suno: AI 音乐生成 (Rap)
 * - BGM Library: 背景音乐库
 */

// SunoAPI 客户端导出
export {
  getSunoApiClient,
  SunoApiClient,
  type AddVocalsRequest,
  type AddVocalsResult,
  type SunoApiModel,
} from './suno-api-client'

// BGM 库导出
export {
  BGM_LIBRARY,
  getBGMById,
  getDefaultBGM,
  listAllBGM,
  toSunoStyle,
  type BGMMetadata,
} from './bgm-library'
