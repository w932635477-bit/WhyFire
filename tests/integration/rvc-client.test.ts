/**
 * RVC 客户端集成测试
 *
 * 运行方式：
 * - Mock 模式: USE_MOCK_SERVICES=true npx vitest run tests/integration/rvc-client.test.ts
 * - 真实模式: RVC_BACKEND=self-hosted npx vitest run tests/integration/rvc-client.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getRVCClient, type RVCConversionResult, type RVCTrainingResult } from '@/lib/audio/rvc-client.js'
import { shouldUseMock, mockRVCConvert, mockRVCTrain, mockRVCStatus } from '../mocks/index.js'

describe('RVC Client Integration', () => {
  const client = getRVCClient()
  const useMock = shouldUseMock('rvc')

  // 测试音频 URL
  const TEST_VOCALS_URL = 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/sample-vocals.mp3'
  const TEST_VOICE_SAMPLE = 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/voice-sample.wav'

  beforeAll(async () => {
    console.log(`\n=== RVC 集成测试 ===`)
    console.log(`模式: ${useMock ? 'Mock' : '真实 API'}`)

    const isAvailable = await client.isAvailable()
    console.log(`服务可用: ${isAvailable ? '✓' : '✗'}`)

    if (!isAvailable && !useMock) {
      console.warn('警告: RVC 服务不可用，请启动本地服务:')
      console.warn('  cd services/rvc && python3 api_server.py')
    }
  })

  describe('服务检查', () => {
    it('should check if service is available', async () => {
      const isAvailable = await client.isAvailable()
      expect(typeof isAvailable).toBe('boolean')
    })

    it('should list available models', async () => {
      const models = await client.listModels()

      expect(Array.isArray(models)).toBe(true)

      if (models.length > 0) {
        console.log(`  可用模型: ${models.map(m => m.name).join(', ')}`)
      }
    })
  })

  describe('音色转换', () => {
    it('should convert voice with default model', async () => {
      let result: RVCConversionResult

      if (useMock) {
        result = await mockRVCConvert({
          inputAudio: TEST_VOCALS_URL,
          voiceModel: 'test-model',
        })
      } else {
        result = await client.convert({
          inputAudio: TEST_VOCALS_URL,
          voiceModel: 'default',
          f0Method: 'crepe',
          f0UpKey: 0,
        })
      }

      expect(result).toBeDefined()
      expect(result.outputAudio).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)

      console.log(`  输出音频: ${result.outputAudio}`)
      console.log(`  时长: ${result.duration}s`)
    }, 120000)

    it('should convert voice with pitch adjustment', async () => {
      const pitchAdjustments = [-2, 0, 2]

      for (const f0UpKey of pitchAdjustments) {
        let result: RVCConversionResult

        if (useMock) {
          result = await mockRVCConvert({
            inputAudio: TEST_VOCALS_URL,
            voiceModel: 'test-model',
            f0UpKey,
          })
        } else {
          result = await client.convert({
            inputAudio: TEST_VOCALS_URL,
            voiceModel: 'default',
            f0Method: 'crepe',
            f0UpKey,
          })
        }

        expect(result.outputAudio).toBeDefined()
        console.log(`  音调 ${f0UpKey}: ✓`)
      }
    }, 180000)

    it('should handle different f0 methods', async () => {
      const methods = ['crepe', 'pm', 'harvest'] as const

      for (const f0Method of methods) {
        let result: RVCConversionResult

        if (useMock) {
          result = await mockRVCConvert({
            inputAudio: TEST_VOCALS_URL,
            voiceModel: 'test-model',
            f0Method,
          })
        } else {
          result = await client.convert({
            inputAudio: TEST_VOCALS_URL,
            voiceModel: 'default',
            f0Method,
          })
        }

        expect(result).toBeDefined()
        console.log(`  ${f0Method}: ✓`)
      }
    }, 180000)
  })

  describe('声音训练', () => {
    it('should train voice model', async () => {
      let result: RVCTrainingResult

      if (useMock) {
        result = await mockRVCTrain({
          audioUrl: TEST_VOICE_SAMPLE,
          voiceName: 'test-voice',
        })
      } else {
        result = await client.trainModel({
          audioUrl: TEST_VOICE_SAMPLE,
          voiceName: `test-voice-${Date.now()}`,
          epochs: 100,
        })
      }

      expect(result).toBeDefined()
      expect(result.taskId || result.modelName).toBeDefined()
      expect(result.status).toBeDefined()

      console.log(`  Task ID: ${result.taskId}`)
      console.log(`  Model: ${result.modelName}`)
      console.log(`  Status: ${result.status}`)
    }, 300000)  // 5 分钟超时

    it('should get training status', async () => {
      // 先开始训练
      let trainResult: RVCTrainingResult

      if (useMock) {
        trainResult = await mockRVCTrain({
          audioUrl: TEST_VOICE_SAMPLE,
          voiceName: 'test-voice-status',
        })
      } else {
        trainResult = await client.trainModel({
          audioUrl: TEST_VOICE_SAMPLE,
          voiceName: `test-voice-status-${Date.now()}`,
          epochs: 50,
        })
      }

      // 查询状态
      let statusResult: RVCTrainingResult

      if (useMock) {
        statusResult = await mockRVCStatus(trainResult.taskId || 'mock-task')
      } else {
        statusResult = await client.getTrainingStatus(trainResult.taskId!)
      }

      expect(statusResult).toBeDefined()
      expect(statusResult.status).toBeDefined()
    }, 300000)
  })

  describe('错误处理', () => {
    it('should handle invalid voice model', async () => {
      if (useMock) {
        expect(true).toBe(true)
        return
      }

      await expect(
        client.convert({
          inputAudio: TEST_VOCALS_URL,
          voiceModel: 'non-existent-model',
        })
      ).rejects.toThrow()
    }, 30000)

    it('should handle invalid audio URL', async () => {
      if (useMock) {
        expect(true).toBe(true)
        return
      }

      await expect(
        client.convert({
          inputAudio: 'https://invalid-url.mp3',
          voiceModel: 'default',
        })
      ).rejects.toThrow()
    }, 30000)
  })

  describe('性能测试', () => {
    it.skipIf(useMock)('should convert voice within expected time', async () => {
      const startTime = Date.now()

      await client.convert({
        inputAudio: TEST_VOCALS_URL,
        voiceModel: 'default',
        f0Method: 'crepe',
      })

      const duration = Date.now() - startTime

      // 转换应该在 30 秒内完成
      expect(duration).toBeLessThan(30000)
      console.log(`  转换耗时: ${duration}ms`)
    }, 60000)
  })
})
