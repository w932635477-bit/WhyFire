/**
 * 游客管理器测试
 * 测试游客模式和临时用户功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: null },
        error: null,
      })),
      signInAnonymously: vi.fn(async () => ({
        data: { user: { id: 'guest-123', is_anonymous: true } },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { credits: 5, used_today: false },
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

describe('GuestManager', () => {
  let guestManager: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../guest-manager')
    guestManager = new module.GuestManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createGuestSession', () => {
    it('应该创建游客会话', async () => {
      const result = await guestManager.createGuestSession()

      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('isGuest')
      expect(result.isGuest).toBe(true)
      expect(result.userId).toMatch(/^guest_/)
    })

    it('游客会话应该有过期时间', async () => {
      const result = await guestManager.createGuestSession()

      expect(result).toHaveProperty('expiresAt')
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now())
    })

    it('应该生成唯一的游客 ID', async () => {
      const sessions = await Promise.all([
        guestManager.createGuestSession(),
        guestManager.createGuestSession(),
        guestManager.createGuestSession(),
      ])

      const ids = sessions.map((s: any) => s.userId)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })
  })

  describe('getGuestCredits', () => {
    it('游客应该有初始积分', async () => {
      const session = await guestManager.createGuestSession()
      const credits = await guestManager.getGuestCredits(session.userId)

      expect(credits).toHaveProperty('total')
      expect(credits).toHaveProperty('used')
      expect(credits).toHaveProperty('remaining')
      expect(credits.total).toBeGreaterThan(0)
    })

    it('游客默认应该有 5 次免费额度', async () => {
      const session = await guestManager.createGuestSession()
      const credits = await guestManager.getGuestCredits(session.userId)

      expect(credits.total).toBe(5)
      expect(credits.remaining).toBe(5)
    })

    it('使用后剩余积分应该减少', async () => {
      const session = await guestManager.createGuestSession()

      await guestManager.useCredit(session.userId)
      const credits = await guestManager.getGuestCredits(session.userId)

      expect(credits.remaining).toBe(4)
      expect(credits.used).toBe(1)
    })
  })

  describe('useCredit', () => {
    it('应该成功使用积分', async () => {
      const session = await guestManager.createGuestSession()

      const result = await guestManager.useCredit(session.userId)

      expect(result.success).toBe(true)
      expect(result.remainingCredits).toBe(4)
    })

    it('积分不足时应该返回错误', async () => {
      const session = await guestManager.createGuestSession()

      // 用完所有积分
      for (let i = 0; i < 5; i++) {
        await guestManager.useCredit(session.userId)
      }

      // 再尝试使用
      const result = await guestManager.useCredit(session.userId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('insufficient')
    })
  })

  describe('validateGuestSession', () => {
    it('有效的会话应该通过验证', async () => {
      const session = await guestManager.createGuestSession()

      const isValid = await guestManager.validateGuestSession(session.userId)

      expect(isValid).toBe(true)
    })

    it('过期会话应该不通过验证', async () => {
      const session = await guestManager.createGuestSession()

      // 模拟过期
      vi.useFakeTimers()
      vi.advanceTimersByTime(25 * 60 * 60 * 1000) // 25 小时后

      const isValid = await guestManager.validateGuestSession(session.userId)

      expect(isValid).toBe(false)

      vi.useRealTimers()
    })

    it('无效 ID 应该不通过验证', async () => {
      const isValid = await guestManager.validateGuestSession('invalid_id')

      expect(isValid).toBe(false)
    })
  })

  describe('convertToRegistered', () => {
    it('应该将游客转换为注册用户', async () => {
      const session = await guestManager.createGuestSession()

      const result = await guestManager.convertToRegistered(session.userId, {
        email: 'test@example.com',
        wechatOpenId: 'wx_123',
      })

      expect(result.success).toBe(true)
      expect(result.userId).toBe(session.userId)
      expect(result.isGuest).toBe(false)
    })

    it('转换后应该保留使用记录', async () => {
      const session = await guestManager.createGuestSession()

      // 使用一些积分
      await guestManager.useCredit(session.userId)
      await guestManager.useCredit(session.userId)

      const result = await guestManager.convertToRegistered(session.userId, {
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
      // 历史记录应该被保留
      expect(result.creditsUsed).toBe(2)
    })
  })

  describe('clearGuestSession', () => {
    it('应该清除游客会话', async () => {
      const session = await guestManager.createGuestSession()

      await guestManager.clearGuestSession(session.userId)

      const isValid = await guestManager.validateGuestSession(session.userId)
      expect(isValid).toBe(false)
    })

    it('清除后数据应该被删除', async () => {
      const session = await guestManager.createGuestSession()
      await guestManager.useCredit(session.userId)

      await guestManager.clearGuestSession(session.userId)

      const credits = await guestManager.getGuestCredits(session.userId)
      expect(credits).toBeNull()
    })
  })

  describe('每日限制', () => {
    it('游客每天有生成次数限制', async () => {
      const session = await guestManager.createGuestSession()

      const limit = await guestManager.getDailyLimit(session.userId)

      expect(limit).toHaveProperty('max')
      expect(limit).toHaveProperty('used')
      expect(limit.max).toBe(5)
    })

    it('超过每日限制应该被阻止', async () => {
      const session = await guestManager.createGuestSession()

      // 用完每日限制
      for (let i = 0; i < 5; i++) {
        await guestManager.useCredit(session.userId)
      }

      const canUse = await guestManager.canUseCredit(session.userId)
      expect(canUse).toBe(false)
    })
  })
})

describe('GuestManager 工具函数', () => {
  it('isGuestUser 应该正确识别游客用户', async () => {
    const { isGuestUser } = await import('../guest-manager')

    expect(isGuestUser('guest_123')).toBe(true)
    expect(isGuestUser('user_123')).toBe(false)
    expect(isGuestUser('123e4567-e89b-12d3-a456-426614174000')).toBe(false)
  })

  it('generateGuestId 应该生成有效的游客 ID', async () => {
    const { generateGuestId } = await import('../guest-manager')

    const id = generateGuestId()

    expect(id).toMatch(/^guest_[a-f0-9]+$/)
    expect(id.length).toBeGreaterThan(10)
  })

  it('getGuestExpirationTime 应该返回正确的过期时间', async () => {
    const { getGuestExpirationTime, GUEST_SESSION_DURATION } = await import('../guest-manager')

    const expirationTime = getGuestExpirationTime()

    expect(expirationTime).toBeGreaterThan(Date.now())
    expect(GUEST_SESSION_DURATION).toBe(24 * 60 * 60 * 1000) // 24 小时
  })
})

describe('Guest 限制常量', () => {
  it('应该定义正确的限制值', async () => {
    const { GUEST_LIMITS } = await import('../guest-manager')

    expect(GUEST_LIMITS.MAX_CREDITS).toBe(5)
    expect(GUEST_LIMITS.DAILY_LIMIT).toBe(5)
    expect(GUEST_LIMITS.SESSION_DURATION).toBe(24 * 60 * 60 * 1000)
    expect(GUEST_LIMITS.MAX_VIDEO_DURATION).toBe(30) // 30 秒
  })
})
