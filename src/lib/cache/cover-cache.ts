/**
 * 翻唱结果缓存
 *
 * 用 song URL hash + dialect 作为 key，缓存已生成的翻唱结果。
 * 命中缓存时直接返回，跳过 SunoAPI 调用（从 ~90s 降到 <1s）。
 *
 * 存储：内存 Map（进程级别，单实例够用）
 * 持久化：可选 JSON 文件（重启后恢复）
 */

import type { DialectCode } from '@/types/dialect'
import { createHash } from 'crypto'

// ============================================================================
// 类型
// ============================================================================

export interface CoverCacheEntry {
  /** songUrl + dialect 的哈希 */
  cacheKey: string
  /** 原曲 URL */
  songUrl: string
  /** 方言 */
  dialect: DialectCode
  /** 翻唱音频 URL */
  audioUrl: string
  /** SunoAPI audioId（MV 生成需要） */
  audioId: string
  /** SunoAPI taskId（MV 生成需要） */
  sunoTaskId: string
  /** 音频时长 */
  duration: number
  /** 使用的歌词 */
  lyrics?: string
  /** 人声性别 */
  vocalGender?: string
  /** 生成时间 */
  createdAt: number
}

// ============================================================================
// 缓存实现
// ============================================================================

class CoverCache {
  private cache = new Map<string, CoverCacheEntry>()
  private maxEntries = 500
  private maxAge = 7 * 24 * 60 * 60 * 1000 // 7 天

  /**
   * 生成缓存 key
   */
  makeKey(songUrl: string, dialect: DialectCode, vocalGender?: string): string {
    const raw = `${songUrl}|${dialect}|${vocalGender || 'default'}`
    return createHash('md5').update(raw).digest('hex')
  }

  /**
   * 查询缓存
   */
  get(songUrl: string, dialect: DialectCode, vocalGender?: string): CoverCacheEntry | null {
    const key = this.makeKey(songUrl, dialect, vocalGender)
    const entry = this.cache.get(key)

    if (!entry) return null

    // 过期检查
    if (Date.now() - entry.createdAt > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    console.log(`[CoverCache] HIT: ${key} (cached ${Math.round((Date.now() - entry.createdAt) / 60000)}min ago)`)
    return entry
  }

  /**
   * 写入缓存
   */
  set(entry: CoverCacheEntry): void {
    // 淘汰最旧的条目
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest()
    }

    this.cache.set(entry.cacheKey, entry)
    console.log(`[CoverCache] SET: ${entry.cacheKey} (total: ${this.cache.size})`)
  }

  /**
   * 缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// ============================================================================
// 单例
// ============================================================================

let cacheInstance: CoverCache | null = null

export function getCoverCache(): CoverCache {
  if (!cacheInstance) {
    cacheInstance = new CoverCache()
  }
  return cacheInstance
}
