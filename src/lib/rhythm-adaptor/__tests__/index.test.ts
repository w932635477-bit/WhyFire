/**
 * Rhythm Adaptor 集成测试
 * 测试节奏适配器的完整工作流程
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('RhythmAdaptor Integration', () => {
  let adaptor: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../index')
    adaptor = new module.RhythmAdaptor()
  })

  describe('完整工作流程', () => {
    it('应该完成从歌词到对齐时间戳的完整流程', async () => {
      const input = {
        lyrics: '你好世界，欢迎使用',
        beatInfo: {
          bpm: 90,
          beatInterval: 667,
          offset: 0,
          confidence: 0.95,
        },
        options: {
          dialect: 'mandarin',
          humanize: true,
        },
      }

      const result = await adaptor.process(input)

      expect(result).toHaveProperty('syllables')
      expect(result).toHaveProperty('alignedEvents')
      expect(result).toHaveProperty('timing')

      // 音节应该被正确切分
      expect(result.syllables.length).toBeGreaterThan(0)

      // 应该有时间戳
      result.alignedEvents.forEach((event: any) => {
        expect(event).toHaveProperty('startTime')
        expect(event).toHaveProperty('endTime')
        expect(event.startTime).toBeLessThan(event.endTime)
      })
    })

    it('应该支持方言特定的节奏处理', async () => {
      const input = {
        lyrics: '你吃饭了没',
        beatInfo: {
          bpm: 85,
          beatInterval: 706,
          offset: 0,
          confidence: 0.9,
        },
        options: {
          dialect: 'sichuan',
        },
      }

      const result = await adaptor.process(input)

      expect(result.dialect).toBe('sichuan')
      expect(result.syllables).toBeDefined()
    })

    it('应该支持粤语处理', async () => {
      const input = {
        lyrics: '你食咗饭未呀',
        beatInfo: {
          bpm: 95,
          beatInterval: 632,
          offset: 0,
          confidence: 0.9,
        },
        options: {
          dialect: 'cantonese',
        },
      }

      const result = await adaptor.process(input)

      expect(result.dialect).toBe('cantonese')
      expect(result.syllables).toBeDefined()
    })
  })

  describe('处理选项', () => {
    it('应该支持人性化处理', async () => {
      const input = {
        lyrics: '测试歌词',
        beatInfo: { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.9 },
        options: {
          humanize: true,
          humanizeAmount: 0.1,
        },
      }

      const result = await adaptor.process(input)

      expect(result.humanized).toBe(true)
    })

    it('应该支持节奏拉伸', async () => {
      const input = {
        lyrics: '测试歌词',
        beatInfo: { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.9 },
        options: {
          stretchRatio: 1.2,
        },
      }

      const result = await adaptor.process(input)

      expect(result.stretched).toBe(true)
    })

    it('应该支持律动模板', async () => {
      const input = {
        lyrics: '测试歌词',
        beatInfo: { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.9 },
        options: {
          grooveTemplate: 'hiphop',
        },
      }

      const result = await adaptor.process(input)

      expect(result.grooveTemplate).toBe('hiphop')
    })
  })

  describe('错误处理', () => {
    it('无效歌词应该返回空结果', async () => {
      const input = {
        lyrics: '',
        beatInfo: { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.9 },
      }

      const result = await adaptor.process(input)

      expect(result.syllables).toHaveLength(0)
    })

    it('无效 BPM 应该使用默认值', async () => {
      const input = {
        lyrics: '测试',
        beatInfo: { bpm: 0, beatInterval: 0, offset: 0, confidence: 0 },
      }

      const result = await adaptor.process(input)

      expect(result).toBeDefined()
      expect(result.fallbackBPM).toBe(90) // 默认 BPM
    })
  })

  describe('导出功能', () => {
    it('应该导出为字幕格式', async () => {
      const input = {
        lyrics: '测试歌词',
        beatInfo: { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.9 },
      }

      const result = await adaptor.process(input)
      const srt = adaptor.exportToSRT(result)

      expect(srt).toContain('00:00:')
      expect(srt).toContain('测试歌词')
    })

    it('应该导出为 LRC 格式', async () => {
      const input = {
        lyrics: '测试歌词',
        beatInfo: { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.9 },
      }

      const result = await adaptor.process(input)
      const lrc = adaptor.exportToLRC(result)

      expect(lrc).toContain('[00:')
      expect(lrc).toContain('测试歌词')
    })

    it('应该导出为 JSON 格式', async () => {
      const input = {
        lyrics: '测试歌词',
        beatInfo: { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.9 },
      }

      const result = await adaptor.process(input)
      const json = adaptor.exportToJSON(result)

      expect(() => JSON.parse(json)).not.toThrow()
    })
  })

  describe('性能测试', () => {
    it('长歌词应该高效处理', async () => {
      const longLyrics = '这是测试歌词'.repeat(50)
      const input = {
        lyrics: longLyrics,
        beatInfo: { bpm: 90, beatInterval: 667, offset: 0, confidence: 0.9 },
      }

      const startTime = Date.now()
      const result = await adaptor.process(input)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(5000) // 5 秒内完成
      expect(result.syllables.length).toBeGreaterThan(0)
    })
  })
})

describe('RhythmAdaptor 模块导出', () => {
  it('应该导出所有子模块', async () => {
    const module = await import('../index')

    expect(module.SyllableSplitter).toBeDefined()
    expect(module.BeatAligner).toBeDefined()
    expect(module.TimeStretcher).toBeDefined()
    expect(module.Humanizer).toBeDefined()
    expect(module.RhythmAdaptor).toBeDefined()
  })

  it('应该导出工具函数', async () => {
    const module = await import('../index')

    expect(typeof module.alignLyricsToBeat).toBe('function')
    expect(typeof module.humanizeSequence).toBe('function')
    expect(typeof module.stretchToDuration).toBe('function')
  })
})

describe('RhythmAdaptor 类型定义', () => {
  it('应该导出正确的类型', async () => {
    // 这个测试主要是确保类型导出存在
    // 实际类型检查由 TypeScript 编译器完成
    const { RhythmAdaptorOptions, ProcessResult } = await import('../types')

    expect(RhythmAdaptorOptions).toBeDefined()
    expect(ProcessResult).toBeDefined()
  })
})
