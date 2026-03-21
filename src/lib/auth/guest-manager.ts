/**
 * 游客管理器
 * 游客模式，LocalStorage 存储
 */

import { v4 as uuidv4 } from 'uuid'
import type { GuestUser, UserSession, GuestConfig } from './types'

/**
 * 游客管理器配置
 */
interface GuestManagerOptions extends GuestConfig {
  /** 存储 Key */
  storageKey: string
}

/**
 * 游客管理器
 * 使用 LocalStorage（客户端）或内存（服务端）存储游客信息
 */
export class GuestManager {
  private config: GuestManagerOptions
  private memoryStorage: Map<string, UserSession> = new Map()

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
  createGuestSession(deviceFingerprint?: string): UserSession {
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

    // 存储会话
    this.memoryStorage.set(session.sessionId, session)

    return session
  }

  /**
   * 获取游客会话
   */
  getGuestSession(sessionId: string): UserSession | null {
    const session = this.memoryStorage.get(sessionId)
    if (!session) return null

    // 检查是否过期
    if (this.isSessionExpired(session)) {
      this.memoryStorage.delete(sessionId)
      return null
    }

    // 更新最后活跃时间
    session.user.lastActiveAt = new Date()

    return session
  }

  /**
   * 续期游客会话
   */
  renewGuestSession(sessionId: string): UserSession | null {
    const session = this.getGuestSession(sessionId)
    if (!session) return null

    // 续期
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + this.config.expireDays)

    session.expiresAt = expiresAt
    session.user.expiresAt = expiresAt

    this.memoryStorage.set(sessionId, session)

    return session
  }

  /**
   * 删除游客会话
   */
  deleteGuestSession(sessionId: string): boolean {
    return this.memoryStorage.delete(sessionId)
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
   * 清理过期会话
   */
  cleanupExpiredSessions(): number {
    let cleaned = 0
    const now = new Date()

    for (const [sessionId, session] of this.memoryStorage.entries()) {
      if (session.expiresAt < now) {
        this.memoryStorage.delete(sessionId)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * 获取活跃会话数
   */
  getActiveSessionCount(): number {
    return this.memoryStorage.size
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
   * 序列化会话（用于存储到 LocalStorage）
   */
  serializeSession(session: UserSession): string {
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
  deserializeSession(data: string): UserSession | null {
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
