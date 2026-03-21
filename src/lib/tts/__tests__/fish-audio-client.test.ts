// src/lib/tts/__tests__/fish-audio-client.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FishAudioClient, getFishAudioClient, type TTSOptions, type TTSResult } from '../fish-audio-client'
import type { DialectCode } from '@/types/dialect'

// 模拟 fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('FishAudioClient', () => {
  let client: FishAudioClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new FishAudioClient()
  })

  describe('isConfigured', () => {
    it('当 API Key 未设置时返回 false', () => {
      const originalKey = process.env.FISH_AUDIO_API_KEY
      delete process.env.FISH_AUDIO_API_KEY

      const newClient = new FishAudioClient()
      expect(newClient.isConfigured()).toBe(false)

      if (originalKey) process.env.FISH_AUDIO_API_KEY = originalKey
    })

    it('当 API Key 已设置时返回 true', () => {
      const originalKey = process.env.FISH_AUDIO_API_KEY
      process.env.FISH_AUDIO_API_KEY = 'test-api-key'

      const newClient = new FishAudioClient()
      expect(newClient.isConfigured()).toBe(true)

      if (originalKey) {
        process.env.FISH_AUDIO_API_KEY = originalKey
      } else {
        delete process.env.FISH_AUDIO_API_KEY
      }
    })
  })

  describe('generate', () => {
    it('未配置时应该抛出错误', async () => {
      const originalKey = process.env.FISH_AUDIO_API_KEY
      delete process.env.FISH_AUDIO_API_KEY

      const newClient = new FishAudioClient()

      const options: TTSOptions = {
        text: '你好世界',
        dialect: 'mandarin',
      }

      await expect(newClient.generate(options)).rejects.toThrow('Fish Audio API key not configured')

      if (originalKey) process.env.FISH_AUDIO_API_KEY = originalKey
    })

    it('不支持的方言应该抛出错误', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      const newClient = new FishAudioClient()

      const options: TTSOptions = {
        text: '你好世界',
        dialect: 'invalid_dialect' as DialectCode,
      }

      await expect(newClient.generate(options)).rejects.toThrow('Unsupported dialect')

      delete process.env.FISH_AUDIO_API_KEY
    })

    it('成功生成应该返回正确的结果结构', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      // 模拟成功的 API 响应
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      })

      const newClient = new FishAudioClient()

      const options: TTSOptions = {
        text: '你好世界',
        dialect: 'mandarin',
        speed: 1.0,
        format: 'mp3',
      }

      const result = await newClient.generate(options)

      expect(result).toHaveProperty('audioUrl')
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('dialect')
      expect(result).toHaveProperty('provider')
      expect(result.dialect).toBe('mandarin')
      expect(result.provider).toBe('fish_audio')
      expect(typeof result.duration).toBe('number')

      delete process.env.FISH_AUDIO_API_KEY
    })

    it('应该使用默认参数', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      })

      const newClient = new FishAudioClient()

      // 不提供 speed 和 format
      const options: TTSOptions = {
        text: '测试',
        dialect: 'mandarin',
      }

      const result = await newClient.generate(options)

      expect(result).toBeDefined()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/tts'),
        expect.objectContaining({
          method: 'POST',
        })
      )

      delete process.env.FISH_AUDIO_API_KEY
    })

    it('API 错误应该抛出异常', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      })

      const newClient = new FishAudioClient()

      const options: TTSOptions = {
        text: '测试',
        dialect: 'mandarin',
      }

      await expect(newClient.generate(options)).rejects.toThrow('Fish Audio API error')

      delete process.env.FISH_AUDIO_API_KEY
    })

    it('应该正确估算时长', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      })

      const newClient = new FishAudioClient()

      // 14 个字符，应该约为 4 秒（3.5 字/秒）
      const result = await newClient.generate({
        text: '这是一段测试文本',
        dialect: 'mandarin',
      })

      expect(result.duration).toBeGreaterThan(0)
      expect(result.duration).toBeLessThanOrEqual(10)

      delete process.env.FISH_AUDIO_API_KEY
    })
  })

  describe('generateBatch', () => {
    it('应该依次生成多个段落的语音', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      })

      const newClient = new FishAudioClient()

      const segments = ['第一段', '第二段', '第三段']
      const results = await newClient.generateBatch(segments, 'mandarin')

      expect(results).toHaveLength(3)
      expect(mockFetch).toHaveBeenCalledTimes(3)

      for (const result of results) {
        expect(result).toHaveProperty('audioUrl')
        expect(result).toHaveProperty('duration')
      }

      delete process.env.FISH_AUDIO_API_KEY
    })

    it('应该传递 speed 参数', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      })

      const newClient = new FishAudioClient()

      await newClient.generateBatch(['测试'], 'mandarin', { speed: 1.5 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('1.5'),
        })
      )

      delete process.env.FISH_AUDIO_API_KEY
    })
  })

  describe('testDialect', () => {
    it('无效方言应该返回 false', async () => {
      const result = await client.testDialect('invalid' as DialectCode)
      expect(result).toBe(false)
    })

    it('成功生成应该返回 true', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      })

      const newClient = new FishAudioClient()
      const result = await newClient.testDialect('mandarin')

      expect(result).toBe(true)

      delete process.env.FISH_AUDIO_API_KEY
    })

    it('生成失败应该返回 false', async () => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      mockFetch.mockRejectedValue(new Error('Network error'))

      const newClient = new FishAudioClient()
      const result = await newClient.testDialect('mandarin')

      expect(result).toBe(false)

      delete process.env.FISH_AUDIO_API_KEY
    })
  })

  describe('支持所有方言', () => {
    const dialects: DialectCode[] = [
      'mandarin', 'cantonese', 'sichuan', 'dongbei', 'shandong',
      'henan', 'shaanxi', 'wu', 'minnan', 'hakka',
      'xiang', 'gan', 'jin', 'lanyin', 'jianghuai',
      'xinan', 'jiaoliao', 'zhongyuan', 'english',
    ]

    it.each(dialects)('应该支持 %s 方言', async (dialect) => {
      process.env.FISH_AUDIO_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      })

      const newClient = new FishAudioClient()

      const result = await newClient.generate({
        text: '测试',
        dialect,
      })

      expect(result.dialect).toBe(dialect)
      expect(result.provider).toBe('fish_audio')

      delete process.env.FISH_AUDIO_API_KEY
    })
  })
})

describe('getFishAudioClient', () => {
  it('应该返回单例实例', () => {
    const instance1 = getFishAudioClient()
    const instance2 = getFishAudioClient()

    expect(instance1).toBe(instance2)
  })
})
