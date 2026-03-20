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
  })
})
