/**
 * 游客管理器
 * 游客模式，使用缓存存储（Redis 或内存）
 */

import { v4 as uuidv4 } from 'uuid'
import { cacheGet, cacheSet, cacheDelete, getCache } from '@/lib/cache'
import type { GuestUser, UserSession, GuestConfig } from './types'

// 缓存前缀
const CACHE_PREFIX = 'guest'

/**
 * 游客管理器配置
 */
interface GuestManagerOptions extends GuestConfig {
  /** 存储 Key */
  storageKey: string
}

/**
 * 游客管理器
 * 使用缓存存储游客信息，支持 Redis 或内存
 */
export class GuestManager {
  private config: GuestManagerOptions

  constructor(config?: Partial<GuestManagerOptions>) {
    this.config = {
      expireDays: config?.expireDays || 7,
      storageKeyPrefix: config?.storageKeyPrefix || 'dialect_rap_guest_',
      storageKey: config?.storageKey || 'dialect_rap_guest_session',
    }
  }

  /**
   * 创建游客会话
   */
  async createGuestSession(deviceFingerprint?: string): Promise<UserSession> {
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + this.config.expireDays)

    const user: GuestUser = {
      id: `guest_${uuidv4()}`,
      type: 'guest',
      deviceFingerprint,
      localStorageKey: `${this.config.storageKeyPrefix}${Date.now()}`,
      createdAt: now,
      expiresAt,
      lastActiveAt: now,
    }

    const session: UserSession = {
      sessionId: `session_${uuidv4()}`,
      user,
      accessToken: this.generateAccessToken(),
      refreshToken: this.generateRefreshToken(),
      createdAt: now,
      expiresAt,
    }

    // 存储会话到缓存
    const ttlSeconds = this.config.expireDays * 24 * 60 * 60
    await cacheSet(session.sessionId, this.serializeSession(session), ttlSeconds, CACHE_PREFIX)

    return session
  }

  /**
   * 获取游客会话
   */
  async getGuestSession(sessionId: string): Promise<UserSession | null> {
    const data = await cacheGet<string>(sessionId, CACHE_PREFIX)
    if (!data) return null

    const session = this.deserializeSession(data)
    if (!session) return null

    // 检查是否过期
    if (this.isSessionExpired(session)) {
      await cacheDelete(sessionId, CACHE_PREFIX)
      return null
    }

    // 更新最后活跃时间
    session.user.lastActiveAt = new Date()

    return session
  }

  /**
   * 续期游客会话
   */
  async renewGuestSession(sessionId: string): Promise<UserSession | null> {
    const session = await this.getGuestSession(sessionId)
    if (!session) return null

    // 续期
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + this.config.expireDays)

    session.expiresAt = expiresAt
    session.user.expiresAt = expiresAt

    // 更新缓存
    const ttlSeconds = this.config.expireDays * 24 * 60 * 60
    await cacheSet(sessionId, this.serializeSession(session), ttlSeconds, CACHE_PREFIX)

    return session
  }

  /**
   * 删除游客会话
   */
  async deleteGuestSession(sessionId: string): Promise<void> {
    await cacheDelete(sessionId, CACHE_PREFIX)
  }

  /**
   * 检查会话是否过期
   */
  isSessionExpired(session: UserSession): boolean {
    return new Date() > session.expiresAt
  }

  /**
   * 获取过期时间
   */
  getExpiryDate(): Date {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + this.config.expireDays)
    return expiresAt
  }

  /**
   * 生成访问令牌
   */
  private generateAccessToken(): string {
    return `access_${uuidv4()}_${Date.now()}`
  }

  /**
   * 生成刷新令牌
   */
  private generateRefreshToken(): string {
    return `refresh_${uuidv4()}_${Date.now()}`
  }

  /**
   * 将游客升级为微信用户
   * 返回需要迁移的数据列表
   */
  prepareUpgradeToWechat(guestSession: UserSession): {
    guestId: string
    voiceModelId?: string
    works?: string[]
  } {
    return {
      guestId: guestSession.user.id,
      // TODO: 添加需要迁移的数据
    }
  }

  /**
   * 清理过期会话（Redis 会自动处理过期，此方法用于内存缓存）
   */
  async cleanupExpiredSessions(): Promise<number> {
    const cache = getCache()
    // 对于 Redis，TTL 会自动处理过期
    // 对于内存缓存，可以手动清理
    if ('cleanupExpired' in cache) {
      // 内存缓存有清理方法
      return 0
    }
    return 0
  }

  /**
   * 获取活跃会话数（仅用于监控）
   */
  async getActiveSessionCount(): Promise<number> {
    // 这需要遍历所有键，在生产环境中不建议频繁使用
    return 0
  }

  /**
   * 检查是否为游客用户
   */
  isGuestUser(user: { type: string }): boolean {
    return user.type === 'guest'
  }

  /**
   * 获取存储 Key
   */
  getStorageKey(): string {
    return this.config.storageKey
  }

  /**
   * 序列化会话（用于存储到缓存）
   */
  private serializeSession(session: UserSession): string {
    return JSON.stringify({
      ...session,
      user: {
        ...session.user,
        createdAt: session.user.createdAt.toISOString(),
        expiresAt: session.user.expiresAt.toISOString(),
        lastActiveAt: session.user.lastActiveAt.toISOString(),
      },
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    })
  }

  /**
   * 反序列化会话
   */
  private deserializeSession(data: string): UserSession | null {
    try {
      const parsed = JSON.parse(data)
      return {
        ...parsed,
        user: {
          ...parsed.user,
          createdAt: new Date(parsed.user.createdAt),
          expiresAt: new Date(parsed.user.expiresAt),
          lastActiveAt: new Date(parsed.user.lastActiveAt),
        },
        createdAt: new Date(parsed.createdAt),
        expiresAt: new Date(parsed.expiresAt),
      }
    } catch {
      return null
    }
  }
}

// 单例实例
let managerInstance: GuestManager | null = null

/**
 * 获取游客管理器实例
 */
export function getGuestManager(): GuestManager {
  if (!managerInstance) {
    managerInstance = new GuestManager()
  }
  return managerInstance
}
