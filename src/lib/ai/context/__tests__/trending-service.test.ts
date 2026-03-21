// src/lib/ai/context/__tests__/trending-service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TrendingService, getTrendingService, type TrendingTopic, type InternetMeme } from '../trending-service'

// 模拟 fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('TrendingService', () => {
  let service: TrendingService

  beforeEach(() => {
    vi.clearAllMocks()
    // 重置单例
    service = new TrendingService()
  })

  describe('isConfigured', () => {
    it('当 API Key 未设置时返回 false', () => {
      // 清除环境变量
      const originalKey = process.env.SERPER_API_KEY
      delete process.env.SERPER_API_KEY

      const newService = new TrendingService()
      expect(newService.isConfigured()).toBe(false)

      // 恢复环境变量
      if (originalKey) process.env.SERPER_API_KEY = originalKey
    })

    it('当 API Key 已设置时返回 true', () => {
      const originalKey = process.env.SERPER_API_KEY
      process.env.SERPER_API_KEY = 'test-api-key'

      const newService = new TrendingService()
      expect(newService.isConfigured()).toBe(true)

      // 恢复环境变量
      if (originalKey) {
        process.env.SERPER_API_KEY = originalKey
      } else {
        delete process.env.SERPER_API_KEY
      }
    })
  })

  describe('search', () => {
    it('当未配置 API 时返回降级数据', async () => {
      const originalKey = process.env.SERPER_API_KEY
      delete process.env.SERPER_API_KEY

      const newService = new TrendingService()
      const results = await newService.search('测试关键词')

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].title).toContain('测试关键词')

      if (originalKey) process.env.SERPER_API_KEY = originalKey
    })

    it('应该使用缓存避免重复请求', async () => {
      process.env.SERPER_API_KEY = 'test-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          organic: [
            { title: '测试热点', snippet: '测试描述', link: 'https://example.com' }
          ]
        })
      })

      const newService = new TrendingService()

      // 第一次请求
      await newService.search('测试查询')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // 第二次请求应该使用缓存
      await newService.search('测试查询')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      delete process.env.SERPER_API_KEY
    })

    it('API 错误时应该返回降级数据', async () => {
      process.env.SERPER_API_KEY = 'test-key'

      mockFetch.mockRejectedValue(new Error('Network error'))

      const newService = new TrendingService()
      const results = await newService.search('测试')

      expect(results.length).toBeGreaterThan(0)

      delete process.env.SERPER_API_KEY
    })
  })

  describe('getTrendingTopics', () => {
    it('当未配置 API 时返回季节性话题', async () => {
      const originalKey = process.env.SERPER_API_KEY
      delete process.env.SERPER_API_KEY

      const newService = new TrendingService()
      const results = await newService.getTrendingTopics()

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)

      // 验证返回的数据结构
      const topic = results[0]
      expect(topic).toHaveProperty('title')
      expect(topic).toHaveProperty('description')
      expect(topic).toHaveProperty('keywords')
      expect(topic).toHaveProperty('fetchedAt')

      if (originalKey) process.env.SERPER_API_KEY = originalKey
    })

    it('应该尊重 limit 参数', async () => {
      const originalKey = process.env.SERPER_API_KEY
      delete process.env.SERPER_API_KEY

      const newService = new TrendingService()
      const results = await newService.getTrendingTopics({ limit: 2 })

      expect(results.length).toBeLessThanOrEqual(2)

      if (originalKey) process.env.SERPER_API_KEY = originalKey
    })
  })

  describe('getInternetMemes', () => {
    it('应该返回预定义的网络热梗列表', async () => {
      const memes = await service.getInternetMemes()

      expect(Array.isArray(memes)).toBe(true)
      expect(memes.length).toBeGreaterThan(0)

      // 验证热梗数据结构
      const meme = memes[0]
      expect(meme).toHaveProperty('text')
      expect(meme).toHaveProperty('context')
      expect(meme).toHaveProperty('usage')
    })

    it('应该包含常见热梗', async () => {
      const memes = await service.getInternetMemes()
      const memeTexts = memes.map(m => m.text)

      expect(memeTexts).toContain('遥遥领先')
      expect(memeTexts).toContain('YYDS')
      expect(memeTexts).toContain('内卷')
      expect(memeTexts).toContain('躺平')
    })

    it('应该使用缓存', async () => {
      // 第一次调用
      const memes1 = await service.getInternetMemes()

      // 第二次调用应该从缓存返回
      const memes2 = await service.getInternetMemes()

      expect(memes1).toEqual(memes2)
    })
  })

  describe('季节性降级数据', () => {
    it('1-2月应该返回新年相关话题', async () => {
      const originalKey = process.env.SERPER_API_KEY
      delete process.env.SERPER_API_KEY

      // 模拟 1 月
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15'))

      const newService = new TrendingService()
      const results = await newService.getFallbackTrending()

      expect(results.some(r => r.title.includes('新年'))).toBe(true)

      vi.useRealTimers()

      if (originalKey) process.env.SERPER_API_KEY = originalKey
    })

    it('3-4月应该返回春季相关话题', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-03-15'))

      const newService = new TrendingService()
      const results = await newService.getFallbackTrending()

      expect(results.some(r => r.title.includes('春'))).toBe(true)

      vi.useRealTimers()
    })

    it('6-8月应该返回夏季相关话题', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-07-15'))

      const newService = new TrendingService()
      const results = await newService.getFallbackTrending()

      expect(results.some(r => r.title.includes('夏'))).toBe(true)

      vi.useRealTimers()
    })

    it('11-12月应该返回年末相关话题', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-11-15'))

      const newService = new TrendingService()
      const results = await newService.getFallbackTrending()

      expect(results.some(r => r.title.includes('年末') || r.title.includes('年终'))).toBe(true)

      vi.useRealTimers()
    })
  })
})

describe('getTrendingService', () => {
  it('应该返回单例实例', () => {
    const instance1 = getTrendingService()
    const instance2 = getTrendingService()

    expect(instance1).toBe(instance2)
  })
})
