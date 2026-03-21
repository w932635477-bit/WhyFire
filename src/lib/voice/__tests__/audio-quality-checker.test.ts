/**
 * 音频质量检测器测试
 * 测试音频质量评估和验证功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('AudioQualityChecker', () => {
  let checker: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../audio-quality-checker')
    checker = new module.AudioQualityChecker()
  })

  describe('checkQuality', () => {
    it('应该检测高质量音频', async () => {
      const audioPath = '/audio/high_quality.wav'
      const result = await checker.checkQuality(audioPath)

      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('issues')
      expect(result).toHaveProperty('details')
      expect(result.score).toBeGreaterThanOrEqual(80)
    })

    it('应该检测低质量音频', async () => {
      const audioPath = '/audio/low_quality.mp3'
      const result = await checker.checkQuality(audioPath)

      expect(result.score).toBeLessThan(80)
      expect(result.issues.length).toBeGreaterThan(0)
    })

    it('应该返回详细的质量指标', async () => {
      const audioPath = '/audio/test.wav'
      const result = await checker.checkQuality(audioPath)

      expect(result.details).toHaveProperty('sampleRate')
      expect(result.details).toHaveProperty('bitrate')
      expect(result.details).toHaveProperty('channels')
      expect(result.details).toHaveProperty('duration')
    })
  })

  describe('checkSampleRate', () => {
    it('应该验证采样率是否达标', async () => {
      const audioPath = '/audio/test.wav'
      const result = await checker.checkSampleRate(audioPath)

      expect(result).toHaveProperty('value')
      expect(result).toHaveProperty('passed')
      expect(result).toHaveProperty('minimum')
      expect(result.minimum).toBe(22050) // 最低采样率
    })

    it('44.1kHz 应该通过检测', async () => {
      const audioPath = '/audio/cd_quality.wav'
      const result = await checker.checkSampleRate(audioPath)

      expect(result.passed).toBe(true)
      expect(result.value).toBe(44100)
    })

    it('低于 22.05kHz 应该不通过', async () => {
      const audioPath = '/audio/low_sample_rate.wav'
      const result = await checker.checkSampleRate(audioPath)

      expect(result.passed).toBe(false)
    })
  })

  describe('checkBitrate', () => {
    it('应该验证比特率是否达标', async () => {
      const audioPath = '/audio/test.mp3'
      const result = await checker.checkBitrate(audioPath)

      expect(result).toHaveProperty('value')
      expect(result).toHaveProperty('passed')
      expect(result).toHaveProperty('minimum')
      expect(result.minimum).toBe(128) // 最低 128kbps
    })

    it('320kbps 应该通过检测', async () => {
      const audioPath = '/audio/high_bitrate.mp3'
      const result = await checker.checkBitrate(audioPath)

      expect(result.passed).toBe(true)
      expect(result.value).toBe(320)
    })
  })

  describe('checkNoiseLevel', () => {
    it('应该检测背景噪音水平', async () => {
      const audioPath = '/audio/test.wav'
      const result = await checker.checkNoiseLevel(audioPath)

      expect(result).toHaveProperty('snr') // 信噪比
      expect(result).toHaveProperty('passed')
      expect(result.snr).toBeGreaterThan(0)
    })

    it('干净的音频应该通过噪音检测', async () => {
      const audioPath = '/audio/clean.wav'
      const result = await checker.checkNoiseLevel(audioPath)

      expect(result.passed).toBe(true)
      expect(result.snr).toBeGreaterThan(40) // SNR > 40dB
    })

    it('有噪音的音频应该被标记', async () => {
      const audioPath = '/audio/noisy.wav'
      const result = await checker.checkNoiseLevel(audioPath)

      expect(result.passed).toBe(false)
      expect(result.snr).toBeLessThan(30)
    })
  })

  describe('checkClipping', () => {
    it('应该检测削波失真', async () => {
      const audioPath = '/audio/test.wav'
      const result = await checker.checkClipping(audioPath)

      expect(result).toHaveProperty('hasClipping')
      expect(result).toHaveProperty('clippingRatio')
      expect(result).toHaveProperty('passed')
    })

    it('无削波的音频应该通过', async () => {
      const audioPath = '/audio/normalized.wav'
      const result = await checker.checkClipping(audioPath)

      expect(result.hasClipping).toBe(false)
      expect(result.passed).toBe(true)
    })

    it('有削波的音频应该被标记', async () => {
      const audioPath = '/audio/clipped.wav'
      const result = await checker.checkClipping(audioPath)

      expect(result.hasClipping).toBe(true)
      expect(result.passed).toBe(false)
    })
  })

  describe('checkDuration', () => {
    it('应该验证音频时长', async () => {
      const audioPath = '/audio/test.wav'
      const result = await checker.checkDuration(audioPath, {
        minimum: 10, // 最少 10 秒
        maximum: 300, // 最多 5 分钟
      })

      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('passed')
    })

    it('时长不足应该不通过', async () => {
      const audioPath = '/audio/short.wav' // 5 秒
      const result = await checker.checkDuration(audioPath, {
        minimum: 10,
      })

      expect(result.passed).toBe(false)
    })

    it('时长过长应该不通过', async () => {
      const audioPath = '/audio/long.wav' // 10 分钟
      const result = await checker.checkDuration(audioPath, {
        maximum: 300,
      })

      expect(result.passed).toBe(false)
    })
  })

  describe('generateReport', () => {
    it('应该生成完整的质量报告', async () => {
      const audioPath = '/audio/test.wav'
      const report = await checker.generateReport(audioPath)

      expect(report).toHaveProperty('overallScore')
      expect(report).toHaveProperty('passed')
      expect(report).toHaveProperty('checks')
      expect(report).toHaveProperty('recommendations')
      expect(report.checks).toHaveProperty('sampleRate')
      expect(report.checks).toHaveProperty('bitrate')
      expect(report.checks).toHaveProperty('noiseLevel')
      expect(report.checks).toHaveProperty('clipping')
      expect(report.checks).toHaveProperty('duration')
    })

    it('报告应该包含改进建议', async () => {
      const audioPath = '/audio/low_quality.wav'
      const report = await checker.generateReport(audioPath)

      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('批量检测', () => {
    it('应该支持批量检测多个音频', async () => {
      const audioPaths = [
        '/audio/test1.wav',
        '/audio/test2.wav',
        '/audio/test3.wav',
      ]

      const results = await checker.batchCheck(audioPaths)

      expect(results).toHaveLength(3)
      results.forEach((result: any) => {
        expect(result).toHaveProperty('path')
        expect(result).toHaveProperty('score')
        expect(result).toHaveProperty('passed')
      })
    })
  })
})

describe('AudioQualityThresholds', () => {
  it('应该使用正确的质量阈值', async () => {
    const { AudioQualityChecker, QUALITY_THRESHOLDS } = await import('../audio-quality-checker')

    expect(QUALITY_THRESHOLDS.MIN_SAMPLE_RATE).toBe(22050)
    expect(QUALITY_THRESHOLDS.MIN_BITRATE).toBe(128)
    expect(QUALITY_THRESHOLDS.MIN_SNR).toBe(30)
    expect(QUALITY_THRESHOLDS.MIN_DURATION).toBe(10)
    expect(QUALITY_THRESHOLDS.MAX_CLIPPING_RATIO).toBe(0.01)
  })

  it('应该支持自定义阈值', async () => {
    const { AudioQualityChecker } = await import('../audio-quality-checker')
    const customChecker = new AudioQualityChecker({
      minSampleRate: 44100,
      minBitrate: 256,
    })

    const result = await customChecker.checkQuality('/audio/test.wav')
    expect(result).toBeDefined()
  })
})
