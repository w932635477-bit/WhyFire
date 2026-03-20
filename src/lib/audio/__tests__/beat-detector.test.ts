// src/lib/audio/__tests__/beat-detector.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BeatDetector } from '../beat-detector'

// Mock web-audio-beat-detector
vi.mock('web-audio-beat-detector', () => ({
  analyze: vi.fn(),
  guess: vi.fn(),
}))

describe('BeatDetector', () => {
  let detector: BeatDetector

  beforeEach(() => {
    detector = new BeatDetector()
    vi.clearAllMocks()
  })

  describe('analyze', () => {
    it('should return beat analysis result for valid audio', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024)
      const mockResult = {
        bpm: 120,
        offset: 0.5,
      }

      const webAudioBeatDetector = await import('web-audio-beat-detector')
      vi.mocked(webAudioBeatDetector.guess).mockResolvedValue(mockResult)

      // Mock AudioContext
      const mockDecodeAudioData = vi.fn().mockResolvedValue({})
      const mockClose = vi.fn().mockResolvedValue(undefined)

      const OriginalAudioContext = global.AudioContext
      // @ts-ignore
      global.AudioContext = class MockAudioContext {
        decodeAudioData = mockDecodeAudioData
        close = mockClose
      }

      const result = await detector.analyze(mockAudioBuffer)

      expect(result.bpm).toBe(120)
      expect(result.offset).toBe(0.5) // 库返回秒
      expect(result.beatInterval).toBe(500) // 60000 / 120 = 500ms
      expect(result.confidence).toBeGreaterThan(0)

      // Restore
      global.AudioContext = OriginalAudioContext
    })

    it('should clamp BPM to valid range', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024)
      const mockResult = {
        bpm: 300, // 超出正常范围
        offset: 0.5,
      }

      const webAudioBeatDetector = await import('web-audio-beat-detector')
      vi.mocked(webAudioBeatDetector.guess).mockResolvedValue(mockResult)

      // Mock AudioContext
      const mockDecodeAudioData = vi.fn().mockResolvedValue({})
      const mockClose = vi.fn().mockResolvedValue(undefined)

      const OriginalAudioContext = global.AudioContext
      // @ts-ignore
      global.AudioContext = class MockAudioContext {
        decodeAudioData = mockDecodeAudioData
        close = mockClose
      }

      const result = await detector.analyze(mockAudioBuffer)

      expect(result.bpm).toBeLessThanOrEqual(200)
      expect(result.bpm).toBeGreaterThanOrEqual(60)

      // Restore
      global.AudioContext = OriginalAudioContext
    })

    it('should handle analysis failure gracefully', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024)

      const webAudioBeatDetector = await import('web-audio-beat-detector')
      vi.mocked(webAudioBeatDetector.guess).mockRejectedValue(new Error('Analysis failed'))

      // Mock AudioContext
      const mockDecodeAudioData = vi.fn().mockResolvedValue({})
      const mockClose = vi.fn().mockResolvedValue(undefined)

      const OriginalAudioContext = global.AudioContext
      // @ts-ignore
      global.AudioContext = class MockAudioContext {
        decodeAudioData = mockDecodeAudioData
        close = mockClose
      }

      await expect(detector.analyze(mockAudioBuffer)).rejects.toThrow('节拍分析失败')

      // Restore
      global.AudioContext = OriginalAudioContext
    })

    it('should handle decodeAudioData failure and close AudioContext', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024)

      // Mock AudioContext
      const mockClose = vi.fn().mockResolvedValue(undefined)
      const mockDecodeAudioData = vi.fn().mockRejectedValue(new Error('Invalid audio format'))

      const OriginalAudioContext = global.AudioContext
      // @ts-ignore
      global.AudioContext = class MockAudioContext {
        decodeAudioData = mockDecodeAudioData
        close = mockClose
      }

      await expect(detector.analyze(mockAudioBuffer)).rejects.toThrow('节拍分析失败')

      // 确保 AudioContext 被关闭，即使在 decodeAudioData 失败时
      expect(mockClose).toHaveBeenCalled()

      // Restore
      global.AudioContext = OriginalAudioContext
    })
  })
})
