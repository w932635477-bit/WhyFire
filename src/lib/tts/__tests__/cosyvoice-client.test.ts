/**
 * CosyVoice TTS 客户端测试
 * 测试 CosyVoice API 调用和 8 种方言的 voiceId 映射
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DialectCodeV2 } from '@/types/dialect-v2'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// CosyVoice 支持的 8 种方言
const COSYVOICE_DIALECTS: DialectCodeV2[] = [
  'mandarin',   // 普通话
  'cantonese',  // 粤语
  'sichuan',    // 四川话
  'dongbei',    // 东北话
  'shandong',   // 山东话
  'shanghai',   // 上海话
  'henan',      // 河南话
  'hunan',      // 湖南话
]

describe('CosyVoiceClient', () => {
  let client: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // 重置单例
    const module = await import('../cosyvoice-client')
    // @ts-ignore - 重置单例
    module.clientInstance = null
    client = new module.CosyVoiceClient()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isConfigured', () => {
    it('当 API Key 未设置时返回 false', async () => {
      const originalKey = process.env.ALIBABA_CLOUD_API_KEY
      const originalDashKey = process.env.DASHSCOPE_API_KEY
      delete process.env.ALIBABA_CLOUD_API_KEY
      delete process.env.DASHSCOPE_API_KEY

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()
      expect(newClient.isConfigured()).toBe(false)

      if (originalKey) process.env.ALIBABA_CLOUD_API_KEY = originalKey
      if (originalDashKey) process.env.DASHSCOPE_API_KEY = originalDashKey
    })

    it('当 API Key 已设置时返回 true', async () => {
      const originalKey = process.env.ALIBABA_CLOUD_API_KEY
      process.env.ALIBABA_CLOUD_API_KEY = 'test-api-key'

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()
      expect(newClient.isConfigured()).toBe(true)

      if (originalKey) {
        process.env.ALIBABA_CLOUD_API_KEY = originalKey
      } else {
        delete process.env.ALIBABA_CLOUD_API_KEY
      }
    })
  })

  describe('generate', () => {
    it('未配置时应该抛出错误', async () => {
      const originalKey = process.env.ALIBABA_CLOUD_API_KEY
      const originalDashKey = process.env.DASHSCOPE_API_KEY
      delete process.env.ALIBABA_CLOUD_API_KEY
      delete process.env.DASHSCOPE_API_KEY

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      await expect(newClient.generate({
        text: '你好世界',
        dialect: 'mandarin',
      })).rejects.toThrow(/not configured/i)

      if (originalKey) process.env.ALIBABA_CLOUD_API_KEY = originalKey
      if (originalDashKey) process.env.DASHSCOPE_API_KEY = originalDashKey
    })

    it('不支持的方言应该抛出错误', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      // CosyVoice 不支持英语
      await expect(newClient.generate({
        text: 'test',
        dialect: 'english',
      })).rejects.toThrow(/unsupported/i)

      delete process.env.ALIBABA_CLOUD_API_KEY
    })

    it('成功生成应该返回正确的结果结构', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          output: { audio: Buffer.from('test').toString('base64') },
          usage: { characters: 4, duration: 2 },
          request_id: 'req-123',
        }),
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const result = await newClient.generate({
        text: '你好世界',
        dialect: 'mandarin',
      })

      expect(result).toHaveProperty('audioUrl')
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('dialect')
      expect(result).toHaveProperty('provider')
      expect(result.provider).toBe('cosyvoice')

      delete process.env.ALIBABA_CLOUD_API_KEY
    })

    it('API 错误应该抛出异常', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      await expect(newClient.generate({
        text: '测试',
        dialect: 'mandarin',
      })).rejects.toThrow()

      delete process.env.ALIBABA_CLOUD_API_KEY
    })
  })

  describe('方言支持', () => {
    it.each(COSYVOICE_DIALECTS)('应该支持 %s 方言', async (dialect) => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          output: { audio: Buffer.from('test').toString('base64') },
          usage: { characters: 2, duration: 1 },
          request_id: 'req-123',
        }),
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const result = await newClient.generate({
        text: '测试',
        dialect,
      })

      expect(result.dialect).toBe(dialect)
      expect(result.provider).toBe('cosyvoice')

      delete process.env.ALIBABA_CLOUD_API_KEY
    })

    it('不支持非 8 种方言', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      const { CosyVoiceClient, getCosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      getCosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      // CosyVoice 不支持以下方言
      const unsupportedDialects = [
        'english', 'minnan', 'hakka', 'xiang', 'gan', 'jin',
        'lanyin', 'jianghuai', 'xinan', 'jiaoliao', 'zhongyuan',
        'wu', // v1 使用 'wu'，v2 使用 'shanghai'
        'shaanxi', // v1 使用 'shaanxi'，v2 不包含
      ]

      for (const dialect of unsupportedDialects) {
        await expect(newClient.generate({
          text: '测试',
          dialect,
        })).rejects.toThrow()
      }

      delete process.env.ALIBABA_CLOUD_API_KEY
    })
  })

  describe('Voice ID 映射', () => {
    it('应该正确映射 8 种方言的 Voice ID', async () => {
      const { COSYVOICE_VOICE_IDS } = await import('@/types/dialect-v2')

      for (const dialect of COSYVOICE_DIALECTS) {
        const voiceId = COSYVOICE_VOICE_IDS[dialect]
        expect(voiceId).toBeDefined()
        expect(typeof voiceId).toBe('string')
        expect(voiceId.length).toBeGreaterThan(0)
      }
    })

    it('普通话应该有正确的 Voice ID', async () => {
      const { COSYVOICE_VOICE_IDS } = await import('@/types/dialect-v2')

      expect(COSYVOICE_VOICE_IDS.mandarin).toBe('longxiaochun')
    })

    it('粤语应该有正确的 Voice ID', async () => {
      const { COSYVOICE_VOICE_IDS } = await import('@/types/dialect-v2')

      expect(COSYVOICE_VOICE_IDS.cantonese).toBe('longyue')
    })
  })

  describe('批量生成', () => {
    it('应该依次生成多个段落的语音', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          output: { audio: Buffer.from('test').toString('base64') },
          usage: { characters: 3, duration: 1 },
          request_id: 'req-123',
        }),
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const segments = ['第一段', '第二段', '第三段']
      const results = await newClient.generateBatch(segments, 'sichuan')

      expect(results).toHaveLength(3)
      expect(mockFetch).toHaveBeenCalledTimes(3)

      for (const result of results) {
        expect(result).toHaveProperty('audioUrl')
        expect(result).toHaveProperty('duration')
        expect(result.dialect).toBe('sichuan')
      }

      delete process.env.ALIBABA_CLOUD_API_KEY
    })
  })

  describe('声音克隆', () => {
    it('应该支持参考音频进行声音克隆', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          output: { audio: Buffer.from('test').toString('base64') },
          usage: { characters: 4, duration: 2 },
          request_id: 'req-123',
        }),
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const result = await newClient.generate({
        text: '克隆语音测试',
        dialect: 'mandarin',
        refAudioPath: '/audio/reference.wav',
        refText: '参考音频文本',
      })

      expect(result).toHaveProperty('audioUrl')
      expect(result.provider).toBe('cosyvoice')

      delete process.env.ALIBABA_CLOUD_API_KEY
    })

    it('generateWithReference 应该正确调用', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          output: { audio: Buffer.from('test').toString('base64') },
          usage: { characters: 4, duration: 2 },
          request_id: 'req-123',
        }),
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const result = await newClient.generateWithReference(
        '测试文本',
        'mandarin',
        '/audio/ref.wav',
        '参考文本'
      )

      expect(result).toHaveProperty('audioUrl')

      delete process.env.ALIBABA_CLOUD_API_KEY
    })
  })

  describe('重试机制', () => {
    it('generateWithRetry 应该在失败时重试', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      let attempts = 0
      mockFetch.mockImplementation(async () => {
        attempts++
        if (attempts < 3) {
          return { ok: false, status: 500, text: () => Promise.resolve('Error') }
        }
        return {
          ok: true,
          json: async () => ({
            output: { audio: Buffer.from('test').toString('base64') },
            usage: { characters: 2, duration: 1 },
            request_id: 'req-123',
          }),
        }
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const result = await newClient.generateWithRetry({
        text: '测试',
        dialect: 'mandarin',
      }, 3)

      expect(result).toHaveProperty('audioUrl')
      expect(attempts).toBe(3)

      delete process.env.ALIBABA_CLOUD_API_KEY
    })

    it('达到最大重试次数应该抛出错误', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      await expect(newClient.generateWithRetry({
        text: '测试',
        dialect: 'mandarin',
      }, 2)).rejects.toThrow()

      delete process.env.ALIBABA_CLOUD_API_KEY
    })
  })

  describe('getSupportedDialects', () => {
    it('应该返回支持的 8 种方言列表', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const supported = newClient.getSupportedDialects()

      expect(supported).toHaveLength(8)
      expect(supported).toContain('mandarin')
      expect(supported).toContain('cantonese')
      expect(supported).toContain('sichuan')
      expect(supported).toContain('dongbei')
      expect(supported).toContain('shandong')
      expect(supported).toContain('shanghai')
      expect(supported).toContain('henan')
      expect(supported).toContain('hunan')

      delete process.env.ALIBABA_CLOUD_API_KEY
    })
  })

  describe('testDialect', () => {
    it('无效方言应该返回 false', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const result = await newClient.testDialect('invalid')
      expect(result).toBe(false)

      delete process.env.ALIBABA_CLOUD_API_KEY
    })

    it('成功生成应该返回 true', async () => {
      process.env.ALIBABA_CLOUD_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          output: { audio: Buffer.from('test').toString('base64') },
          usage: { characters: 10, duration: 3 },
          request_id: 'req-123',
        }),
      })

      const { CosyVoiceClient } = await import('../cosyvoice-client')
      // @ts-ignore
      CosyVoiceClient.clientInstance = null
      const newClient = new CosyVoiceClient()

      const result = await newClient.testDialect('mandarin')
      expect(result).toBe(true)

      delete process.env.ALIBABA_CLOUD_API_KEY
    })
  })
})

describe('CosyVoice 单例', () => {
  it('getCosyVoiceClient 应该返回单例实例', async () => {
    // 重置单例
    const module = await import('../cosyvoice-client')
    // @ts-ignore
    module.clientInstance = null

    const instance1 = module.getCosyVoiceClient()
    const instance2 = module.getCosyVoiceClient()

    expect(instance1).toBe(instance2)
  })
})

describe('CosyVoice 与 Fish Audio 对比', () => {
  it('CosyVoice 只支持 8 种方言，Fish Audio 支持 19 种', async () => {
    const { getCosyVoiceClient } = await import('../cosyvoice-client')
    const { DIALECT_CONFIGS } = await import('@/types/dialect')

    // 重置单例
    // @ts-ignore
    getCosyVoiceClient.clientInstance = null
    const cosyvoiceClient = getCosyVoiceClient()
    const cosyvoiceSupported = cosyvoiceClient.getSupportedDialects()
    const fishAudioSupported = Object.keys(DIALECT_CONFIGS)

    expect(cosyvoiceSupported.length).toBe(8)
    expect(fishAudioSupported.length).toBe(19)
  })
})
