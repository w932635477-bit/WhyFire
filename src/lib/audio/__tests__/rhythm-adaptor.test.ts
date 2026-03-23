// src/lib/audio/__tests__/rhythm-adaptor.test.ts
/**
 * Rhythm Adaptor 测试
 * 测试节奏适配器：音节切分、节奏对齐、时间拉伸
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RhythmAdaptor, getRhythmAdaptor, createRhythmAdaptor } from '../rhythm-adaptor'
import type { BeatAnalysisResult } from '../types'

describe('RhythmAdaptor', () => {
  let adaptor: RhythmAdaptor

  beforeEach(() => {
    adaptor = createRhythmAdaptor()
  })

  // ===========================================
  // 音节切分测试
  // ===========================================
  describe('segmentSyllables', () => {
    it('应该正确切分中文字符', () => {
      const text = '你好世界'
      const syllables = adaptor.segmentSyllables(text)
      expect(syllables).toHaveLength(4)
      expect(syllables.map(s => s.text)).toEqual(['你', '好', '世', '界'])
    })

    it('应该正确处理标点符号', () => {
      const text = '你好，世界！'
      const syllables = adaptor.segmentSyllables(text)
      expect(syllables).toHaveLength(4) // 标点不作为音节
    })

    it('应该正确处理空格', () => {
      const text = '你好 世界'
      const syllables = adaptor.segmentSyllables(text)
      expect(syllables).toHaveLength(4)
    })

    it('应该正确处理混合中英文', () => {
      const text = 'Hello世界'
      const syllables = adaptor.segmentSyllables(text)
      // 英文单词作为整体，中文按字符
      expect(syllables.length).toBeGreaterThan(0)
      expect(syllables[0].text).toBe('Hello')
    })

    it('应该正确处理数字', () => {
      const text = '123'
      const syllables = adaptor.segmentSyllables(text)
      // 连续数字作为一个整体
      expect(syllables.length).toBeGreaterThan(0)
      expect(syllables[0].text).toBe('123')
    })

    it('空字符串应该返回空数组', () => {
      const syllables = adaptor.segmentSyllables('')
      expect(syllables).toHaveLength(0)
    })

    it('只有标点的字符串应该返回空数组', () => {
      const syllables = adaptor.segmentSyllables('，。！？')
      expect(syllables).toHaveLength(0)
    })

    it('应该保留音节的原始位置信息', () => {
      const text = '你好世界'
      const syllables = adaptor.segmentSyllables(text)
      expect(syllables[0].startIndex).toBe(0)
      expect(syllables[0].endIndex).toBe(1)
      expect(syllables[3].startIndex).toBe(3)
    })

    it('应该识别多音字的上下文', () => {
      const text = '长了长'
      const syllables = adaptor.segmentSyllables(text)
      // 不管多音字，只是简单切分
      expect(syllables).toHaveLength(3)
      expect(syllables.map(s => s.text)).toEqual(['长', '了', '长'])
    })
  })

  // ===========================================
  // 节奏对齐测试
  // ===========================================
  describe('alignToBeats', () => {
    const beatInfo: BeatAnalysisResult = {
      bpm: 120,
      offset: 0,
      beatInterval: 500, // 500ms per beat
      confidence: 0.9,
    }

    it('应该将音节对齐到节拍点', () => {
      const syllables = adaptor.segmentSyllables('你好世界')
      const aligned = adaptor.alignToBeats(syllables, beatInfo)

      expect(aligned.length).toBe(4)
      // 每个音节应该有时间和节拍信息
      aligned.forEach(s => {
        expect(s.startTime).toBeGreaterThanOrEqual(0)
        expect(s.endTime).toBeGreaterThan(s.startTime)
        expect(s.duration).toBeGreaterThan(0)
      })
    })

    it('应该考虑节拍偏移量', () => {
      const beatWithOffset: BeatAnalysisResult = {
        ...beatInfo,
        offset: 0.5, // 500ms offset
      }
      const syllables = adaptor.segmentSyllables('测')
      const aligned = adaptor.alignToBeats(syllables, beatWithOffset)

      // 第一个音节应该在 offset 之后开始
      expect(aligned[0].startTime).toBeGreaterThanOrEqual(500)
    })

    it('应该处理比节拍间隔长的音节', () => {
      const syllables = adaptor.segmentSyllables('长音节测试')
      const aligned = adaptor.alignToBeats(syllables, beatInfo)

      // 所有音节都应该有合理的时长
      aligned.forEach(s => {
        expect(s.duration).toBeGreaterThanOrEqual(100) // minSyllableDuration
      })
    })

    it('应该处理快速连续的音节', () => {
      const syllables = adaptor.segmentSyllables('快快快快')
      const aligned = adaptor.alignToBeats(syllables, beatInfo)

      expect(aligned.length).toBe(4)
      // 应该保持顺序
      for (let i = 1; i < aligned.length; i++) {
        expect(aligned[i].startTime).toBeGreaterThanOrEqual(aligned[i - 1].endTime)
      }
    })

    it('应该保持音节的相对顺序', () => {
      const syllables = adaptor.segmentSyllables('第一句')
      const aligned = adaptor.alignToBeats(syllables, beatInfo)

      for (let i = 1; i < aligned.length; i++) {
        expect(aligned[i].startTime).toBeGreaterThanOrEqual(aligned[i - 1].endTime)
      }
    })

    it('空音节数组应该返回空数组', () => {
      const aligned = adaptor.alignToBeats([], beatInfo)
      expect(aligned).toHaveLength(0)
    })

    it('无效节拍信息应该使用默认值', () => {
      const invalidBeatInfo: BeatAnalysisResult = {
        bpm: 0,
        offset: 0,
        beatInterval: 0,
        confidence: 0,
      }
      const syllables = adaptor.segmentSyllables('测')

      // 应该有合理的默认行为
      expect(() => adaptor.alignToBeats(syllables, invalidBeatInfo)).not.toThrow()
      const aligned = adaptor.alignToBeats(syllables, invalidBeatInfo)
      expect(aligned.length).toBe(1)
    })
  })

  // ===========================================
  // 时间拉伸测试
  // ===========================================
  describe('stretchTiming', () => {
    it('应该按比例拉伸时间', () => {
      const syllables = adaptor.segmentSyllables('测试')
      const aligned = adaptor.alignToBeats(syllables, {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.9,
      })

      const stretched = adaptor.stretchTiming(aligned, 1.5)

      expect(stretched[0].duration).toBe(aligned[0].duration * 1.5)
      expect(stretched[1].duration).toBe(aligned[1].duration * 1.5)
    })

    it('应该按比例压缩时间', () => {
      const syllables = adaptor.segmentSyllables('测试')
      const aligned = adaptor.alignToBeats(syllables, {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.9,
      })

      const compressed = adaptor.stretchTiming(aligned, 0.5)

      expect(compressed[0].duration).toBe(aligned[0].duration * 0.5)
      expect(compressed[1].duration).toBe(aligned[1].duration * 0.5)
    })

    it('拉伸因子为 1 应该保持不变', () => {
      const syllables = adaptor.segmentSyllables('测')
      const aligned = adaptor.alignToBeats(syllables, {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.9,
      })

      const result = adaptor.stretchTiming(aligned, 1.0)

      expect(result[0].duration).toBe(aligned[0].duration)
    })

    it('应该更新 startTime 和 endTime', () => {
      const syllables = adaptor.segmentSyllables('测试') // Use Chinese to get 2 syllables
      const aligned = adaptor.alignToBeats(syllables, {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.9,
      })

      const stretched = adaptor.stretchTiming(aligned, 2.0)

      expect(stretched[0].startTime).toBe(aligned[0].startTime)
      expect(stretched[1].startTime).toBe(stretched[0].endTime)
    })

    it('负拉伸因子应该抛出错误', () => {
      const syllables = adaptor.segmentSyllables('测')
      const aligned = adaptor.alignToBeats(syllables, {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.9,
      })

      expect(() => adaptor.stretchTiming(aligned, -1)).toThrow()
    })

    it('零拉伸因子应该抛出错误', () => {
      const syllables = adaptor.segmentSyllables('测')
      const aligned = adaptor.alignToBeats(syllables, {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.9,
      })

      expect(() => adaptor.stretchTiming(aligned, 0)).toThrow()
    })

    it('应该保持段落的相对顺序', () => {
      const syllables = adaptor.segmentSyllables('ABC')
      const aligned = adaptor.alignToBeats(syllables, {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.9,
      })

      const stretched = adaptor.stretchTiming(aligned, 1.5)

      for (let i = 1; i < stretched.length; i++) {
        expect(stretched[i].startTime).toBeGreaterThanOrEqual(stretched[i - 1].endTime)
      }
    })
  })

  // ===========================================
  // 综合功能测试
  // ===========================================
  describe('adapt', () => {
    const beatInfo: BeatAnalysisResult = {
      bpm: 90,
      offset: 0,
      beatInterval: 667, // ~667ms per beat at 90 BPM
      confidence: 0.9,
    }

    it('应该完整处理文本到节奏对齐', () => {
      const text = '这是一段测试歌词'
      const targetDuration = 5000 // 5 秒
      const result = adaptor.adapt(text, beatInfo, targetDuration)

      expect(result.syllables.length).toBeGreaterThan(0)
      expect(result.totalDuration).toBeLessThanOrEqual(targetDuration * 1.1) // 允许 10% 误差
    })

    it('应该处理多行歌词', () => {
      const text = `第一行歌词
第二行歌词
第三行歌词`
      const targetDuration = 10000
      const result = adaptor.adapt(text, beatInfo, targetDuration)

      expect(result.lines).toBeDefined()
      expect(result.lines!.length).toBe(3)
    })

    it('应该自动调整以适应目标时长', () => {
      const text = '短文本'
      const targetDuration = 5000
      const result = adaptor.adapt(text, beatInfo, targetDuration)

      expect(result.totalDuration).toBeGreaterThan(0)
      expect(result.syllables.length).toBe(3)
    })

    it('应该处理文本过长的情况', () => {
      const text = '这是一段非常长的测试文本'.repeat(20)
      const targetDuration = 3000 // 短时长
      const result = adaptor.adapt(text, beatInfo, targetDuration)

      // 应该有一些音节被处理
      expect(result.syllables.length).toBeGreaterThan(0)
    })
  })

  // ===========================================
  // 方言特定测试
  // ===========================================
  describe('方言特定处理', () => {
    it('应该正确处理粤语音节', () => {
      // 粤语和普通话一样，按字符切分
      const text = '粤语测试'
      const syllables = adaptor.segmentSyllables(text)
      expect(syllables).toHaveLength(4)
    })

    it('应该正确处理四川话音节', () => {
      const text = '四川话测试'
      const syllables = adaptor.segmentSyllables(text)
      expect(syllables).toHaveLength(5)
    })

    it('应该正确处理东北话音节', () => {
      const text = '东北话测试'
      const syllables = adaptor.segmentSyllables(text)
      expect(syllables).toHaveLength(5)
    })
  })

  // ===========================================
  // 边界条件测试
  // ===========================================
  describe('边界条件', () => {
    const beatInfo: BeatAnalysisResult = {
      bpm: 120,
      offset: 0,
      beatInterval: 500,
      confidence: 0.9,
    }

    it('极短文本（1个字符）应该正确处理', () => {
      const result = adaptor.adapt('啊', beatInfo, 1000)
      expect(result.syllables).toHaveLength(1)
    })

    it('极快 BPM（200+）应该正确处理', () => {
      const fastBeatInfo: BeatAnalysisResult = {
        bpm: 220,
        offset: 0,
        beatInterval: 273,
        confidence: 0.9,
      }
      const result = adaptor.adapt('测试文本', fastBeatInfo, 2000)
      expect(result.syllables.length).toBeGreaterThan(0)
    })

    it('极慢 BPM（60-）应该正确处理', () => {
      const slowBeatInfo: BeatAnalysisResult = {
        bpm: 50,
        offset: 0,
        beatInterval: 1200,
        confidence: 0.9,
      }
      const result = adaptor.adapt('测试文本', slowBeatInfo, 5000)
      expect(result.syllables.length).toBeGreaterThan(0)
    })

    it('零目标时长应该返回空结果', () => {
      const result = adaptor.adapt('测试', beatInfo, 0)
      expect(result.syllables).toHaveLength(0)
    })

    it('负目标时长应该返回空结果', () => {
      const result = adaptor.adapt('测试', beatInfo, -1000)
      expect(result.syllables).toHaveLength(0)
    })
  })

  // ===========================================
  // 性能测试
  // ===========================================
  describe('性能', () => {
    it('处理 1000 个字符应该在合理时间内完成', () => {
      const longText = '测试'.repeat(500)
      const beatInfo: BeatAnalysisResult = {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.9,
      }

      const start = performance.now()
      adaptor.adapt(longText, beatInfo, 60000)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(100) // 应该在 100ms 内完成
    })
  })
})

// ===========================================
// 单例测试
// ===========================================
describe('getRhythmAdaptor', () => {
  it('应该返回单例实例', () => {
    const instance1 = getRhythmAdaptor()
    const instance2 = getRhythmAdaptor()
    expect(instance1).toBe(instance2)
  })
})
