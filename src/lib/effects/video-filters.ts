/**
 * 视频滤镜配置（简化版）
 * 只保留一个安全的默认滤镜，避免 FFmpeg 语法问题
 */

/**
 * 默认视频滤镜
 * 轻微增强对比度和饱和度，适合大多数场景
 *
 * FFmpeg 滤镜说明：
 * - contrast=1.1: 提升对比度 10%
 * - saturation=1.1: 提升饱和度 10%
 *
 * 这个滤镜组合：
 * - 无特殊字符，零语法风险
 * - 效果温和，适合大多数视频
 * - FFmpeg.wasm 完全兼容
 */
export const DEFAULT_VIDEO_FILTER = 'eq=contrast=1.1:saturation=1.1'

/**
 * 默认滤镜配置（用于 UI 显示）
 */
export const DEFAULT_VIDEO_FILTER_CONFIG = {
  id: 'default' as const,
  name: '默认增强',
  description: '轻微提升对比度和饱和度',
  icon: '✨',
  ffmpegFilter: DEFAULT_VIDEO_FILTER,
}

/**
 * 获取默认滤镜字符串
 */
export function getDefaultVideoFilter(): string {
  return DEFAULT_VIDEO_FILTER
}

/**
 * 获取默认滤镜配置
 */
export function getDefaultVideoFilterConfig() {
  return DEFAULT_VIDEO_FILTER_CONFIG
}

// ============================================
// 向后兼容导出（已废弃，但保留以避免破坏性更改）
// ============================================

/**
 * @deprecated 使用 DEFAULT_VIDEO_FILTER 代替
 */
export const VIDEO_FILTERS = {
  default: DEFAULT_VIDEO_FILTER_CONFIG,
}

/**
 * @deprecated 使用 'default' 代替
 */
export type VideoFilterType = 'default'

/**
 * 视频滤镜配置接口
 */
export interface VideoFilter {
  id: 'default'
  name: string
  description: string
  icon: string
  ffmpegFilter: string
  suitableStyles?: string[]
}

/**
 * @deprecated 使用 getDefaultVideoFilterConfig() 代替
 */
export function getVideoFilter(): VideoFilter {
  return DEFAULT_VIDEO_FILTER_CONFIG
}

/**
 * @deprecated 使用 getDefaultVideoFilterConfig() 代替
 */
export function getAllVideoFilters(): VideoFilter[] {
  return [DEFAULT_VIDEO_FILTER_CONFIG]
}

/**
 * @deprecated 滤镜组合已不再支持，直接使用 DEFAULT_VIDEO_FILTER
 */
export function combineFilters(): string {
  return DEFAULT_VIDEO_FILTER
}

/**
 * @deprecated 滤镜推荐已不再支持
 */
export function getRecommendedFilters(): string[] {
  return ['default']
}

// 重命名导出以保持向后兼容
export const DEFAULT_VIDEO_FILTER_VALUE = DEFAULT_VIDEO_FILTER
