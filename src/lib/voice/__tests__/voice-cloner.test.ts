/**
 * 声音克隆器测试
 * 测试声音克隆和声音特征提取功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { VoiceProfile, VoiceCloneOptions, VoiceConvertOptions } from '../types'

// Mock child_process with proper default export
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>()
  return {
    ...actual,
    execSync: vi.fn((cmd: string) => {
      if (cmd.includes('train_gpt_sovits')) {
        return JSON.stringify({
          status: 'success',
          model_path: '/data/voice-models/test-user/model.pt',
          duration: 30,
          quality: 0.85,
        })
      }
      if (cmd.includes('inference_gpt_sovits')) {
        return JSON.stringify({
          status: 'success',
          audio_path: '/output/synthesized.wav',
        })
      }
      return ''
    }),
    default: {
      execSync: vi.fn((cmd: string) => ''),
    },
  }
})

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(async () => undefined),
    writeFile: vi.fn(async () => undefined),
    readFile: vi.fn(async () => JSON.stringify({
      id: 'voice_test-user_1234567890',
      userId: 'test-user',
      modelPath: '/data/voice-models/test-user/model.pt',
      referenceAudioPath: '/audio/sample.wav',
      sampleDuration: 30,
      quality: 0.85,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userType: 'wechat',
    })),
    access: vi.fn(async () => undefined),
    rm: vi.fn(async () => undefined),
  },
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async () => undefined),
  readFile: vi.fn(async () => JSON.stringify({
    id: 'voice_test-user_1234567890',
    userId: 'test-user',
    modelPath: '/data/voice-models/test-user/model.pt',
    referenceAudioPath: '/audio/sample.wav',
    sampleDuration: 30,
    quality: 0.85,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    userType: 'wechat',
  })),
  access: vi.fn(async () => undefined),
  rm: vi.fn(async () => undefined),
}))

describe('VoiceCloner', () => {
  let voiceCloner: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../voice-cloner')
    // 重置单例
    // @ts-ignore
    module.clonerInstance = null
    voiceCloner = new module.VoiceCloner()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('clone', () => {
    it('应该从音频样本创建声音克隆', async () => {
      const options: VoiceCloneOptions = {
        audioPath: '/audio/sample.wav',
        userId: 'test-user',
        userType: 'wechat',
      }
      const result = await voiceCloner.clone(options) as VoiceProfile

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('modelPath')
      expect(result.userId).toBe('test-user')
    })

    it('游客用户的声音配置应该有 7 天过期时间', async () => {
      const options: VoiceCloneOptions = {
        audioPath: '/audio/sample.wav',
        userId: 'guest-user',
        userType: 'guest',
      }
      const result = await voiceCloner.clone(options) as VoiceProfile

      const now = Date.now()
      const expiresAt = new Date(result.expiresAt).getTime()
      const daysUntilExpiry = (expiresAt - now) / (24 * 60 * 60 * 1000)

      expect(daysUntilExpiry).toBeCloseTo(7, 0)
    })

    it('微信用户的声音配置应该有 30 天过期时间', async () => {
      const options: VoiceCloneOptions = {
        audioPath: '/audio/sample.wav',
        userId: 'wechat-user',
        userType: 'wechat',
      }
      const result = await voiceCloner.clone(options) as VoiceProfile

      const now = Date.now()
      const expiresAt = new Date(result.expiresAt).getTime()
      const daysUntilExpiry = (expiresAt - now) / (24 * 60 * 60 * 1000)

      expect(daysUntilExpiry).toBeCloseTo(30, 0)
    })

    it('应该支持可选的文本参数', async () => {
      const options: VoiceCloneOptions = {
        audioPath: '/audio/sample.wav',
        userId: 'test-user',
        text: '这是参考文本',
        userType: 'wechat',
      }

      const result = await voiceCloner.clone(options) as VoiceProfile
      expect(result).toBeDefined()
    })
  })

  describe('synthesize', () => {
    it('应该使用克隆的声音合成语音', async () => {
      const voiceProfile: VoiceProfile = {
        id: 'voice_test-user_123',
        userId: 'test-user',
        modelPath: '/data/voice-models/test-user/model.pt',
        referenceAudioPath: '/audio/sample.wav',
        sampleDuration: 30,
        quality: 0.85,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userType: 'wechat',
      }

      const options: VoiceConvertOptions = {
        text: '这是一段测试文本',
        voiceProfile,
        outputPath: '/output/synthesized.wav',
      }

      const result = await voiceCloner.synthesize(options)

      expect(result).toBeDefined()
      expect(result).toContain('/output/synthesized.wav')
    })

    it('应该支持方言参数', async () => {
      const voiceProfile: VoiceProfile = {
        id: 'voice_test-user_123',
        userId: 'test-user',
        modelPath: '/data/voice-models/test-user/model.pt',
        referenceAudioPath: '/audio/sample.wav',
        sampleDuration: 30,
        quality: 0.85,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userType: 'wechat',
      }

      const options: VoiceConvertOptions = {
        text: '你食咗饭未呀',
        voiceProfile,
        outputPath: '/output/cantonese.wav',
        dialect: 'cantonese',
      }

      const result = await voiceCloner.synthesize(options)
      expect(result).toBeDefined()
    })
  })

  describe('loadProfile', () => {
    it('应该加载用户的声音配置', async () => {
      const profile = await voiceCloner.loadProfile('test-user')

      expect(profile).toBeDefined()
      expect(profile?.userId).toBe('test-user')
    })

    it('未找到配置应该返回 null', async () => {
      // Mock readFile to throw error
      const fs = await import('fs/promises')
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'))

      const profile = await voiceCloner.loadProfile('non-existent-user')
      expect(profile).toBeNull()
    })
  })

  describe('renewProfile', () => {
    it('应该延长声音配置的有效期', async () => {
      const profile: VoiceProfile = {
        id: 'voice_test-user_123',
        userId: 'test-user',
        modelPath: '/data/voice-models/test-user/model.pt',
        referenceAudioPath: '/audio/sample.wav',
        sampleDuration: 30,
        quality: 0.85,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 天后过期
        userType: 'wechat',
      }

      const result = await voiceCloner.renewProfile(profile) as VoiceProfile

      expect(result).toBeDefined()
    })
  })

  describe('deleteProfile', () => {
    it('应该删除用户的声音配置', async () => {
      await voiceCloner.deleteProfile('test-user')

      const fs = await import('fs/promises')
      expect(fs.rm).toHaveBeenCalled()
    })
  })

  describe('isExpired', () => {
    it('过期的配置应该返回 true', async () => {
      const expiredProfile: VoiceProfile = {
        id: 'voice_expired',
        userId: 'expired-user',
        modelPath: '/data/voice-models/expired/model.pt',
        referenceAudioPath: '/audio/expired.wav',
        sampleDuration: 30,
        quality: 0.85,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 天前过期
        userType: 'guest',
      }

      expect(voiceCloner.isExpired(expiredProfile)).toBe(true)
    })

    it('未过期的配置应该返回 false', async () => {
      const validProfile: VoiceProfile = {
        id: 'voice_valid',
        userId: 'valid-user',
        modelPath: '/data/voice-models/valid/model.pt',
        referenceAudioPath: '/audio/valid.wav',
        sampleDuration: 30,
        quality: 0.85,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userType: 'wechat',
      }

      expect(voiceCloner.isExpired(validProfile)).toBe(false)
    })
  })
})

describe('VoiceCloner 单例', () => {
  it('getVoiceCloner 应该返回单例实例', async () => {
    const { getVoiceCloner } = await import('../voice-cloner')

    // 重置单例
    // @ts-ignore
    getVoiceCloner.clonerInstance = null

    const instance1 = getVoiceCloner()
    const instance2 = getVoiceCloner()

    expect(instance1).toBe(instance2)
  })
})

describe('VoiceCloner 配置', () => {
  it('应该支持自定义配置', async () => {
    const { VoiceCloner } = await import('../voice-cloner')

    const cloner = new VoiceCloner({
      modelDir: '/custom/models',
      pythonPath: '/usr/bin/python3',
      timeout: 300000,
    })

    expect(cloner).toBeDefined()
  })

  it('应该使用默认配置', async () => {
    const { VoiceCloner } = await import('../voice-cloner')

    const cloner = new VoiceCloner()

    expect(cloner).toBeDefined()
  })
})
