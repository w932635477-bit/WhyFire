/**
 * Redis 缓存客户端
 * 用于替代内存存储，支持多实例部署
 */

import { createClient, RedisClientType } from 'redis'

/**
 * Redis 配置
 */
interface RedisConfig {
  url?: string
  host?: string
  port?: number
  password?: string
  db?: number
}

/**
 * 缓存选项
 */
export interface CacheOptions {
  /** 过期时间（秒） */
  ttl?: number
  /** 前缀 */
  prefix?: string
}

/**
 * Redis 缓存客户端
 * 单例模式，支持连接池
 */
class RedisCache {
  private client: RedisClientType | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10

  /**
   * 初始化 Redis 连接
   */
  async connect(config?: RedisConfig): Promise<void> {
    if (this.isConnected && this.client) {
      return
    }

    const url = config?.url || process.env.REDIS_URL ||
      `redis://${config?.host || process.env.REDIS_HOST || 'localhost'}:${config?.port || process.env.REDIS_PORT || 6379}`

    this.client = createClient({
      url,
      password: config?.password || process.env.REDIS_PASSWORD,
      database: config?.db || parseInt(process.env.REDIS_DB || '0'),
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > this.maxReconnectAttempts) {
            console.error('[Redis] Max reconnection attempts reached')
            return new Error('Max reconnection attempts reached')
          }
          // 指数退避重连
          const delay = Math.min(retries * 100, 3000)
          console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})`)
          return delay
        },
      },
    })

    this.client.on('connect', () => {
      console.log('[Redis] Connected')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.client.on('disconnect', () => {
      console.log('[Redis] Disconnected')
      this.isConnected = false
    })

    this.client.on('error', (err) => {
      console.error('[Redis] Error:', err)
    })

    await this.client.connect()
  }

  /**
   * 确保 Redis 已连接
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected || !this.client) {
      await this.connect()
    }
  }

  /**
   * 获取值
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    await this.ensureConnected()
    if (!this.client) return null

    const fullKey = this.getFullKey(key, options?.prefix)
    const value = await this.client.get(fullKey)

    if (!value) return null

    try {
      return JSON.parse(value) as T
    } catch {
      return value as unknown as T
    }
  }

  /**
   * 设置值
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    await this.ensureConnected()
    if (!this.client) return

    const fullKey = this.getFullKey(key, options?.prefix)
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)

    if (options?.ttl) {
      await this.client.setEx(fullKey, options.ttl, serialized)
    } else {
      await this.client.set(fullKey, serialized)
    }
  }

  /**
   * 删除值
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    await this.ensureConnected()
    if (!this.client) return

    const fullKey = this.getFullKey(key, options?.prefix)
    await this.client.del(fullKey)
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    await this.ensureConnected()
    if (!this.client) return false

    const fullKey = this.getFullKey(key, options?.prefix)
    const result = await this.client.exists(fullKey)
    return result === 1
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number, options?: CacheOptions): Promise<void> {
    await this.ensureConnected()
    if (!this.client) return

    const fullKey = this.getFullKey(key, options?.prefix)
    await this.client.expire(fullKey, ttl)
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string, options?: CacheOptions): Promise<number> {
    await this.ensureConnected()
    if (!this.client) return -1

    const fullKey = this.getFullKey(key, options?.prefix)
    return await this.client.ttl(fullKey)
  }

  /**
   * 递增值
   */
  async incr(key: string, options?: CacheOptions): Promise<number> {
    await this.ensureConnected()
    if (!this.client) return 0

    const fullKey = this.getFullKey(key, options?.prefix)
    return await this.client.incr(fullKey)
  }

  /**
   * 批量删除匹配的键
   */
  async deletePattern(pattern: string, options?: CacheOptions): Promise<number> {
    await this.ensureConnected()
    if (!this.client) return 0

    const fullPattern = this.getFullKey(pattern, options?.prefix)
    const keys = await this.client.keys(fullPattern)

    if (keys.length === 0) return 0

    await this.client.del(keys)
    return keys.length
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
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.isConnected = false
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; latency?: number; message?: string }> {
    try {
      await this.ensureConnected()
      if (!this.client) {
        return { status: 'error', message: 'Client not initialized' }
      }

      const start = Date.now()
      await this.client.ping()
      const latency = Date.now() - start

      return { status: 'ok', latency }
    } catch (error) {
      return { status: 'error', message: String(error) }
    }
  }
}

// 单例实例
let cacheInstance: RedisCache | null = null

/**
 * 获取 Redis 缓存实例
 */
export function getRedisCache(): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache()
  }
  return cacheInstance
}

/**
 * 便捷方法：获取缓存
 */
export async function cacheGet<T>(key: string, prefix?: string): Promise<T | null> {
  return getRedisCache().get<T>(key, { prefix })
}

/**
 * 便捷方法：设置缓存
 */
export async function cacheSet<T>(key: string, value: T, ttl?: number, prefix?: string): Promise<void> {
  return getRedisCache().set<T>(key, value, { ttl, prefix })
}

/**
 * 便捷方法：删除缓存
 */
export async function cacheDelete(key: string, prefix?: string): Promise<void> {
  return getRedisCache().delete(key, { prefix })
}

// 导出类型
export type { RedisClientType }
