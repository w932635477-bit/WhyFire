/**
 * 微信 OAuth 认证
 * 微信扫码登录
 *
 * SECURITY: 使用缓存存储会话，Token 加密存储
 */

import { v4 as uuidv4 } from 'uuid'
import { cacheGet, cacheSet, cacheDelete } from '@/lib/cache'
import { encrypt, decrypt } from '@/lib/crypto'
import type {
  WechatUser,
  UserSession,
  WechatOAuthConfig,
  WechatLoginRequest,
  WechatLoginResponse,
  WechatTokenResponse,
  WechatUserInfoResponse,
} from './types'

// 缓存前缀
const CACHE_PREFIX = 'wechat'

/**
 * 微信 OAuth 管理器
 * 使用缓存存储会话，Token 加密存储
 */
export class WechatOAuth {
  private config: WechatOAuthConfig

  constructor() {
    this.config = {
      appId: process.env.WECHAT_APP_ID || '',
      appSecret: process.env.WECHAT_APP_SECRET || '',
      redirectUri: process.env.WECHAT_REDIRECT_URI || '',
    }

    if (!this.config.appId || !this.config.appSecret) {
      console.warn('[WechatOAuth] WeChat credentials not configured')
    }
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!this.config.appId && !!this.config.appSecret
  }

