/**
 * Dialect 类型单元测试
 */

import { describe, it, expect } from 'vitest'
import {
  DIALECT_CONFIGS,
  DIALECT_LABELS,
  getEnabledDialects,
  getDialectConfig,
  type DialectCode,
} from '@/types/dialect.js'

describe('Dialect Types', () => {
  describe('DIALECT_CONFIGS', () => {
    it('should have 10 dialects (original + mandarin + 8 regional)', () => {
      expect(Object.keys(DIALECT_CONFIGS).length).toBe(10)
    })

    it('should have original as first dialect', () => {
      expect(DIALECT_CONFIGS.original).toBeDefined()
      expect(DIALECT_CONFIGS.original.name).toBe('原声')
    })

    it('each dialect should have required fields', () => {
      Object.values(DIALECT_CONFIGS).forEach(config => {
        expect(config.code).toBeDefined()
        expect(config.name).toBeDefined()
        expect(config.englishName).toBeDefined()
        expect(config.region).toBeDefined()
        expect(config.sampleText).toBeDefined()
        expect(typeof config.enabled).toBe('boolean')
      })
    })

    it('all dialects should be enabled by default', () => {
      Object.values(DIALECT_CONFIGS).forEach(config => {
        expect(config.enabled).toBe(true)
      })
    })

    it('should contain all expected dialect codes', () => {
      const expectedCodes: DialectCode[] = [
        'original', 'cantonese', 'sichuan', 'dongbei',
        'wu', 'shaanxi', 'minnan', 'tianjin', 'nanjing',
      ]

      expectedCodes.forEach(code => {
        expect(DIALECT_CONFIGS[code]).toBeDefined()
      })
    })

    it('should contain mandarin', () => {
      expect(DIALECT_CONFIGS).toHaveProperty('mandarin')
      expect(DIALECT_CONFIGS.mandarin.name).toBe('普通话')
    })
  })

  describe('DIALECT_LABELS', () => {
    it('should have labels for all dialects', () => {
      const dialectCodes = Object.keys(DIALECT_CONFIGS) as DialectCode[]

      dialectCodes.forEach(code => {
        expect(DIALECT_LABELS[code]).toBeDefined()
        expect(typeof DIALECT_LABELS[code]).toBe('string')
      })
    })

    it('original label should be 原声', () => {
      expect(DIALECT_LABELS.original).toBe('原声')
    })

    it('cantonese label should be 粤语', () => {
      expect(DIALECT_LABELS.cantonese).toBe('粤语')
    })
  })

  describe('getEnabledDialects', () => {
    it('should return all dialects (all enabled by default)', () => {
      const enabled = getEnabledDialects()
      expect(enabled.length).toBe(10)
    })

    it('should only return enabled dialects', () => {
      const enabled = getEnabledDialects()
      enabled.forEach(dialect => {
        expect(dialect.enabled).toBe(true)
      })
    })
  })

  describe('getDialectConfig', () => {
    it('should return config for valid code', () => {
      const config = getDialectConfig('cantonese')
      expect(config).toBeDefined()
      expect(config?.code).toBe('cantonese')
      expect(config?.name).toBe('粤语')
    })

    it('should return undefined for invalid code', () => {
      // @ts-expect-error Testing invalid code
      const config = getDialectConfig('invalid-code')
      expect(config).toBeUndefined()
    })

    it('should return correct config for original', () => {
      const config = getDialectConfig('original')
      expect(config).toBeDefined()
      expect(config?.name).toBe('原声')
      expect(config?.region).toBe('本色')
    })
  })
})
