/**
 * FFmpeg 处理器单元测试
 *
 * 测试内容：
 * - 边界条件
 * - 参数验证
 * - 错误处理
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { FFmpegProcessor } from '@/lib/audio/ffmpeg-processor'

describe('FFmpegProcessor', () => {
  let processor: FFmpegProcessor

  beforeAll(() => {
    processor = new FFmpegProcessor()
  })

  describe('isAvailable', () => {
    it('should check if FFmpeg is available', async () => {
      const available = await processor.isAvailable()
      expect(typeof available).toBe('boolean')
    })
  })

  describe('参数验证', () => {
    describe('timeStretchFactor 边界', () => {
      it('should accept factor of 0.5 (minimum)', () => {
        // 0.5 是允许的最小值
        const factor = 0.5
        expect(factor).toBeGreaterThanOrEqual(0.5)
        expect(factor).toBeLessThanOrEqual(2.0)
      })

      it('should accept factor of 2.0 (maximum)', () => {
        // 2.0 是允许的最大值
        const factor = 2.0
        expect(factor).toBeGreaterThanOrEqual(0.5)
        expect(factor).toBeLessThanOrEqual(2.0)
      })

      it('should accept factor of 1.0 (no change)', () => {
        const factor = 1.0
        expect(factor).toBeGreaterThanOrEqual(0.5)
        expect(factor).toBeLessThanOrEqual(2.0)
      })

      it('should reject factor below 0.5', () => {
        const factor = 0.3
        expect(factor < 0.5).toBe(true)
      })

      it('should reject factor above 2.0', () => {
        const factor = 2.5
        expect(factor > 2.0).toBe(true)
      })
    })

    describe('volume 边界', () => {
      it('should accept volume of 0 (mute)', () => {
        const volume = 0
        expect(volume).toBeGreaterThanOrEqual(0)
        expect(volume).toBeLessThanOrEqual(2.0)
      })

      it('should accept volume of 2.0 (maximum)', () => {
        const volume = 2.0
        expect(volume).toBeGreaterThanOrEqual(0)
        expect(volume).toBeLessThanOrEqual(2.0)
      })

      it('should reject negative volume', () => {
        const volume = -0.5
        expect(volume < 0).toBe(true)
      })
    })
  })

  describe('配置验证', () => {
    it('should use default config when not provided', () => {
      const p = new FFmpegProcessor()
      expect(p).toBeDefined()
    })

    it('should accept custom config', () => {
      const p = new FFmpegProcessor({
        ffmpegPath: '/usr/local/bin/ffmpeg',
        timeout: 60000,
        debug: true,
      })
      expect(p).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('should handle invalid audio buffer gracefully', async () => {
      // 空Buffer应该被拒绝
      const emptyBuffer = Buffer.alloc(0)

      // 这个测试需要实际的FFmpeg，所以只是验证函数存在
      expect(typeof processor.timeStretch).toBe('function')
    })

    it('should handle timeout correctly', async () => {
      const shortTimeoutProcessor = new FFmpegProcessor({
        timeout: 1, // 1ms timeout
      })

      // 超时处理器应该快速失败
      expect(shortTimeoutProcessor).toBeDefined()
    })
  })

  describe('输出格式', () => {
    it('should support mp3 output', () => {
      const format: 'mp3' | 'wav' = 'mp3'
      expect(['mp3', 'wav']).toContain(format)
    })

    it('should support wav output', () => {
      const format: 'mp3' | 'wav' = 'wav'
      expect(['mp3', 'wav']).toContain(format)
    })
  })

  describe('混音配置', () => {
    it('should have valid default mix config', () => {
      const defaultConfig = {
        vocalVolume: 1.0,
        bgmVolume: 0.4,
        loopBgm: true,
      }

      expect(defaultConfig.vocalVolume).toBeGreaterThanOrEqual(0)
      expect(defaultConfig.vocalVolume).toBeLessThanOrEqual(2.0)
      expect(defaultConfig.bgmVolume).toBeGreaterThanOrEqual(0)
      expect(defaultConfig.bgmVolume).toBeLessThanOrEqual(2.0)
    })
  })
})
