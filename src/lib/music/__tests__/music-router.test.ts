/**
 * 音乐路由层测试
 * 测试 MiniMax 音乐生成
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock MiniMax 客户端
vi.mock('@/lib/minimax/client', () => ({
  getMiniMaxClient: vi.fn(() => ({
    generateMusic: vi.fn(async (params) => {
      return `/audio/minimax-${params.dialect}.mp3`
    }),
  })),
}))

describe('MusicRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('音乐生成', () => {
    it('普通话应该成功生成', async () => {
      const { generateMusic } = await import('../music-router')

      const result = await generateMusic({
        lyrics: '测试歌词',
        dialect: 'mandarin',
        style: 'rap',
      })

      expect(result.provider).toBe('minimax')
      expect(result.audioUrl).toContain('minimax')
    })

    it('粤语应该成功生成', async () => {
      const { generateMusic } = await import('../music-router')

      const result = await generateMusic({
        lyrics: '測試歌詞',
        dialect: 'cantonese',
        style: 'rap',
      })

      expect(result.provider).toBe('minimax')
      expect(result.audioUrl).toContain('minimax')
    })

    it('English 应该成功生成', async () => {
      const { generateMusic } = await import('../music-router')

      const result = await generateMusic({
        lyrics: 'Test lyrics',
        dialect: 'english',
        style: 'rap',
      })

      expect(result.provider).toBe('minimax')
      expect(result.audioUrl).toContain('minimax')
    })
  })

  describe('方言标签', () => {
    it('应该定义所有支持的方言', async () => {
      const { DIALECT_LABELS } = await import('../music-router')

      expect(DIALECT_LABELS.mandarin).toBe('普通话')
      expect(DIALECT_LABELS.cantonese).toBe('粤语')
      expect(DIALECT_LABELS.english).toBe('English')
    })
  })
})
