// src/lib/audio/__tests__/integration.test.ts

import { describe, it, expect } from 'vitest'
import { TimestampMapper } from '../timestamp-mapper'
import { BeatAnalysisResult } from '../types'

describe('Beat Detection Integration', () => {
  it('should integrate beat detection with timestamp mapping', async () => {
    // 模拟节拍信息
    const beatInfo: BeatAnalysisResult = {
      bpm: 120,
      offset: 0,
      beatInterval: 500,
      confidence: 0.9,
    }

    const mapper = new TimestampMapper()
    const lyrics = `这是第一句歌词
这是第二句歌词
这是第三句歌词`

    const duration = 9000 // 9秒

    const result = mapper.mapLyricsToBeats(lyrics, beatInfo, duration)

    // 验证结果
    expect(result.length).toBe(3)

    // 验证时间对齐
    result.forEach((line, index) => {
      expect(line.startTime % beatInfo.beatInterval).toBeLessThan(50)
      expect(line.words).toBeDefined()
      expect(line.words!.length).toBeGreaterThan(0)

      console.log(`Line ${index + 1}: "${line.text}" (${line.startTime}ms - ${line.endTime}ms)`)
      line.words!.forEach(word => {
        console.log(`  Word: "${word.text}" (${word.startTime}ms - ${word.endTime}ms)`)
      })
    })
  })

  it('should handle various BPM ranges', () => {
    const mapper = new TimestampMapper()
    const lyrics = '测试歌词'

    const testBpms = [60, 90, 120, 140, 180]

    testBpms.forEach(bpm => {
      const beatInfo: BeatAnalysisResult = {
        bpm,
        offset: 0,
        beatInterval: 60000 / bpm,
        confidence: 0.9,
      }

      const result = mapper.mapLyricsToBeats(lyrics, beatInfo, 5000)

      expect(result.length).toBe(1)
      expect(result[0].words).toBeDefined()
    })
  })

  it('should handle Chinese and English lyrics', () => {
    const mapper = new TimestampMapper()
    const beatInfo: BeatAnalysisResult = {
      bpm: 120,
      offset: 0,
      beatInterval: 500,
      confidence: 0.9,
    }

    // 中文歌词
    const chineseLyrics = '中文测试歌词'
    const chineseResult = mapper.mapLyricsToBeats(chineseLyrics, beatInfo, 3000)
    expect(chineseResult[0].words!.length).toBe(6) // 6 characters

    // 英文歌词
    const englishLyrics = 'This is a test'
    const englishResult = mapper.mapLyricsToBeats(englishLyrics, beatInfo, 3000)
    expect(englishResult[0].words!.length).toBe(4) // 4 words
  })

  it('should handle edge cases gracefully', () => {
    const mapper = new TimestampMapper()
    const beatInfo: BeatAnalysisResult = {
      bpm: 120,
      offset: 0,
      beatInterval: 500,
      confidence: 0.9,
    }

    // Empty lyrics
    const emptyResult = mapper.mapLyricsToBeats('', beatInfo, 5000)
    expect(emptyResult).toHaveLength(0)

    // Single character
    const singleCharResult = mapper.mapLyricsToBeats('测', beatInfo, 1000)
    expect(singleCharResult).toHaveLength(1)
    expect(singleCharResult[0].words).toBeDefined()
  })
})
