// src/lib/audio/__tests__/timestamp-mapper.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { TimestampMapper } from '../timestamp-mapper'
import { BeatAnalysisResult } from '../types'

describe('TimestampMapper', () => {
  let mapper: TimestampMapper

  beforeEach(() => {
    mapper = new TimestampMapper()
  })

  describe('mapLyricsToBeats', () => {
    const beatInfo: BeatAnalysisResult = {
      bpm: 120,
      offset: 0,
      beatInterval: 500,
      confidence: 0.9,
    }

    it('should map single line lyrics correctly', () => {
      const lyrics = '这是一句测试歌词'
      const duration = 5000 // 5秒

      const result = mapper.mapLyricsToBeats(lyrics, beatInfo, duration)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('这是一句测试歌词')
      expect(result[0].startTime).toBe(0)
      expect(result[0].endTime).toBe(5000)
      expect(result[0].words).toBeDefined()
      expect(result[0].words!.length).toBeGreaterThan(0)
    })

    it('should map multiple lines with beat alignment', () => {
      const lyrics = `第一句歌词
第二句歌词
第三句歌词`
      const duration = 9000 // 9秒

      const result = mapper.mapLyricsToBeats(lyrics, beatInfo, duration)

      expect(result).toHaveLength(3)

      // 每句应该对齐到节拍点
      result.forEach(line => {
        expect(line.startTime % beatInfo.beatInterval).toBeLessThan(50) // 允许50ms误差
      })

      // 检查顺序
      expect(result[0].startTime).toBeLessThan(result[1].startTime)
      expect(result[1].startTime).toBeLessThan(result[2].startTime)
    })

    it('should generate words array with proper timing', () => {
      const lyrics = '测试'
      const duration = 1000

      const result = mapper.mapLyricsToBeats(lyrics, beatInfo, duration)

      expect(result[0].words).toBeDefined()
      expect(result[0].words!.length).toBe(2) // 两个字

      // 验证 words 的时间戳
      const words = result[0].words!
      words.forEach((word, index) => {
        expect(word.text).toBeDefined()
        expect(word.startTime).toBeGreaterThanOrEqual(result[0].startTime)
        expect(word.endTime).toBeLessThanOrEqual(result[0].endTime)

        if (index > 0) {
          expect(word.startTime).toBeGreaterThanOrEqual(words[index - 1].endTime)
        }
      })
    })

    it('should handle empty lyrics', () => {
      const result = mapper.mapLyricsToBeats('', beatInfo, 5000)
      expect(result).toHaveLength(0)
    })

    it('should respect beat offset', () => {
      const beatInfoWithOffset: BeatAnalysisResult = {
        ...beatInfo,
        offset: 0.5, // 0.5秒 = 500ms
      }

      const lyrics = '测试歌词'
      const duration = 5000

      const result = mapper.mapLyricsToBeats(lyrics, beatInfoWithOffset, duration)

      // 第一句应该从 offset 开始或之后
      expect(result[0].startTime).toBeGreaterThanOrEqual(500)
    })

    it('should return empty array when audioDuration is zero or negative', () => {
      const lyrics = '测试歌词'

      const resultZero = mapper.mapLyricsToBeats(lyrics, beatInfo, 0)
      expect(resultZero).toHaveLength(0)

      const resultNegative = mapper.mapLyricsToBeats(lyrics, beatInfo, -1000)
      expect(resultNegative).toHaveLength(0)
    })

    it('should return empty array when beatInterval is zero or negative', () => {
      const lyrics = '测试歌词'
      const duration = 5000

      const invalidBeatInfo: BeatAnalysisResult = {
        ...beatInfo,
        beatInterval: 0,
      }

      const resultZero = mapper.mapLyricsToBeats(lyrics, invalidBeatInfo, duration)
      expect(resultZero).toHaveLength(0)

      const negativeBeatInfo: BeatAnalysisResult = {
        ...beatInfo,
        beatInterval: -500,
      }

      const resultNegative = mapper.mapLyricsToBeats(lyrics, negativeBeatInfo, duration)
      expect(resultNegative).toHaveLength(0)
    })

    it('should handle duration overflow when minDuration would exceed available duration', () => {
      // 3行歌词，每行至少2拍 = 1000ms，共3000ms
      // 但只有2000ms可用时长
      const lyrics = `短
短
短`
      const shortBeatInfo: BeatAnalysisResult = {
        bpm: 120,
        offset: 0,
        beatInterval: 500, // 2拍 = 1000ms minDuration
        confidence: 0.9,
      }
      const duration = 2000 // 只有2000ms

      const result = mapper.mapLyricsToBeats(lyrics, shortBeatInfo, duration)

      expect(result).toHaveLength(3)

      // 验证总时长不超过音频时长
      const totalDuration = result[result.length - 1].endTime - result[0].startTime
      expect(totalDuration).toBeLessThanOrEqual(2000)
    })

    it('should handle available duration exhaustion due to offset', () => {
      const beatInfoWithLargeOffset: BeatAnalysisResult = {
        ...beatInfo,
        offset: 4.5, // 4.5秒 offset
      }

      const lyrics = '测试'
      const duration = 5000 // 5秒，减去4.5秒offset只有500ms可用

      const result = mapper.mapLyricsToBeats(lyrics, beatInfoWithLargeOffset, duration)

      // 应该仍然返回结果（使用默认2拍时长）
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
