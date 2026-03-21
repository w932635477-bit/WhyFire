/**
 * 内存缓存
 * 用于开发环境或无 Redis 的情况
 *
 * WARNING: 不适合生产环境多实例部署
 */

import type { CacheOptions } from './redis-client'

interface CacheEntry<T> {
  value: T
  expiresAt: number | null
}

/**
 * 内存缓存实现
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // 每分钟清理过期条目
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired()
    }, 60000)
  }

  /**
   * 获取值
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = this.getFullKey(key, options?.prefix)
    const entry = this.cache.get(fullKey) as CacheEntry<T> | undefined

    if (!entry) return null

    // 检查是否过期
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(fullKey)
      return null
    }

    return entry.value
  }

  /**
   * 设置值
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.getFullKey(key, options?.prefix)

    const entry: CacheEntry<T> = {
      value,
      expiresAt: options?.ttl ? Date.now() + options.ttl * 1000 : null,
    }

    this.cache.set(fullKey, entry)
  }

  /**
   * 删除值
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const fullKey = this.getFullKey(key, options?.prefix)
    this.cache.delete(fullKey)
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const value = await this.get(key, options)
    return value !== null
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number, options?: CacheOptions): Promise<void> {
    const fullKey = this.getFullKey(key, options?.prefix)
    const entry = this.cache.get(fullKey)

    if (entry) {
      entry.expiresAt = Date.now() + ttl * 1000
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string, options?: CacheOptions): Promise<number> {
    const fullKey = this.getFullKey(key, options?.prefix)
    const entry = this.cache.get(fullKey)

    if (!entry || !entry.expiresAt) return -1

    const remaining = Math.floor((entry.expiresAt - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  }

  /**
   * 递增值
   */
  async incr(key: string, options?: CacheOptions): Promise<number> {
    const fullKey = this.getFullKey(key, options?.prefix)
    const entry = this.cache.get(fullKey)

    if (!entry || typeof entry.value !== 'number') {
      await this.set(key, 1, options)
      return 1
    }

    const newValue = (entry.value as number) + 1
    entry.value = newValue
    return newValue
  }

  /**
   * 批量删除匹配的键
   */
  async deletePattern(pattern: string, options?: CacheOptions): Promise<number> {
    const fullPattern = this.getFullKey(pattern, options?.prefix)
    const regex = new RegExp('^' + fullPattern.replace(/\*/g, '.*') + '$')

    let count = 0
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * 获取完整键名
   */
  private getFullKey(key: string, prefix?: string): string {
    const basePrefix = process.env.CACHE_PREFIX || 'dialect-rap:'
    const finalPrefix = prefix ? `${basePrefix}${prefix}:` : basePrefix
    return `${finalPrefix}${key}`
  }

  /**
   * 清理过期条目
   */
  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 断开连接（清理定时器）
   */
  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; latency?: number; message?: string }> {
    return { status: 'ok', latency: 0 }
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }
}

// 单例实例
let memoryCacheInstance: MemoryCache | null = null

/**
 * 获取内存缓存实例
 */
export function getMemoryCache(): MemoryCache {
  if (!memoryCacheInstance) {
    memoryCacheInstance = new MemoryCache()
  }
  return memoryCacheInstance
}

// 导出与 Redis 相同的接口
export async function cacheGet<T>(key: string, prefix?: string): Promise<T | null> {
  return getMemoryCache().get<T>(key, { prefix })
}

export async function cacheSet<T>(key: string, value: T, ttl?: number, prefix?: string): Promise<void> {
  return getMemoryCache().set<T>(key, value, { ttl, prefix })
}

export async function cacheDelete(key: string, prefix?: string): Promise<void> {
  return getMemoryCache().delete(key, { prefix })
}
