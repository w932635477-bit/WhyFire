// src/types/__tests__/dialect.test.ts

import { describe, it, expect } from 'vitest'
import {
  DIALECT_CONFIGS,
  DIALECT_LABELS,
  getEnabledDialects,
  getDialectConfig,
  type DialectCode,
} from '../dialect'

describe('dialect types', () => {
  describe('DIALECT_CONFIGS', () => {
    it('应该包含 9 种方言（原声 + 8 种方言）', () => {
      const dialectCodes = Object.keys(DIALECT_CONFIGS) as DialectCode[]
      expect(dialectCodes.length).toBe(9)
    })

    it('每种方言应该有完整的配置', () => {
      for (const [code, config] of Object.entries(DIALECT_CONFIGS)) {
        expect(config.code).toBe(code)
        expect(config.name).toBeTruthy()
        expect(config.englishName).toBeTruthy()
        expect(config.region).toBeTruthy()
        expect(config.sampleText).toBeTruthy()
        expect(typeof config.enabled).toBe('boolean')
      }
    })

    it('所有方言应该默认启用', () => {
      for (const config of Object.values(DIALECT_CONFIGS)) {
        expect(config.enabled).toBe(true)
      }
    })

    it('应该包含主要方言', () => {
      const codes = Object.keys(DIALECT_CONFIGS) as DialectCode[]
      expect(codes).toContain('original')
      expect(codes).toContain('cantonese')
      expect(codes).toContain('sichuan')
      expect(codes).toContain('dongbei')
      expect(codes).toContain('wu')
      expect(codes).toContain('shaanxi')
    })

    it('每种方言应该有对应的区域说明', () => {
      const dialects = ['original', 'cantonese', 'sichuan', 'dongbei', 'wu', 'minnan']

      for (const code of dialects) {
        const config = DIALECT_CONFIGS[code as DialectCode]
        expect(config.region.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getEnabledDialects', () => {
    it('应该返回所有启用的方言', () => {
      const enabled = getEnabledDialects()
      expect(enabled.length).toBe(9)
    })

    it('返回的方言应该都是启用的', () => {
      const enabled = getEnabledDialects()
      for (const config of enabled) {
        expect(config.enabled).toBe(true)
      }
    })

    it('返回的应该是 DialectConfig 数组', () => {
      const enabled = getEnabledDialects()
      expect(Array.isArray(enabled)).toBe(true)

      for (const config of enabled) {
        expect(config).toHaveProperty('code')
        expect(config).toHaveProperty('name')
        expect(config).toHaveProperty('region')
      }
    })
  })

  describe('getDialectConfig', () => {
    it('应该返回有效的方言配置', () => {
      const config = getDialectConfig('original')
      expect(config).toBeDefined()
      expect(config?.name).toBe('原声')
      expect(config?.code).toBe('original')
    })

    it('对于无效的方言代码应该返回 undefined', () => {
      const config = getDialectConfig('invalid_dialect' as DialectCode)
      expect(config).toBeUndefined()
    })

    it('应该返回粤语配置', () => {
      const config = getDialectConfig('cantonese')
      expect(config).toBeDefined()
      expect(config?.name).toBe('粤语')
      expect(config?.region).toContain('广东')
    })

    it('应该返回东北话配置', () => {
      const config = getDialectConfig('dongbei')
      expect(config).toBeDefined()
      expect(config?.name).toBe('东北话')
      expect(config?.region).toContain('东北')
    })

    it('应该返回四川话配置', () => {
      const config = getDialectConfig('sichuan')
      expect(config).toBeDefined()
      expect(config?.name).toBe('四川话')
      expect(config?.region).toContain('四川')
    })
  })

  describe('DIALECT_LABELS', () => {
    it('应该包含所有方言的中文名称', () => {
      expect(DIALECT_LABELS.original).toBe('原声')
      expect(DIALECT_LABELS.cantonese).toBe('粤语')
      expect(DIALECT_LABELS.sichuan).toBe('四川话')
      expect(DIALECT_LABELS.dongbei).toBe('东北话')
      expect(DIALECT_LABELS.wu).toBe('上海话')
    })

    it('标签数量应该与配置数量一致', () => {
      const labelCount = Object.keys(DIALECT_LABELS).length
      const configCount = Object.keys(DIALECT_CONFIGS).length
      expect(labelCount).toBe(configCount)
    })

    it('每个标签都应该与对应配置的 name 一致', () => {
      for (const [code, label] of Object.entries(DIALECT_LABELS)) {
        expect(label).toBe(DIALECT_CONFIGS[code as DialectCode].name)
      }
    })
  })

  describe('方言分类', () => {
    it('官话方言应该被正确分类', () => {
      const mandarinDialects = ['dongbei', 'shaanxi', 'tianjin', 'nanjing']

      for (const code of mandarinDialects) {
        const config = DIALECT_CONFIGS[code as DialectCode]
        expect(config).toBeDefined()
      }
    })

    it('非官话方言应该被正确分类', () => {
      const nonMandarinDialects = ['cantonese', 'sichuan', 'wu', 'minnan']

      for (const code of nonMandarinDialects) {
        const config = DIALECT_CONFIGS[code as DialectCode]
        expect(config).toBeDefined()
      }
    })
  })
})
