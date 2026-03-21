/**
 * 认证模块入口
 * 统一管理游客模式和 and 微信登录
 */

import type { User, UserSession, AuthState, UserType } from './types'
import { getGuestManager, GuestManager } from './guest-manager'
import { getWechatOAuth, WechatOAuth } from './wechat-oauth'

// 导出所有类型
export * from './types'

// 导出子模块
export { GuestManager, getGuestManager } from './guest-manager'
export { WechatOAuth, getWechatOAuth } from './wechat-oauth'

/**
 * 统一认证服务
 */
export class AuthService {
  private guestManager = getGuestManager()
  private wechatOAuth = getWechatOAuth()

  /**
   * 创建游客会话
   */
  createGuestSession(deviceFingerprint?: string): UserSession {
    return this.guestManager.createGuestSession(deviceFingerprint)
  }

  /**
   * 微信登录
   */
  async wechatLogin(code: string): Promise<UserSession> {
    const response = await this.wechatOAuth.handleLogin({ code })

    if (!response.success || !response.session) {
      throw new Error(response.error || 'WeChat login failed')
    }

    return response.session
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): UserSession | null {
    // 先尝试微信会话
    const wechatSession = this.wechatOAuth.getSession(sessionId)
    if (wechatSession) return wechatSession

    // 再尝试游客会话
    return this.guestManager.getGuestSession(sessionId)
  }

  /**
   * 验证会话
   */
  validateSession(sessionId: string): { valid: boolean; session?: UserSession } {
    const session = this.getSession(sessionId)

    if (!session) {
      return { valid: false }
    }

    // 检查过期
    if (new Date() > session.expiresAt) {
      return { valid: false }
    }

    return { valid: true, session }
  }

  /**
   * 续期会话
   */
  async renewSession(sessionId: string): Promise<UserSession | null> {
    // 根据用户类型选择续期方式
    const session = this.getSession(sessionId)
    if (!session) return null

    if (session.user.type === 'wechat') {
      return this.wechatOAuth.renewSession(sessionId)
    } else {
      return this.guestManager.renewGuestSession(sessionId)
    }
  }

  /**
   * 登出
   */
  logout(sessionId: string): void {
    this.guestManager.deleteGuestSession(sessionId)
    this.wechatOAuth.logout(sessionId)
  }

  /**
   * 将游客升级为微信用户
   */
  async upgradeToWechat(
    guestSessionId: string,
    wechatCode: string
  ): Promise<{ success: boolean; session?: UserSession; error?: string }> {
    const guestSession = this.guestManager.getGuestSession(guestSessionId)
    if (!guestSession) {
      return { success: false, error: 'Guest session not found' }
    }

    // 准备迁移数据
    const migrationData = this.guestManager.prepareUpgradeToWechat(guestSession)

    try {
      // 创建微信会话
      const wechatSession = await this.wechatLogin(wechatCode)

      // TODO: 迁移数据到微信用户
      // - 声音模型
      // - 用户作品
      console.log('[AuthService] Migrating data:', migrationData)

      // 删除游客会话
      this.guestManager.deleteGuestSession(guestSessionId)

      return { success: true, session: wechatSession }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 检查用户类型
   */
  getUserType(user: User): UserType {
    return user.type
  }

  /**
   * 检查是否为微信用户
   */
  isWechatUser(user: User): boolean {
    return user.type === 'wechat'
  }

  /**
   * 检查是否为游客用户
   */
  isGuestUser(user: User): boolean {
    return user.type === 'guest'
  }

  /**
   * 获取微信授权 URL
   */
  getWechatAuthUrl(state?: string): string {
    return this.wechatOAuth.getAuthorizationUrl(state)
  }

  /**
   * 检查微信登录是否可用
   */
  isWechatLoginAvailable(): boolean {
    return this.wechatOAuth.isConfigured()
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): { guest: number; wechat: number } {
    return {
      guest: this.guestManager.cleanupExpiredSessions(),
      wechat: this.wechatOAuth.cleanupExpiredSessions(),
    }
  }

  /**
   * 获取认证状态
   */
  getAuthState(sessionId: string | null): AuthState {
    if (!sessionId) {
      return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      }
    }

    const { valid, session } = this.validateSession(sessionId)

    if (!valid || !session) {
      return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Session expired or invalid',
      }
    }

    return {
      isAuthenticated: true,
      user: session.user,
      isLoading: false,
      error: null,
    }
  }
}

// 单例实例
let authServiceInstance: AuthService | null = null

/**
 * 获取认证服务实例
 */
export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService()
  }
  return authServiceInstance
}
