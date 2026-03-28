/**
 * 音乐生成类型定义
 */

import type { DialectCode } from '@/types/dialect'
import { DIALECT_CONFIGS } from '@/types/dialect'

/** @deprecated 使用 DialectCode 代替 */
export type DialectType = DialectCode

export const DIALECT_LABELS: Record<DialectCode, string> = Object.fromEntries(
  Object.entries(DIALECT_CONFIGS).map(([code, config]) => [code, config.name])
) as Record<DialectCode, string>
