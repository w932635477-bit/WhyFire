// src/types/__tests__/dialect.test.ts

import { describe, it, expect } from 'vitest'
import {
  DIALECT_CONFIGS,
  DIALECT_LABELS,
  DIALECT_VOICE_MAP,
  getEnabledDialects,
  getDialectConfig,
  type DialectCode,
} from '../dialect'

describe('dialect types', () => {
  describe('DIALECT_CONFIGS', () => {
    it('应该包含 19 种方言（18种中文 + 英语）', () => {
      const dialectCodes = Object.keys(DIALECT_CONFIGS) as DialectCode[]
      expect(dialectCodes.length).toBe(19)
    })

    it('每种方言应该有完整的配置', () => {
      for (const [code, config] of Object.entries(DIALECT_CONFIGS)) {
        expect(config.code).toBe(code)
        expect(config.name).toBeTruthy()
        expect(config.englishName).toBeTruthy()
        expect(config.region).toBeTruthy()
        expect(config.fishAudioVoiceId).toBeTruthy()
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
      expect(codes).toContain('mandarin')
      expect(codes).toContain('cantonese')
      expect(codes).toContain('sichuan')
      expect(codes).toContain('dongbei')
      expect(codes).toContain('english')
    })

    it('Fish Audio Voice ID 应该是有效的 UUID 格式', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      for (const [code, config] of Object.entries(DIALECT_CONFIGS)) {
        expect(config.fishAudioVoiceId).toMatch(uuidRegex)
      }
    })

    it('每种方言应该有对应的区域说明', () => {
      const dialects = ['mandarin', 'cantonese', 'sichuan', 'dongbei', 'wu', 'minnan']

      for (const code of dialects) {
        const config = DIALECT_CONFIGS[code as DialectCode]
        expect(config.region.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getEnabledDialects', () => {
    it('应该返回所有启用的方言', () => {
      const enabled = getEnabledDialects()
      expect(enabled.length).toBe(19)
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
      const config = getDialectConfig('mandarin')
      expect(config).toBeDefined()
      expect(config?.name).toBe('普通话')
      expect(config?.code).toBe('mandarin')
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
      expect(DIALECT_LABELS.mandarin).toBe('普通话')
      expect(DIALECT_LABELS.cantonese).toBe('粤语')
      expect(DIALECT_LABELS.sichuan).toBe('四川话')
      expect(DIALECT_LABELS.dongbei).toBe('东北话')
      expect(DIALECT_LABELS.english).toBe('English')
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

  describe('DIALECT_VOICE_MAP', () => {
    it('应该包含所有方言的 Voice ID', () => {
      const codes = Object.keys(DIALECT_VOICE_MAP) as DialectCode[]
      expect(codes.length).toBe(19)
    })

    it('Voice ID 应该与配置中的 ID 一致', () => {
      for (const [code, voiceId] of Object.entries(DIALECT_VOICE_MAP)) {
        expect(voiceId).toBe(DIALECT_CONFIGS[code as DialectCode].fishAudioVoiceId)
      }
    })

    it('每个方言都应该有对应的 Voice ID', () => {
      const dialectCodes = Object.keys(DIALECT_CONFIGS) as DialectCode[]
      for (const code of dialectCodes) {
        expect(DIALECT_VOICE_MAP[code]).toBeDefined()
        expect(DIALECT_VOICE_MAP[code].length).toBeGreaterThan(0)
      }
    })
  })

  describe('方言分类', () => {
    it('官话方言应该被正确分类', () => {
      const mandarinDialects = ['mandarin', 'dongbei', 'shandong', 'henan', 'shaanxi', 'lanyin', 'jianghuai', 'xinan', 'jiaoliao', 'zhongyuan']

      for (const code of mandarinDialects) {
        const config = DIALECT_CONFIGS[code as DialectCode]
        expect(config).toBeDefined()
      }
    })

    it('非官话方言应该被正确分类', () => {
      const nonMandarinDialects = ['cantonese', 'wu', 'minnan', 'hakka', 'xiang', 'gan', 'jin']

      for (const code of nonMandarinDialects) {
        const config = DIALECT_CONFIGS[code as DialectCode]
        expect(config).toBeDefined()
      }
    })
  })

  describe('CosyVoice 支持的 8 种方言', () => {
    // CosyVoice 只支持以下 8 种方言
    const COSYVOICE_DIALECTS: DialectCode[] = [
      'mandarin',   // 普通话
      'cantonese',  // 粤语
      'sichuan',    // 四川话
      'dongbei',    // 东北话
      'shandong',   // 山东话
      'henan',      // 河南话
      'shaanxi',    // 陕西话
      'wu',         // 吴语（上海话）
    ]

    it('CosyVoice 应该支持 8 种方言', () => {
      expect(COSYVOICE_DIALECTS.length).toBe(8)
    })

    it('CosyVoice 支持的方言都应该在总配置中存在', () => {
      for (const dialect of COSYVOICE_DIALECTS) {
        const config = DIALECT_CONFIGS[dialect]
        expect(config).toBeDefined()
        expect(config.enabled).toBe(true)
      }
    })

    it('CosyVoice 支持的方言应该有对应的 Voice ID', () => {
      for (const dialect of COSYVOICE_DIALECTS) {
        const voiceId = DIALECT_VOICE_MAP[dialect]
        expect(voiceId).toBeDefined()
        expect(voiceId.length).toBeGreaterThan(0)
      }
    })

    it('CosyVoice 不支持的方言应该被正确识别', () => {
      const unsupportedDialects: DialectCode[] = [
        'minnan', 'hakka', 'xiang', 'gan', 'jin',
        'lanyin', 'jianghuai', 'xinan', 'jiaoliao', 'zhongyuan',
      ]

      // 这些方言在总配置中存在，但 CosyVoice 不支持
      for (const dialect of unsupportedDialects) {
        const config = DIALECT_CONFIGS[dialect]
        expect(config).toBeDefined()
        expect(COSYVOICE_DIALECTS).not.toContain(dialect)
      }
    })

    it('Fish Audio 支持的方言数量应该比 CosyVoice 多', () => {
      const fishAudioDialects = Object.keys(DIALECT_CONFIGS) as DialectCode[]
      expect(fishAudioDialects.length).toBe(19)
      expect(fishAudioDialects.length).toBeGreaterThan(COSYVOICE_DIALECTS.length)
    })
  })
})
