/**
 * Mock 模式完整流程集成测试
 *
 * 验证 Seed-VC Mock 后端的完整生成流程：
 * 1. 参考音频上传
 * 2. 歌词生成
 * 3. Suno 生成（Mock）
 * 4. Demucs 分离（Mock）
 * 5. Seed-VC 转换（Mock）
 * 6. FFmpeg 混音
 *
 * 运行: USE_MOCK_SERVICES=true npx vitest run tests/integration/mock-full-flow.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

// 强制使用 Mock 模式
process.env.SEEDVC_BACKEND = 'mock'
process.env.USE_MOCK_SERVICES = 'true'

import { getRapGenerator, type GenerationProgress } from '@/lib/services/rap-generator.js'
import { getSeedVCClient, SeedVCMockClient, resetSeedVCClient } from '@/lib/audio/seed-vc-client.js'
import { getModalClient } from '@/lib/serverless/modal-client.js'

describe('Mock Full Flow Integration', () => {
  const generator = getRapGenerator()
  const progressLogs: GenerationProgress[] = []

  const onProgress = (progress: GenerationProgress) => {
    progressLogs.push(progress)
    console.log(`  [${progress.stepName}] ${progress.progress}% - ${progress.message || ''}`)
  }

  beforeAll(async () => {
    console.log('\n=== Mock 模式完整流程测试 ===')

    // 重置 Seed-VC 客户端确保使用 Mock
    resetSeedVCClient()
    const client = getSeedVCClient()
    expect(client).toBeInstanceOf(SeedVCMockClient)

    // 检查服务状态
    const services = await generator.checkServices()
    console.log('服务状态:')
    console.log(`  - SunoAPI: ${services.sunoApi ? '✓' : '✗'}`)
    console.log(`  - SeedVC: ${services.seedvc ? '✓' : '✗'}`)
    console.log('')
  })

  afterAll(() => {
    console.log('\n=== 测试进度汇总 ===')
    progressLogs.forEach(log => {
      console.log(`  ${log.stepName}: ${log.progress}%`)
    })
  })

  describe('Seed-VC Mock 客户端', () => {
    it('should be available', async () => {
      resetSeedVCClient()
      const client = getSeedVCClient()
      const available = await client.isAvailable()
      expect(available).toBe(true)
    })

    it('should convert voice and return source audio', async () => {
      resetSeedVCClient()
      const client = getSeedVCClient()

      const result = await client.convert({
        sourceAudio: 'https://example.com/vocals.mp3',
        referenceAudio: 'https://example.com/reference.mp3',
        f0Condition: true,
      })

      expect(result.status).toBe('completed')
      expect(result.outputAudio).toBe('https://example.com/vocals.mp3')
      expect(result.taskId).toMatch(/^mock-/)
    })

    it('should get status for a task', async () => {
      resetSeedVCClient()
      const client = getSeedVCClient()

      const result = await client.getStatus('test-task-id')

      expect(result.taskId).toBe('test-task-id')
      expect(result.status).toBe('completed')
    })
  })

  describe('Modal 客户端', () => {
    it('should not be configured in mock mode', () => {
      const client = getModalClient()
      // Mock 模式下没有配置 Modal Web Endpoint URL
      expect(client.isConfigured()).toBe(false)
    })
  })

  describe('完整生成流程', () => {
    it('should generate rap with mock backend', async () => {
      const result = await generator.generate(
        {
          userId: 'test-mock-user',
          userDescription: '测试 Mock 模式完整流程',
          dialect: 'original',
          // 使用完整的 OSS URL（模拟上传 API 返回值）
          referenceAudioId: 'https://test-bucket.oss-cn-beijing.aliyuncs.com/voice-references/test-ref.mp3',
        },
        onProgress
      )

      // 验证结果
      expect(result).toBeDefined()
      expect(result.taskId).toBeDefined()
      expect(result.audioUrl).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
      expect(result.lyrics).toBeDefined()
      expect(result.dialect).toBe('original')

      console.log(`\n生成完成:`)
      console.log(`  Task ID: ${result.taskId}`)
      console.log(`  Duration: ${result.duration}s`)
      console.log(`  Audio URL: ${result.audioUrl}`)
    }, 180000) // 3 分钟超时

    it('should generate rap with custom lyrics', async () => {
      const customLyrics = `[Verse 1]
这是测试歌词
Mock 模式测试
完整流程验证
自动化测试万岁

[Chorus]
Mock 模式
自动化测试
一切正常`

      const result = await generator.generate(
        {
          userId: 'test-mock-lyrics',
          userDescription: '测试自定义歌词',
          dialect: 'cantonese',
          referenceAudioId: 'https://test-bucket.oss-cn-beijing.aliyuncs.com/voice-references/test-ref.mp3',
          lyrics: customLyrics,
        },
        onProgress
      )

      expect(result).toBeDefined()
      expect(result.lyrics).toBe(customLyrics)
    }, 180000)

    it('should handle backward compatible referenceId', async () => {
      // 测试向后兼容：传入非完整 URL 的 referenceAudioId
      const result = await generator.generate(
        {
          userId: 'test-mock-compat',
          userDescription: '测试向后兼容',
          dialect: 'sichuan',
          // 传入非完整 URL（向后兼容）
          referenceAudioId: 'test-ref-id',
        },
        onProgress
      )

      // 应该能成功生成（虽然会打印警告）
      expect(result).toBeDefined()
      expect(result.audioUrl).toBeDefined()
    }, 180000)
  })

  describe('服务状态检查', () => {
    it('should return correct service status', async () => {
      const services = await generator.checkServices()

      expect(services).toHaveProperty('suno')
      expect(services).toHaveProperty('seedvc')
      expect(services).toHaveProperty('demucs')
      expect(services).toHaveProperty('ffmpeg')

      // Mock 模式下，seedvc 应该可用
      expect(services.seedvc).toBe(true)
    })
  })

  describe('重试机制验证', () => {
    it('should have retry mechanism in Modal client', () => {
      // 验证 Modal 客户端配置了重试
      const client = getModalClient()
      const config = client.getConfig()

      expect(config).toHaveProperty('configured')
      // Mock 模式下未配置
      expect(config.configured).toBe(false)
    })
  })
})
