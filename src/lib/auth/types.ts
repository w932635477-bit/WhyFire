/**
 * 认证模块类型定义
 * 支持游客模式和微信登录
 */

/**
 * 用户类型
 */
export type UserType = 'guest' | 'wechat'

/**
 * 基础用户信息
 */
export interface BaseUser {
  /** 用户 ID */
  id: string
  /** 用户类型 */
  type: UserType
  /** 创建时间 */
  createdAt: Date
  /** 过期时间 */
  expiresAt: Date
  /** 最后活跃时间 */
  lastActiveAt: Date
}

/**
 * 游客用户
 */
export interface GuestUser extends BaseUser {
  type: 'guest'
  /** 设备指纹（用于识别同一设备） */
  deviceFingerprint?: string
  /** 本地存储 Key */
  localStorageKey: string
}

/**
 * 微信用户
 */
export interface WechatUser extends BaseUser {
  type: 'wechat'
  /** 微信 OpenID */
  openId: string
  /** 微信 UnionID（可选） */
  unionId?: string
  /** 昵称 */
  nickname?: string
  /** 头像 */
  avatar?: string
  /** 性别 0-未知 1-男 2-女 */
  gender?: 0 | 1 | 2
  /** 地区 */
  region?: string
}

/**
 * 用户联合类型
 */
export type User = GuestUser | WechatUser

/**
 * 用户会话
 */
export interface UserSession {
  /** 会话 ID */
  sessionId: string
  /** 用户信息 */
  user: User
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌 */
  refreshToken?: string
  /** 创建时间 */
  createdAt: Date
  /** 过期时间 */
  expiresAt: Date
}

/**
 * 微信登录请求
 */
export interface WechatLoginRequest {
  /** 微信授权码 */
  code: string
  /** 设备信息 */
  deviceInfo?: {
    userAgent?: string
    ip?: string
  }
}

/**
 * 微信登录响应
 */
export interface WechatLoginResponse {
  success: boolean
  session?: UserSession
  error?: string
}

/**
 * 微信 OAuth 配置
 */
export interface WechatOAuthConfig {
  appId: string
  appSecret: string
  redirectUri: string
}

/**
 * 微信 API 响应
 */
export interface WechatTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

/**
 * 微信用户信息响应
 */
export interface WechatUserInfoResponse {
  openid: string
  nickname: string
  sex: 0 | 1 | 2
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid?: string
  errcode?: number
  errmsg?: string
}

/**
 * 认证状态
 */
export interface AuthState {
  /** 是否已登录 */
  isAuthenticated: boolean
  /** 当前用户 */
  user: User | null
  /** 是否正在加载 */
  isLoading: boolean
  /** 错误信息 */
  error: string | null
}

/**
 * 游客模式配置
 */
export interface GuestConfig {
  /** 过期天数 */
  expireDays: number
  /** LocalStorage Key 前缀 */
  storageKeyPrefix: string
}

/**
 * 会话存储接口
 */
export interface SessionStorage {
  get(sessionId: string): Promise<UserSession | null>
  set(sessionId: string, session: UserSession): Promise<void>
  delete(sessionId: string): Promise<void>
  refresh(sessionId: string): Promise<UserSession | null>
}
