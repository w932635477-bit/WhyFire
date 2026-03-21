/**
 * 人性化处理器测试
 * 测试节奏和音高的人性化处理功能
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('Humanizer', () => {
  let humanizer: any

  beforeEach(async () => {
    const module = await import('../humanizer')
    humanizer = new module.Humanizer()
  })

  describe('humanizeTiming', () => {
    it('应该添加随机的时间偏移', async () => {
      const events = [
        { time: 0, duration: 500 },
        { time: 500, duration: 500 },
        { time: 1000, duration: 500 },
      ]

      const result = humanizer.humanizeTiming(events, { amount: 0.1 })

      // 时间应该有微小偏移但不破坏顺序
      for (let i = 1; i < result.length; i++) {
        expect(result[i].time).toBeGreaterThanOrEqual(result[i - 1].time)
      }
    })

    it('偏移量应该在指定范围内', async () => {
      const events = [{ time: 1000, duration: 500 }]
      const amount = 0.05 // 5% 偏移

      const results = []
      for (let i = 0; i < 100; i++) {
        const result = humanizer.humanizeTiming(events, { amount })
        results.push(result[0].time)
      }

      const minTime = Math.min(...results)
      const maxTime = Math.max(...results)
      const expectedRange = 1000 * 0.05 // 50ms

      expect(maxTime - minTime).toBeLessThanOrEqual(expectedRange * 2)
    })

    it('零偏移量应该不改变时间', async () => {
      const events = [{ time: 1000, duration: 500 }]

      const result = humanizer.humanizeTiming(events, { amount: 0 })

      expect(result[0].time).toBe(1000)
    })
  })

  describe('humanizeVelocity', () => {
    it('应该添加随机的力度变化', async () => {
      const notes = [
        { velocity: 100 },
        { velocity: 100 },
        { velocity: 100 },
      ]

      const result = humanizer.humanizeVelocity(notes, { amount: 0.1 })

      // 力度应该有变化
      const velocities = result.map((n: any) => n.velocity)
      const uniqueVelocities = new Set(velocities)
      expect(uniqueVelocities.size).toBeGreaterThan(1)
    })

    it('力度应该在有效范围内', async () => {
      const notes = Array(100).fill({ velocity: 100 })

      const result = humanizer.humanizeVelocity(notes, { amount: 0.3 })

      result.forEach((note: any) => {
        expect(note.velocity).toBeGreaterThanOrEqual(0)
        expect(note.velocity).toBeLessThanOrEqual(127)
      })
    })

    it('应该保持平均力度不变', async () => {
      const notes = Array(100).fill({ velocity: 100 })

      const result = humanizer.humanizeVelocity(notes, { amount: 0.1 })
      const avgVelocity = result.reduce((sum: number, n: any) => sum + n.velocity, 0) / result.length

      expect(avgVelocity).toBeCloseTo(100, -1) // 允许 10 的误差
    })
  })

  describe('humanizePitch', () => {
    it('应该添加微小的音高偏移', async () => {
      const notes = [
        { pitch: 60 }, // C4
        { pitch: 64 }, // E4
        { pitch: 67 }, // G4
      ]

      const result = humanizer.humanizePitch(notes, { cents: 10 })

      // 音高应该有微小偏移
      result.forEach((note: any) => {
        expect(note.pitch).toBeGreaterThanOrEqual(60)
        expect(note.pitch).toBeLessThanOrEqual(67)
      })
    })

    it('音高偏移不应该超过一个半音', async () => {
      const notes = [{ pitch: 60 }]

      const results = []
      for (let i = 0; i < 100; i++) {
        const result = humanizer.humanizePitch(notes, { cents: 50 })
        results.push(result[0].pitch)
      }

      const minPitch = Math.min(...results)
      const maxPitch = Math.max(...results)

      expect(maxPitch - minPitch).toBeLessThanOrEqual(1) // 不超过 1 个半音
    })
  })

  describe('swing', () => {
    it('应该应用摇摆节奏', async () => {
      const events = [
        { time: 0 },
        { time: 500 },
        { time: 1000 },
        { time: 1500 },
      ]

      const result = humanizer.swing(events, { ratio: 0.6 }) // 60% swing

      // 偶数拍应该稍晚
      expect(result[1].time).toBeGreaterThan(500)
      expect(result[3].time).toBeGreaterThan(1500)
    })

    it('不同摇摆比例应该产生不同结果', async () => {
      const events = [{ time: 0 }, { time: 500 }]

      const lightSwing = humanizer.swing(events, { ratio: 0.55 })
      const heavySwing = humanizer.swing(events, { ratio: 0.7 })

      // 重摇摆应该偏移更多
      const lightOffset = lightSwing[1].time - 500
      const heavyOffset = heavySwing[1].time - 500

      expect(heavyOffset).toBeGreaterThan(lightOffset)
    })

    it('零摇摆应该不改变时间', async () => {
      const events = [{ time: 0 }, { time: 500 }]

      const result = humanizer.swing(events, { ratio: 0.5 })

      expect(result[0].time).toBe(0)
      expect(result[1].time).toBe(500)
    })
  })

  describe('groove', () => {
    it('应该应用节奏律动模板', async () => {
      const events = [
        { time: 0 },
        { time: 500 },
        { time: 1000 },
        { time: 1500 },
      ]

      const result = humanizer.groove(events, { template: 'hiphop' })

      expect(result).toBeDefined()
      expect(result.length).toBe(4)
    })

    it('应该支持不同的律动模板', async () => {
      const events = [{ time: 0 }, { time: 500 }, { time: 1000 }, { time: 1500 }]

      const templates = ['hiphop', 'trap', 'boomBap', 'lofi']

      for (const template of templates) {
        const result = humanizer.groove(events, { template })
        expect(result).toBeDefined()
      }
    })
  })

  describe('综合人性化', () => {
    it('applyHumanization 应该同时处理所有维度', async () => {
      const sequence = {
        events: [
          { time: 0, pitch: 60, velocity: 100 },
          { time: 500, pitch: 64, velocity: 100 },
          { time: 1000, pitch: 67, velocity: 100 },
        ],
      }

      const result = humanizer.applyHumanization(sequence, {
        timing: { amount: 0.1 },
        velocity: { amount: 0.1 },
        pitch: { cents: 10 },
      })

      expect(result).toHaveProperty('events')
      expect(result.events).toHaveLength(3)
    })
  })

  describe('边界情况', () => {
    it('空事件数组应该返回空数组', async () => {
      const result = humanizer.humanizeTiming([], { amount: 0.1 })
      expect(result).toHaveLength(0)
    })

    it('单个事件应该正确处理', async () => {
      const events = [{ time: 1000, velocity: 100, pitch: 60 }]

      const result = humanizer.applyHumanization({ events }, {
        timing: { amount: 0.1 },
        velocity: { amount: 0.1 },
        pitch: { cents: 10 },
      })

      expect(result.events).toHaveLength(1)
    })
  })
})

describe('Humanizer 工具函数', () => {
  it('getGrooveTemplates 应该返回可用的律动模板', async () => {
    const { getGrooveTemplates } = await import('../humanizer')

    const templates = getGrooveTemplates()

    expect(Array.isArray(templates)).toBe(true)
    expect(templates).toContain('hiphop')
    expect(templates).toContain('trap')
  })

  it('validateHumanizationOptions 应该验证参数', async () => {
    const { validateHumanizationOptions } = await import('../humanizer')

    const validOptions = { timing: { amount: 0.1 } }
    expect(() => validateHumanizationOptions(validOptions)).not.toThrow()

    const invalidOptions = { timing: { amount: 2 } } // 超过 1
    expect(() => validateHumanizationOptions(invalidOptions)).toThrow()
  })
})
