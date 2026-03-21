/**
 * 时间拉伸器测试
 * 测试音频时间拉伸和音高保持功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Web Audio API
vi.stubGlobal('AudioContext', vi.fn(() => ({
  createBufferSource: vi.fn(() => ({
    buffer: null,
    playbackRate: { value: 1 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createBuffer: vi.fn(() => ({ getChannelData: vi.fn(() => new Float32Array(1000)) })),
  decodeAudioData: vi.fn(async () => ({
    duration: 10,
    sampleRate: 44100,
    numberOfChannels: 2,
    getChannelData: vi.fn(() => new Float32Array(441000)),
  })),
  destination: {},
})))

describe('TimeStretcher', () => {
  let stretcher: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../time-stretcher')
    stretcher = new module.TimeStretcher()
  })

  describe('stretch', () => {
    it('应该拉伸音频到指定时长', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 15

      const result = await stretcher.stretch(audioBuffer, targetDuration)

      expect(result.duration).toBeCloseTo(15, 0)
      expect(result.stretchRatio).toBeCloseTo(1.5, 1)
    })

    it('应该压缩音频到指定时长', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 5

      const result = await stretcher.stretch(audioBuffer, targetDuration)

      expect(result.duration).toBeCloseTo(5, 0)
      expect(result.stretchRatio).toBeCloseTo(0.5, 1)
    })

    it('不改变时长应该返回原始音频', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 10

      const result = await stretcher.stretch(audioBuffer, targetDuration)

      expect(result.stretchRatio).toBeCloseTo(1, 0)
    })
  })

  describe('音高保持', () => {
    it('默认应该保持音高不变', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 15

      const result = await stretcher.stretch(audioBuffer, targetDuration, {
        preservePitch: true,
      })

      expect(result.pitchShifted).toBe(false)
    })

    it('不保持音高时应该允许音高变化', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 5

      const result = await stretcher.stretch(audioBuffer, targetDuration, {
        preservePitch: false,
      })

      // 音高应该上升（播放速度加快）
      expect(result.pitchShifted).toBe(true)
      expect(result.pitchShift).toBeCloseTo(12, 0) // 约一个八度
    })
  })

  describe('拉伸质量', () => {
    it('高质量模式应该使用更好的算法', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 15

      const result = await stretcher.stretch(audioBuffer, targetDuration, {
        quality: 'high',
      })

      expect(result.quality).toBe('high')
    })

    it('快速模式应该优先速度', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 15

      const startTime = Date.now()
      await stretcher.stretch(audioBuffer, targetDuration, {
        quality: 'fast',
      })
      const duration = Date.now() - startTime

      // 快速模式应该更快
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('拉伸限制', () => {
    it('过度拉伸应该发出警告', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 30 // 3倍拉伸

      const result = await stretcher.stretch(audioBuffer, targetDuration)

      expect(result.warnings).toBeDefined()
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('过度压缩应该发出警告', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 2 // 0.2倍压缩

      const result = await stretcher.stretch(audioBuffer, targetDuration)

      expect(result.warnings).toBeDefined()
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('拉伸比例超过限制应该抛出错误', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 100 // 10倍拉伸

      await expect(stretcher.stretch(audioBuffer, targetDuration)).rejects.toThrow()
    })
  })

  describe('音高偏移', () => {
    it('应该支持独立音高偏移', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 10

      const result = await stretcher.stretch(audioBuffer, targetDuration, {
        pitchShift: 2, // 升 2 个半音
      })

      expect(result.pitchShift).toBe(2)
    })

    it('负值音高偏移应该降低音高', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }
      const targetDuration = 10

      const result = await stretcher.stretch(audioBuffer, targetDuration, {
        pitchShift: -3, // 降 3 个半音
      })

      expect(result.pitchShift).toBe(-3)
    })
  })

  describe('边界情况', () => {
    it('零时长目标应该抛出错误', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }

      await expect(stretcher.stretch(audioBuffer, 0)).rejects.toThrow()
    })

    it('负时长目标应该抛出错误', async () => {
      const audioBuffer = { duration: 10, sampleRate: 44100 }

      await expect(stretcher.stretch(audioBuffer, -5)).rejects.toThrow()
    })

    it('空音频缓冲区应该抛出错误', async () => {
      await expect(stretcher.stretch(null, 10)).rejects.toThrow()
    })
  })

  describe('批量处理', () => {
    it('应该批量拉伸多个音频', async () => {
      const audioBuffers = [
        { duration: 10, sampleRate: 44100 },
        { duration: 15, sampleRate: 44100 },
        { duration: 20, sampleRate: 44100 },
      ]
      const targetDuration = 10

      const results = await stretcher.stretchBatch(audioBuffers, targetDuration)

      expect(results).toHaveLength(3)
      results.forEach((result: any) => {
        expect(result.duration).toBeCloseTo(10, 0)
      })
    })
  })
})

describe('TimeStretcher 工具函数', () => {
  it('calculateStretchRatio 应该正确计算拉伸比例', async () => {
    const { calculateStretchRatio } = await import('../time-stretcher')

    expect(calculateStretchRatio(10, 20)).toBe(2)
    expect(calculateStretchRatio(20, 10)).toBe(0.5)
    expect(calculateStretchRatio(10, 10)).toBe(1)
  })

  it('semitonesToRatio 应该正确转换半音到比例', async () => {
    const { semitonesToRatio } = await import('../time-stretcher')

    // 12 个半音 = 1 个八度 = 2 倍频率
    expect(semitonesToRatio(12)).toBeCloseTo(2, 2)
    // -12 个半音 = 0.5 倍频率
    expect(semitonesToRatio(-12)).toBeCloseTo(0.5, 2)
  })

  it('ratioToSemitones 应该正确转换比例到半音', async () => {
    const { ratioToSemitones } = await import('../time-stretcher')

    expect(ratioToSemitones(2)).toBeCloseTo(12, 0)
    expect(ratioToSemitones(0.5)).toBeCloseTo(-12, 0)
  })
})
