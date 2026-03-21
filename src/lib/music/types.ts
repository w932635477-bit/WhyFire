/**
 * 统一音乐生成类型定义
 */

// 从统一的方言类型导入
import type { DialectCode } from '@/types/dialect'
import { DIALECT_CONFIGS } from '@/types/dialect'

// 兼容旧类型
/** @deprecated 使用 DialectCode 代替 */
export type DialectType = DialectCode

// 方言显示名称（从配置导出）
export const DIALECT_LABELS: Record<DialectCode, string> = Object.fromEntries(
  Object.entries(DIALECT_CONFIGS).map(([code, config]) => [code, config.name])
) as Record<DialectCode, string>

// 音乐风格
export type MusicStyle = 'rap' | 'pop' | 'electronic' | 'rock' | 'chill'

// 统一音乐生成参数
export interface MusicGenerationParams {
  lyrics: string
  dialect: DialectCode
  style: MusicStyle
  duration?: number
  voiceId?: string
}

// 统一音乐生成结果
export interface MusicGenerationResult {
  audioUrl: string
  provider: 'minimax' | 'fish_audio'
  taskId?: string
  duration?: number
  dialect: DialectCode
}
