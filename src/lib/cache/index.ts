/**
 * 统一缓存接口
 * 根据配置自动选择 Redis 或内存缓存
 */

import { getRedisCache } from './redis-client'
import { getMemoryCache } from './memory-cache'
import type { CacheOptions } from './redis-client'

/**
 * 缓存提供者类型
 */
export type CacheProvider = 'redis' | 'memory'

/**
 * 缓存接口
 */
export interface ICache {
  get<T>(key: string, options?: CacheOptions): Promise<T | null>
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>
  delete(key: string, options?: CacheOptions): Promise<void>
  exists(key: string, options?: CacheOptions): Promise<boolean>
  expire(key: string, ttl: number, options?: CacheOptions): Promise<void>
  ttl(key: string, options?: CacheOptions): Promise<number>
  incr(key: string, options?: CacheOptions): Promise<number>
  deletePattern(pattern: string, options?: CacheOptions): Promise<number>
  disconnect(): Promise<void>
  healthCheck(): Promise<{ status: 'ok' | 'error'; latency?: number; message?: string }>
}

/**
 * 获取当前缓存提供者
 */
export function getCacheProvider(): CacheProvider {
  const provider = process.env.CACHE_PROVIDER as CacheProvider

  if (provider === 'redis') {
    return 'redis'
  }

  // 检查是否有 Redis 配置
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    return 'redis'
  }

  return 'memory'
}

/**
 * 获取缓存实例
 */
export function getCache(): ICache {
  const provider = getCacheProvider()

  if (provider === 'redis') {
    return getRedisCache()
  }

  return getMemoryCache()
}

// 便捷方法
export async function cacheGet<T>(key: string, prefix?: string): Promise<T | null> {
  return getCache().get<T>(key, { prefix })
}

export async function cacheSet<T>(key: string, value: T, ttl?: number, prefix?: string): Promise<void> {
  return getCache().set<T>(key, value, { ttl, prefix })
}

export async function cacheDelete(key: string, prefix?: string): Promise<void> {
  return getCache().delete(key, { prefix })
}

export async function cacheExists(key: string, prefix?: string): Promise<boolean> {
  return getCache().exists(key, { prefix })
}

export async function cacheExpire(key: string, ttl: number, prefix?: string): Promise<void> {
  return getCache().expire(key, ttl, { prefix })
}

export async function cacheIncr(key: string, prefix?: string): Promise<number> {
  return getCache().incr(key, { prefix })
}

// 导出类型和模块
export { getRedisCache } from './redis-client'
export { getMemoryCache } from './memory-cache'
export type { RedisClientType } from './redis-client'
