/**
 * 微信 OAuth 认证
 * 微信扫码登录
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  WechatUser,
  UserSession,
  WechatOAuthConfig,
  WechatLoginRequest,
  WechatLoginResponse,
  WechatTokenResponse,
  WechatUserInfoResponse,
} from './types'

/**
 * 微信 OAuth 管理器
 */
export class WechatOAuth {
  private config: WechatOAuthConfig
  private sessionStore: Map<string, UserSession> = new Map()

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
      const session = this.createWechatSession(userInfo, tokenResponse)

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
   */
  private createWechatSession(
    userInfo: WechatUserInfoResponse,
    tokenResponse: WechatTokenResponse
  ): UserSession {
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

    const session: UserSession = {
      sessionId: `session_${uuidv4()}`,
      user,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      createdAt: now,
      expiresAt,
    }

    // 存储会话
    this.sessionStore.set(session.sessionId, session)

    return session
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): UserSession | null {
    const session = this.sessionStore.get(sessionId)
    if (!session) return null

    // 检查是否过期
    if (new Date() > session.expiresAt) {
      this.sessionStore.delete(sessionId)
      return null
    }

    // 更新最后活跃时间
    session.user.lastActiveAt = new Date()

    return session
  }

  /**
   * 续期会话
   */
  async renewSession(sessionId: string): Promise<UserSession | null> {
    const session = this.getSession(sessionId)
    if (!session) return null

    // 尝试刷新微信 access_token
    if (session.refreshToken) {
      try {
        const newTokenResponse = await this.refreshAccessToken(session.refreshToken)
        if (!newTokenResponse.errcode) {
          session.accessToken = newTokenResponse.access_token
          session.refreshToken = newTokenResponse.refresh_token
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

    this.sessionStore.set(sessionId, session)

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
  logout(sessionId: string): boolean {
    return this.sessionStore.delete(sessionId)
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
   * 清理过期会话
   */
  cleanupExpiredSessions(): number {
    let cleaned = 0
    const now = new Date()

    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (session.expiresAt < now) {
        this.sessionStore.delete(sessionId)
        cleaned++
      }
    }

    return cleaned
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
