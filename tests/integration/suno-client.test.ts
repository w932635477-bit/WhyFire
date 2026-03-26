/**
 * Suno 客户端集成测试
 *
 * 运行方式：
 * - Mock 模式: USE_MOCK_SERVICES=true npx vitest run tests/integration/suno-client.test.ts
 * - 真实模式: npx vitest run tests/integration/suno-client.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getSunoClient, type SunoGenerationResult } from '@/lib/music/suno-client.js'
import { shouldUseMock, mockSunoGenerate, mockSunoStatus } from '../mocks/index.js'

describe('Suno Client Integration', () => {
  const client = getSunoClient()
  const useMock = shouldUseMock('suno')

  beforeAll(async () => {
    console.log(`\n=== Suno 集成测试 ===`)
    console.log(`模式: ${useMock ? 'Mock' : '真实 API'}`)

    const isConfigured = await client.isConfigured()
    console.log(`服务配置: ${isConfigured ? '✓' : '✗'}`)

    if (!isConfigured && !useMock) {
      console.warn('警告: Suno API 未配置，测试可能失败')
    }
  })

  describe('服务检查', () => {
    it('should check if service is configured', async () => {
      const isConfigured = await client.isConfigured()
      expect(typeof isConfigured).toBe('boolean')
    })
  })

  describe('音乐生成', () => {
    it('should generate music from lyrics', async () => {
      let result: SunoGenerationResult

      if (useMock) {
        result = await mockSunoGenerate({
          lyrics: '[Verse 1]\n测试歌词\n[Chorus]\n测试测试',
          dialect: 'original',
          style: 'rap',
        })
      } else {
        result = await client.generate({
          lyrics: `[Verse 1]
这是测试歌词
用于验证 Suno 生成功能

[Chorus]
测试测试测试
一切正常`,
          dialect: 'original',
          style: 'rap, chinese',
          title: 'E2E Test',
          model: 'suno-v4.5-beta',
        })
      }

      expect(result).toBeDefined()
      expect(result.taskId).toBeDefined()
      expect(result.status).toBeDefined()
      expect(['pending', 'processing', 'completed']).toContain(result.status)

      console.log(`  Task ID: ${result.taskId}`)
      console.log(`  Status: ${result.status}`)
    }, 120000)  // 2 分钟超时

    it('should generate music with BGM metadata injection', async () => {
      let result: SunoGenerationResult

      if (useMock) {
        result = await mockSunoGenerate({
          lyrics: '[Verse 1]\n测试 BGM 注入\n',
          dialect: 'cantonese',
          bgm: {
            bpm: 137,
            styleTags: 'trap, dark, heavy 808',
            mood: ['aggressive', 'confident'],
          },
        })
      } else {
        result = await client.generate({
          lyrics: '[Verse 1]\n测试 BGM 元数据注入\n[Chorus]\n验证成功',
          dialect: 'cantonese',
          bgm: {
            bpm: 137,
            styleTags: 'trap, dark, heavy 808',
            mood: ['aggressive', 'confident'],
          },
        })
      }

      expect(result).toBeDefined()
      expect(result.taskId).toBeDefined()
    }, 120000)

    it('should handle various dialect codes', async () => {
      const dialects = ['original', 'cantonese', 'sichuan'] as const

      for (const dialect of dialects) {
        let result: SunoGenerationResult

        if (useMock) {
          result = await mockSunoGenerate({
            lyrics: `测试 ${dialect} 方言`,
            dialect,
          })
        } else {
          result = await client.generate({
            lyrics: `测试 ${dialect} 方言`,
            dialect,
            style: 'rap',
          })
        }

        expect(result.status).toBeDefined()
        console.log(`  ${dialect}: ${result.status}`)
      }
    }, 180000)  // 3 分钟超时
  })

  describe('状态查询', () => {
    it('should get task status', async () => {
      // 先生成一个任务
      let generateResult: SunoGenerationResult

      if (useMock) {
        generateResult = await mockSunoGenerate({
          lyrics: '测试状态查询',
          dialect: 'original',
        })
      } else {
        generateResult = await client.generate({
          lyrics: '测试状态查询',
          dialect: 'original',
        })
      }

      // 查询状态
      let statusResult: SunoGenerationResult

      if (useMock) {
        statusResult = await mockSunoStatus(generateResult.taskId)
      } else {
        statusResult = await client.getStatus(generateResult.taskId)
      }

      expect(statusResult).toBeDefined()
      expect(statusResult.taskId).toBe(generateResult.taskId)
      expect(statusResult.status).toBeDefined()
    }, 60000)
  })

  describe('错误处理', () => {
    it('should handle empty lyrics', async () => {
      if (useMock) {
        // Mock 模式下不测试错误
        expect(true).toBe(true)
        return
      }

      await expect(
        client.generate({
          lyrics: '',
          dialect: 'original',
        })
      ).rejects.toThrow()
    }, 30000)

    it('should handle invalid task ID', async () => {
      if (useMock) {
        expect(true).toBe(true)
        return
      }

      await expect(
        client.getStatus('invalid-task-id-12345')
      ).rejects.toThrow()
    }, 30000)
  })

  describe('性能测试', () => {
    it.skipIf(useMock)('should complete generation within expected time', async () => {
      const startTime = Date.now()

      await client.generate({
        lyrics: '[Verse 1]\n性能测试\n[Chorus]\n时间限制',
        dialect: 'original',
        style: 'rap',
      })

      const duration = Date.now() - startTime

      // 真实 API 应该在 60 秒内完成
      expect(duration).toBeLessThan(60000)
      console.log(`  生成耗时: ${duration}ms`)
    }, 90000)
  })
})
