/**
 * 简单内存缓存模块
 *
 * 用于缓存 BGM 元数据、用户设置等数据
 * 支持 TTL（生存时间）和 LRU 淘汰策略
 *
 * 如果需要持久化缓存，可以替换为 Redis 实现
 */

// ============================================================================
// 类型定义
// ============================================================================

interface CacheEntry<T> {
  value: T
  expiresAt: number
  lastAccessed: number
}

interface CacheOptions {
  /** 默认 TTL（毫秒），默认 5 分钟 */
  defaultTTL?: number
  /** 最大条目数，默认 1000 */
  maxSize?: number
  /** 是否启用调试日志 */
  debug?: boolean
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

// ============================================================================
// 内存缓存实现
// ============================================================================

/**
 * 内存缓存类
 * 使用 LRU (Least Recently Used) 淘汰策略
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTTL: number
  private maxSize: number
  private debug: boolean
  private stats = { hits: 0, misses: 0 }

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 5 分钟
    this.maxSize = options.maxSize || 1000
    this.debug = options.debug || false
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      this.stats.misses++
      if (this.debug) console.log(`[Cache] MISS: ${key}`)
      return null
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      if (this.debug) console.log(`[Cache] EXPIRED: ${key}`)
      return null
    }

    // 更新最后访问时间（LRU）
    entry.lastAccessed = Date.now()
    this.stats.hits++
    if (this.debug) console.log(`[Cache] HIT: ${key}`)
    return entry.value
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // 检查是否需要淘汰
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const actualTTL = ttl ?? this.defaultTTL
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + actualTTL,
      lastAccessed: Date.now(),
    })

    if (this.debug) console.log(`[Cache] SET: ${key} (TTL: ${actualTTL}ms)`)
  }

  /**
   * 删除缓存值
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 检查键是否存在且未过期
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
    if (this.debug) console.log('[Cache] CLEARED')
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    }
  }

  /**
   * 淘汰最久未使用的条目
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      if (this.debug) console.log(`[Cache] EVICT: ${oldestKey}`)
    }
  }
}

// ============================================================================
// 单例实例
// ============================================================================

/** 默认缓存实例 */
export const cache = new MemoryCache({
  defaultTTL: 5 * 60 * 1000, // 5 分钟
  maxSize: 1000,
  debug: process.env.NODE_ENV === 'development',
})

/** BGM 元数据专用缓存（较长的 TTL） */
export const bgmCache = new MemoryCache({
  defaultTTL: 30 * 60 * 1000, // 30 分钟
  maxSize: 100,
})

/** 用户设置缓存（中等 TTL） */
export const userSettingsCache = new MemoryCache({
  defaultTTL: 10 * 60 * 1000, // 10 分钟
  maxSize: 500,
})

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 获取缓存值，如果不存在则执行 factory 函数获取并缓存
 */
export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const value = await factory()
  cache.set(key, value, ttl)
  return value
}

/**
 * 获取 BGM 缓存
 */
export function getBGMCache<T>(key: string): T | null {
  return bgmCache.get<T>(key)
}

/**
 * 设置 BGM 缓存
 */
export function setBGMCache<T>(key: string, value: T, ttl?: number): void {
  bgmCache.set(key, value, ttl)
}

export default cache
