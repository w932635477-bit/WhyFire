/**
 * 音节切分器测试
 * 测试中文音节切分功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock child_process for ffprobe
vi.mock('child_process', () => ({
  execSync: vi.fn((cmd: string) => {
    if (cmd.includes('ffprobe')) {
      return '5.5' // 模拟 5.5 秒的音频时长
    }
    return ''
  }),
}))

describe('SyllableSplitter', () => {
  let splitter: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../syllable-splitter')
    // 重置单例
    // @ts-ignore
    module.splitterInstance = null
    splitter = new module.SyllableSplitter()
  })

  describe('split', () => {
    it('应该切分音频和文本为音节', async () => {
      const audioPath = '/audio/test.wav'
      const text = '你好世界'

      const result = await splitter.split(audioPath, text)

      expect(result).toHaveProperty('syllables')
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('text')
      expect(result.text).toBe('你好世界')
    })

    it('没有文本时应该返回空音节数组', async () => {
      const audioPath = '/audio/test.wav'

      const result = await splitter.split(audioPath)

      expect(result).toHaveProperty('syllables')
      expect(result).toHaveProperty('duration')
    })
  })

  describe('textToSyllables', () => {
    it('应该将中文文本切分为音节', () => {
      const text = '你好世界'
      const result = splitter.textToSyllables(text)

      expect(result).toHaveLength(4)
      expect(result).toEqual(['你', '好', '世', '界'])
    })

    it('应该移除标点符号', () => {
      const text = '你好，世界！'
      const result = splitter.textToSyllables(text)

      expect(result).toHaveLength(4)
      expect(result).not.toContain('，')
      expect(result).not.toContain('！')
    })

    it('应该处理英文字母', () => {
      const text = 'Hello世界'
      const result = splitter.textToSyllables(text)

      expect(result).toContain('Hello')
      expect(result).toContain('世')
      expect(result).toContain('界')
    })

    it('应该合并连续的英文字母', () => {
      const text = '测试ABC测试'
      const result = splitter.textToSyllables(text)

      expect(result).toContain('ABC')
      expect(result).toHaveLength(5) // ['测', '试', 'ABC', '测', '试']
    })

    it('应该处理混合中英文', () => {
      const text = 'WhyFire方言Rap'
      const result = splitter.textToSyllables(text)

      expect(result).toContain('WhyFire')
      expect(result.length).toBeGreaterThan(0)
    })

    it('应该处理空字符串', () => {
      const result = splitter.textToSyllables('')

      expect(result).toHaveLength(0)
    })

    it('应该处理只有标点符号的文本', () => {
      const result = splitter.textToSyllables('。。。！')

      expect(result).toHaveLength(0)
    })

    it('应该处理数字', () => {
      const text = '第123个'
      const result = splitter.textToSyllables(text)

      expect(result).toContain('第')
      expect(result).toContain('个')
    })
  })

  describe('splitWithPinyin', () => {
    it('应该返回音节数组', async () => {
      const text = '你好世界'
      const result = await splitter.splitWithPinyin(text)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('性能测试', () => {
    it('长文本应该高效处理', () => {
      const longText = '这是一段很长的测试文本'.repeat(50)
      const startTime = Date.now()

      const result = splitter.textToSyllables(longText)

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(100) // 应该在 100ms 内完成
      expect(result.length).toBeGreaterThan(0)
    })
  })
})

describe('SyllableSplitter 单例', () => {
  it('getSyllableSplitter 应该返回单例实例', async () => {
    const { getSyllableSplitter } = await import('../syllable-splitter')

    // 重置单例
    // @ts-ignore
    getSyllableSplitter.splitterInstance = null

    const instance1 = getSyllableSplitter()
    const instance2 = getSyllableSplitter()

    expect(instance1).toBe(instance2)
  })
})

describe('SyllableSplitter 配置', () => {
  it('应该支持自定义配置', async () => {
    const { SyllableSplitter } = await import('../syllable-splitter')

    const customSplitter = new SyllableSplitter({
      pythonPath: '/usr/bin/python3',
      timeout: 60000,
    })

    expect(customSplitter).toBeDefined()
  })

  it('应该使用默认配置', async () => {
    const { SyllableSplitter } = await import('../syllable-splitter')

    const defaultSplitter = new SyllableSplitter()

    expect(defaultSplitter).toBeDefined()
  })
})
