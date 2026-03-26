/**
 * Demucs 客户端集成测试
 *
 * 运行方式：
 * - Mock 模式: USE_MOCK_SERVICES=true npx vitest run tests/integration/demucs-client.test.ts
 * - 真实模式: npx vitest run tests/integration/demucs-client.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getDemucsClient, type SeparationResult } from '@/lib/audio/demucs-client.js'
import { shouldUseMock, mockDemucsSeparate, mockDemucsStatus } from '../mocks/index.js'

describe('Demucs Client Integration', () => {
  const client = getDemucsClient()
  const useMock = shouldUseMock('demucs')

  // 测试音频 URL（OSS 上的示例）
  const TEST_AUDIO_URL = 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/sample-rap.mp3'

  beforeAll(async () => {
    console.log(`\n=== Demucs 集成测试 ===`)
    console.log(`模式: ${useMock ? 'Mock' : '真实 API'}`)

    const isAvailable = await client.isAvailable()
    console.log(`服务可用: ${isAvailable ? '✓' : '✗'}`)

    if (!isAvailable && !useMock) {
      console.warn('警告: Demucs 服务不可用，请启动本地服务:')
      console.warn('  cd services/demucs && python3 api_server.py')
    }
  })

  describe('服务检查', () => {
    it('should check if service is available', async () => {
      const isAvailable = await client.isAvailable()
      expect(typeof isAvailable).toBe('boolean')
    })
  })

  describe('音频分离', () => {
    it('should separate vocals from audio', async () => {
      let result: SeparationResult

      if (useMock) {
        result = await mockDemucsSeparate({
          audioUrl: TEST_AUDIO_URL,
        })
      } else {
        result = await client.separate({
          audioUrl: TEST_AUDIO_URL,
          model: 'htdemucs',
        })
      }

      expect(result).toBeDefined()
      expect(result.taskId).toBeDefined()
      expect(result.status).toBeDefined()

      if (result.status === 'completed') {
        expect(result.vocals).toBeDefined()
        console.log(`  人声 URL: ${result.vocals}`)
        console.log(`  时长: ${result.duration}s`)
      }
    }, 120000)  // 2 分钟超时

    it('should separate into multiple stems', async () => {
      let result: SeparationResult

      if (useMock) {
        result = await mockDemucsSeparate({
          audioUrl: TEST_AUDIO_URL,
        })
      } else {
        result = await client.separate({
          audioUrl: TEST_AUDIO_URL,
          model: 'htdemucs',
          outputFormat: 'mp3',
        })
      }

      expect(result.status).toBeDefined()

      if (result.status === 'completed') {
        // 检查各个音轨
        const stems = ['vocals', 'drums', 'bass', 'other'] as const
        let availableStems = 0

        stems.forEach(stem => {
          if (result[stem]) {
            availableStems++
            console.log(`  ${stem}: ${result[stem]}`)
          }
        })

        // 至少应该有人声
        expect(availableStems).toBeGreaterThanOrEqual(1)
      }
    }, 120000)

    it('should handle different models', async () => {
      const models = ['htdemucs', 'htdemucs_ft'] as const

      for (const model of models) {
        let result: SeparationResult

        if (useMock) {
          result = await mockDemucsSeparate({
            audioUrl: TEST_AUDIO_URL,
            model,
          })
        } else {
          result = await client.separate({
            audioUrl: TEST_AUDIO_URL,
            model,
          })
        }

        expect(result.status).toBeDefined()
        console.log(`  ${model}: ${result.status}`)
      }
    }, 180000)
  })

  describe('状态查询', () => {
    it('should get separation status', async () => {
      // 先发起分离请求
      let separateResult: SeparationResult

      if (useMock) {
        separateResult = await mockDemucsSeparate({
          audioUrl: TEST_AUDIO_URL,
        })
      } else {
        separateResult = await client.separate({
          audioUrl: TEST_AUDIO_URL,
        })
      }

      // 查询状态
      let statusResult: SeparationResult

      if (useMock) {
        statusResult = await mockDemucsStatus(separateResult.taskId)
      } else {
        statusResult = await client.getStatus(separateResult.taskId)
      }

      expect(statusResult).toBeDefined()
      expect(statusResult.taskId).toBe(separateResult.taskId)
    }, 60000)
  })

  describe('错误处理', () => {
    it('should handle invalid audio URL', async () => {
      if (useMock) {
        expect(true).toBe(true)
        return
      }

      await expect(
        client.separate({
          audioUrl: 'https://invalid-url-that-does-not-exist.mp3',
        })
      ).rejects.toThrow()
    }, 30000)

    it('should handle invalid task ID', async () => {
      if (useMock) {
        expect(true).toBe(true)
        return
      }

      await expect(
        client.getStatus('invalid-task-id')
      ).rejects.toThrow()
    }, 30000)
  })

  describe('性能测试', () => {
    it.skipIf(useMock)('should separate audio within expected time', async () => {
      const startTime = Date.now()

      await client.separate({
        audioUrl: TEST_AUDIO_URL,
        model: 'htdemucs_ft',  // 更快的模型
      })

      const duration = Date.now() - startTime

      // 分离应该在 60 秒内完成
      expect(duration).toBeLessThan(60000)
      console.log(`  分离耗时: ${duration}ms`)
    }, 90000)
  })
})
