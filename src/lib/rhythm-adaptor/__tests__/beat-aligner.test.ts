/**
 * 节奏对齐器测试
 * 测试歌词与节拍的对齐功能
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('BeatAligner', () => {
  let aligner: any

  beforeEach(async () => {
    const module = await import('../beat-aligner')
    aligner = new module.BeatAligner()
  })

  describe('align', () => {
    const mockBeatInfo = {
      bpm: 90,
      beatInterval: 667, // 60000 / 90
      offset: 0,
      confidence: 0.95,
    }

    it('应该将歌词对齐到节拍', async () => {
      const lyrics = ['第一句', '第二句', '第三句']
      const result = aligner.align(lyrics, mockBeatInfo)

      expect(result).toHaveLength(3)

      // 每句应该有时间戳
      result.forEach((line: any) => {
        expect(line).toHaveProperty('text')
        expect(line).toHaveProperty('startTime')
        expect(line).toHaveProperty('endTime')
        expect(line.startTime).toBeLessThan(line.endTime)
      })
    })

    it('应该确保每句对齐到节拍点', async () => {
      const lyrics = ['测试']
      const result = aligner.align(lyrics, mockBeatInfo)

      // 开始时间应该对齐到节拍
      const beatRemainder = result[0].startTime % mockBeatInfo.beatInterval
      expect(beatRemainder).toBeLessThan(50) // 允许 50ms 误差
    })

    it('应该处理多个小节', async () => {
      const lyrics = Array(8).fill('歌词')
      const result = aligner.align(lyrics, mockBeatInfo, { beatsPerBar: 4 })

      expect(result).toHaveLength(8)
    })
  })

  describe('速度适配', () => {
    it('应该根据 BPM 调整每句时长', async () => {
      const slowBPM = { bpm: 60, beatInterval: 1000, offset: 0, confidence: 0.9 }
      const fastBPM = { bpm: 120, beatInterval: 500, offset: 0, confidence: 0.9 }

      const lyrics = ['测试']

      const slowResult = aligner.align(lyrics, slowBPM)
      const fastResult = aligner.align(lyrics, fastBPM)

      // 快 BPM 时每句时长应该更短
      expect(fastResult[0].endTime - fastResult[0].startTime)
        .toBeLessThan(slowResult[0].endTime - slowResult[0].startTime)
    })
  })

  describe('对齐模式', () => {
    it('bar 模式应该按小节对齐', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['第一句', '第二句', '第三句', '第四句']

      const result = aligner.align(lyrics, beatInfo, { mode: 'bar', beatsPerBar: 4 })

      // 每句应该占据一个小节
      expect(result[0].duration).toBe(beatInfo.beatInterval * 4)
    })

    it('beat 模式应该按拍对齐', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['第一句', '第二句']

      const result = aligner.align(lyrics, beatInfo, { mode: 'beat' })

      // 每句应该对齐到最近的拍
      result.forEach((line: any) => {
        expect(line.startTime % beatInfo.beatInterval).toBeLessThan(50)
      })
    })

    it('syllable 模式应该按音节对齐', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['这是测试']

      const result = aligner.align(lyrics, beatInfo, { mode: 'syllable' })

      // 应该返回音节级别的时间戳
      expect(result[0].syllables).toBeDefined()
      expect(result[0].syllables.length).toBe(4)
    })
  })

  describe('强拍处理', () => {
    it('应该识别强拍位置', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['强拍开始', '弱拍开始']

      const result = aligner.align(lyrics, beatInfo, { markDownbeats: true })

      expect(result[0].isDownbeat).toBe(true)
    })

    it('应该将重要字词放在强拍上', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['这是重要的']

      const result = aligner.align(lyrics, beatInfo, {
        emphasizeKeywords: ['重要'],
      })

      const importantWord = result[0].syllables?.find((s: any) => s.text === '重')
      expect(importantWord?.isEmphasized).toBe(true)
    })
  })

  describe('间隙处理', () => {
    it('应该处理歌词间的间隙', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['第一句', '', '第三句'] // 空行表示间隙

      const result = aligner.align(lyrics, beatInfo)

      expect(result).toHaveLength(3)
      expect(result[1].isGap).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('空歌词数组应该返回空数组', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const result = aligner.align([], beatInfo)

      expect(result).toHaveLength(0)
    })

    it('无效 BPM 应该使用默认值', async () => {
      const invalidBeatInfo = { bpm: 0, beatInterval: 0, offset: 0, confidence: 0 }
      const lyrics = ['测试']

      const result = aligner.align(lyrics, invalidBeatInfo)

      expect(result).toBeDefined()
      expect(result[0]).toHaveProperty('startTime')
    })

    it('超长歌词应该正确处理', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const longLyrics = Array(100).fill('歌词')

      const result = aligner.align(longLyrics, beatInfo)

      expect(result).toHaveLength(100)
      // 验证时间顺序正确
      for (let i = 1; i < result.length; i++) {
        expect(result[i].startTime).toBeGreaterThanOrEqual(result[i - 1].endTime)
      }
    })
  })

  describe('导出格式', () => {
    it('应该导出为 LRC 格式', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['第一句', '第二句']

      const result = aligner.align(lyrics, beatInfo)
      const lrc = aligner.toLRC(result)

      expect(lrc).toContain('[00:')
      expect(lrc).toContain('第一句')
      expect(lrc).toContain('第二句')
    })

    it('应该导出为 SRT 格式', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['第一句', '第二句']

      const result = aligner.align(lyrics, beatInfo)
      const srt = aligner.toSRT(result)

      expect(srt).toContain('1')
      expect(srt).toContain('00:00:')
      expect(srt).toContain('第一句')
    })

    it('应该导出为 JSON 格式', async () => {
      const beatInfo = { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.95 }
      const lyrics = ['测试']

      const result = aligner.align(lyrics, beatInfo)
      const json = aligner.toJSON(result)

      expect(() => JSON.parse(json)).not.toThrow()
      const parsed = JSON.parse(json)
      expect(parsed).toHaveProperty('0')
    })
  })
})

describe('BeatAligner 工具函数', () => {
  it('calculateBeatInterval 应该正确计算节拍间隔', async () => {
    const { calculateBeatInterval } = await import('../beat-aligner')

    expect(calculateBeatInterval(60)).toBe(1000) // 60 BPM = 1000ms
    expect(calculateBeatInterval(120)).toBe(500) // 120 BPM = 500ms
    expect(calculateBeatInterval(90)).toBeCloseTo(667, -1) // 90 BPM ≈ 667ms
  })

  it('getDownbeatPositions 应该返回强拍位置', async () => {
    const { getDownbeatPositions } = await import('../beat-aligner')

    const positions = getDownbeatPositions(4, 4) // 4/4 拍

    expect(positions).toContain(0) // 第一拍是强拍
    expect(positions.length).toBe(1) // 4/4 拍只有一个强拍
  })
})