  /**
   * 获取微信授权 URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      appid: this.config.appId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'snsapi_userinfo',
      state: state || uuidv4(),
    })

    return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`
  }

  /**
   * 处理微信登录
   */
  async handleLogin(request: WechatLoginRequest): Promise<WechatLoginResponse> {
    try {
      // 1. 使用 code 获取 access_token
      const tokenResponse = await this.getAccessToken(request.code)

      if (tokenResponse.errcode) {
        return {
          success: false,
          error: `WeChat API error: ${tokenResponse.errmsg}`,
        }
      }

      // 2. 获取用户信息
      const userInfo = await this.getUserInfo(
        tokenResponse.access_token,
        tokenResponse.openid
      )

      if (userInfo.errcode) {
        return {
          success: false,
          error: `WeChat API error: ${userInfo.errmsg}`,
        }
      }

      // 3. 创建用户会话
      const session = await this.createWechatSession(userInfo, tokenResponse)

      return {
        success: true,
        session,
      }
    } catch (error) {
      console.error('[WechatOAuth] Login failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 获取 Access Token
   */
  private async getAccessToken(code: string): Promise<WechatTokenResponse> {
    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?${new URLSearchParams({
      appid: this.config.appId,
      secret: this.config.appSecret,
      code,
      grant_type: 'authorization_code',
    }).toString()}`

    const response = await fetch(url)
    return response.json()
  }

  /**
   * 获取用户信息
   */
  private async getUserInfo(
    accessToken: string,
    openId: string
  ): Promise<WechatUserInfoResponse> {
    const url = `https://api.weixin.qq.com/sns/userinfo?${new URLSearchParams({
      access_token: accessToken,
      openid: openId,
      lang: 'zh_CN',
    }).toString()}`

    const response = await fetch(url)
    return response.json()
  }

  /**
   * 创建微信用户会话
   * SECURITY: Token 加密存储
   */
  private async createWechatSession(
    userInfo: WechatUserInfoResponse,
    tokenResponse: WechatTokenResponse
  ): Promise<UserSession> {
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 天过期

    const user: WechatUser = {
      id: `wechat_${userInfo.openid}`,
      type: 'wechat',
      openId: userInfo.openid,
      unionId: userInfo.unionid,
      nickname: userInfo.nickname,
      avatar: userInfo.headimgurl,
      gender: userInfo.sex,
      region: `${userInfo.country} ${userInfo.province} ${userInfo.city}`,
      createdAt: now,
      expiresAt,
      lastActiveAt: now,
    }

    // SECURITY: 加密敏感 Token
    const encryptedAccessToken = encrypt(tokenResponse.access_token)
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encrypt(tokenResponse.refresh_token)
      : undefined

    const session: UserSession = {
      sessionId: `session_${uuidv4()}`,
      user,
      accessToken: encryptedAccessToken, // 存储加密后的 Token
      refreshToken: encryptedRefreshToken,
      createdAt: now,
      expiresAt,
    }

    // 存储会话到缓存（30 天）
    const ttlSeconds = 30 * 24 * 60 * 60
    await cacheSet(session.sessionId, this.serializeSession(session), ttlSeconds, CACHE_PREFIX)

    return session
  }

  /**
   * 获取会话
   * SECURITY: 解密 Token
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    const data = await cacheGet<string>(sessionId, CACHE_PREFIX)
    if (!data) return null

    const session = this.deserializeSession(data)
    if (!session) return null

    // 检查是否过期
    if (new Date() > session.expiresAt) {
      await cacheDelete(sessionId, CACHE_PREFIX)
      return null
    }

    // 更新最后活跃时间
    session.user.lastActiveAt = new Date()

    return session
  }

  /**
   * 获取解密后的 Access Token
   * 用于调用微信 API
   */
  async getDecryptedAccessToken(sessionId: string): Promise<string | null> {
    const session = await this.getSession(sessionId)
    if (!session) return null

    try {
      return decrypt(session.accessToken)
    } catch (error) {
      console.error('[WechatOAuth] Token decryption failed:', error)
      return null
    }
  }

  /**
   * 续期会话
   */
  async renewSession(sessionId: string): Promise<UserSession | null> {
    const session = await this.getSession(sessionId)
    if (!session) return null

    // 尝试刷新微信 access_token
    if (session.refreshToken) {
      try {
        const decryptedRefreshToken = decrypt(session.refreshToken)
        const newTokenResponse = await this.refreshAccessToken(decryptedRefreshToken)
        if (!newTokenResponse.errcode) {
          // SECURITY: 加密新 Token
          session.accessToken = encrypt(newTokenResponse.access_token)
          session.refreshToken = encrypt(newTokenResponse.refresh_token)
        }
      } catch (error) {
        console.warn('[WechatOAuth] Token refresh failed:', error)
      }
    }

    // 续期会话
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    session.expiresAt = expiresAt
    session.user.expiresAt = expiresAt

    // 更新缓存
    const ttlSeconds = 30 * 24 * 60 * 60
    await cacheSet(sessionId, this.serializeSession(session), ttlSeconds, CACHE_PREFIX)

    return session
  }

  /**
   * 刷新 Access Token
   */
  private async refreshAccessToken(
    refreshToken: string
  ): Promise<WechatTokenResponse> {
    const url = `https://api.weixin.qq.com/sns/oauth2/refresh_token?${new URLSearchParams({
      appid: this.config.appId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString()}`

    const response = await fetch(url)
    return response.json()
  }

  /**
   * 删除会话（登出）
   */
  async logout(sessionId: string): Promise<void> {
    await cacheDelete(sessionId, CACHE_PREFIX)
  }

  /**
   * 检查 Access Token 是否有效
   */
  async validateToken(accessToken: string, openId: string): Promise<boolean> {
    try {
      const url = `https://api.weixin.qq.com/sns/auth?${new URLSearchParams({
        access_token: accessToken,
        openid: openId,
      }).toString()}`

      const response = await fetch(url)
      const result = await response.json()

      return result.errcode === 0
    } catch {
      return false
    }
  }

  /**
   * 清理过期会话（Redis 自动处理）
   */
  async cleanupExpiredSessions(): Promise<number> {
    // Redis 会根据 TTL 自动清理过期键
    return 0
  }

  /**
   * 序列化会话
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
let oauthInstance: WechatOAuth | null = null

/**
 * 获取微信 OAuth 实例
 */
export function getWechatOAuth(): WechatOAuth {
  if (!oauthInstance) {
    oauthInstance = new WechatOAuth()
  }
  return oauthInstance
}
