/**
 * 微信 OAuth 测试
 * 测试微信登录和授权功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: vi.fn(async () => ({
        data: { provider: 'wechat', url: 'https://open.weixin.qq.com/...' },
        error: null,
      })),
      getSession: vi.fn(async () => ({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
            access_token: 'token-123',
          },
        },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
      onAuthStateChange: vi.fn((callback) => {
        callback('SIGNED_IN', { user: { id: 'user-123' } })
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              id: 'user-123',
              wechat_openid: 'wx_openid_123',
              credits: 100,
            },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(async () => ({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
    })),
  })),
}))

describe('WeChatOAuth', () => {
  let wechatOAuth: any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.WECHAT_APP_ID = 'test_app_id'
    process.env.WECHAT_APP_SECRET = 'test_app_secret'

    const module = await import('../wechat-oauth')
    wechatOAuth = new module.WeChatOAuth()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.WECHAT_APP_ID
    delete process.env.WECHAT_APP_SECRET
  })

  describe('getAuthorizationUrl', () => {
    it('应该生成正确的授权 URL', async () => {
      const redirectUri = 'https://example.com/callback'
      const url = await wechatOAuth.getAuthorizationUrl(redirectUri)

      expect(url).toContain('open.weixin.qq.com')
      expect(url).toContain('appid=test_app_id')
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('response_type=code')
      expect(url).toContain('scope=snsapi_userinfo')
    })

    it('应该支持自定义 scope', async () => {
      const redirectUri = 'https://example.com/callback'
      const url = await wechatOAuth.getAuthorizationUrl(redirectUri, {
        scope: 'snsapi_base',
      })

      expect(url).toContain('scope=snsapi_base')
    })

    it('应该包含 state 参数', async () => {
      const redirectUri = 'https://example.com/callback'
      const url = await wechatOAuth.getAuthorizationUrl(redirectUri, {
        state: 'custom_state_123',
      })

      expect(url).toContain('state=custom_state_123')
    })
  })

  describe('handleCallback', () => {
    it('应该处理授权回调', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access_token_123',
          refresh_token: 'refresh_token_123',
          openid: 'openid_123',
          expires_in: 7200,
        }),
      })

      const code = 'auth_code_123'
      const result = await wechatOAuth.handleCallback(code)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('openid')
      expect(result.openid).toBe('openid_123')
    })

    it('无效 code 应该抛出错误', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          errcode: 40029,
          errmsg: 'invalid code',
        }),
      })

      const code = 'invalid_code'

      await expect(wechatOAuth.handleCallback(code)).rejects.toThrow()
    })

    it('网络错误应该正确处理', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const code = 'auth_code_123'

      await expect(wechatOAuth.handleCallback(code)).rejects.toThrow()
    })
  })

  describe('getUserInfo', () => {
    it('应该获取用户信息', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          openid: 'openid_123',
          nickname: '测试用户',
          headimgurl: 'https://example.com/avatar.jpg',
          sex: 1,
          province: '北京',
          city: '北京',
          country: '中国',
        }),
      })

      const result = await wechatOAuth.getUserInfo('access_token_123', 'openid_123')

      expect(result).toHaveProperty('openid')
      expect(result).toHaveProperty('nickname')
      expect(result).toHaveProperty('headimgurl')
    })

    it('access_token 过期应该抛出错误', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          errcode: 42001,
          errmsg: 'access_token expired',
        }),
      })

      await expect(wechatOAuth.getUserInfo('expired_token', 'openid_123')).rejects.toThrow()
    })
  })

  describe('refreshAccessToken', () => {
    it('应该刷新 access_token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 7200,
        }),
      })

      const result = await wechatOAuth.refreshAccessToken('refresh_token_123')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('无效 refresh_token 应该抛出错误', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          errcode: 40030,
          errmsg: 'invalid refresh_token',
        }),
      })

      await expect(wechatOAuth.refreshAccessToken('invalid_token')).rejects.toThrow()
    })
  })

  describe('signIn', () => {
    it('应该完成微信登录流程', async () => {
      // Mock 获取 access_token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'access_token_123',
          openid: 'openid_123',
          refresh_token: 'refresh_token_123',
          expires_in: 7200,
        }),
      })

      // Mock 获取用户信息
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openid: 'openid_123',
          nickname: '测试用户',
          headimgurl: 'https://example.com/avatar.jpg',
        }),
      })

      const code = 'auth_code_123'
      const result = await wechatOAuth.signIn(code)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('session')
      expect(result.user.openid).toBe('openid_123')
    })
  })

  describe('signOut', () => {
    it('应该成功登出', async () => {
      const result = await wechatOAuth.signOut()

      expect(result.success).toBe(true)
    })
  })

  describe('配置检查', () => {
    it('isConfigured 应该返回配置状态', async () => {
      expect(wechatOAuth.isConfigured()).toBe(true)
    })

    it('缺少配置时应该返回 false', async () => {
      delete process.env.WECHAT_APP_ID

      const { WeChatOAuth } = await import('../wechat-oauth')
      const client = new WeChatOAuth()

      expect(client.isConfigured()).toBe(false)
    })
  })
})

describe('WeChatOAuth 工具函数', () => {
  it('validateWeChatCode 应该验证授权码格式', async () => {
    const { validateWeChatCode } = await import('../wechat-oauth')

    expect(validateWeChatCode('abc123XYZ')).toBe(true)
    expect(validateWeChatCode('')).toBe(false)
    expect(validateWeChatCode(null)).toBe(false)
  })

  it('buildWeChatRedirectUri 应该构建正确的回调 URL', async () => {
    const { buildWeChatRedirectUri } = await import('../wechat-oauth')

    const uri = buildWeChatRedirectUri('example.com', '/auth/callback')

    expect(uri).toBe('https://example.com/auth/callback')
  })

  it('parseWeChatError 应该解析微信错误码', async () => {
    const { parseWeChatError } = await import('../wechat-oauth')

    const error1 = parseWeChatError(40029)
    expect(error1.message).toContain('code')

    const error2 = parseWeChatError(42001)
    expect(error2.message).toContain('token')
  })
})

describe('WeChat OAuth 常量', () => {
  it('应该定义正确的 API URL', async () => {
    const { WECHAT_API_URLS } = await import('../wechat-oauth')

    expect(WECHAT_API_URLS.AUTHORIZE).toContain('open.weixin.qq.com')
    expect(WECHAT_API_URLS.ACCESS_TOKEN).toContain('api.weixin.qq.com')
    expect(WECHAT_API_URLS.USER_INFO).toContain('api.weixin.qq.com')
  })

  it('应该定义正确的 scope 类型', async () => {
    const { WECHAT_SCOPES } = await import('../wechat-oauth')

    expect(WECHAT_SCOPES.BASE).toBe('snsapi_base')
    expect(WECHAT_SCOPES.USER_INFO).toBe('snsapi_userinfo')
  })
})

describe('WeChat OAuth 状态管理', () => {
  it('应该生成和验证 state 参数', async () => {
    const { generateState, validateState } = await import('../wechat-oauth')

    const state = generateState()

    expect(state).toBeDefined()
    expect(state.length).toBeGreaterThan(10)
    expect(validateState(state)).toBe(true)
  })

  it('无效 state 应该验证失败', async () => {
    const { validateState } = await import('../wechat-oauth')

    expect(validateState('invalid_state')).toBe(false)
    expect(validateState('')).toBe(false)
  })
})
