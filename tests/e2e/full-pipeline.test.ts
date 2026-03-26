/**
 * 端到端测试 - 完整 Rap 生成流程
 *
 * 测试完整的 5 步流程：
 * 1. 声音克隆 (RVC 训练)
 * 2. 歌词生成 (Claude API)
 * 3. Suno 演唱 (AI 人声)
 * 4. Demucs 分离 (人声 + 伴奏)
 * 5. RVC + BGM 混音 (最终输出)
 *
 * 运行方式：
 * - Mock 模式: USE_MOCK_SERVICES=true npx vitest run tests/e2e/full-pipeline.test.ts
 * - 真实模式: FORCE_REAL_SERVICES=true npx vitest run tests/e2e/full-pipeline.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') })

import { getRapGenerator, type GenerationProgress } from '@/lib/services/rap-generator-suno-rvc.js'
import { listAllBGM } from '@/lib/music/bgm-library.js'
import {
  shouldUseMock,
  setMockConfig,
  type MockConfig,
} from '../mocks/index.js'

describe('Full Pipeline E2E', () => {
  const generator = getRapGenerator()
  const progressLogs: GenerationProgress[] = []

  // 进度回调
  const onProgress = (progress: GenerationProgress) => {
    progressLogs.push(progress)
    console.log(`  [${progress.stepName}] ${progress.progress}% - ${progress.message || ''}`)
  }

  beforeAll(async () => {
    console.log('\n=== E2E 测试环境检查 ===')
    console.log(`Mock 模式: ${shouldUseMock('suno') ? '启用' : '禁用'}`)

    // 检查服务状态
    const services = await generator.checkServices()
    console.log('服务状态:')
    console.log(`  - Suno: ${services.suno ? '✓' : '✗'}`)
    console.log(`  - Demucs: ${services.demucs ? '✓' : '✗'}`)
    console.log(`  - RVC: ${services.rvc ? '✓' : '✗'}`)
    console.log(`  - FFmpeg: ${services.ffmpeg ? '✓' : '✗'}`)

    // 检查 BGM 库
    const bgmList = listAllBGM()
    console.log(`BGM 库: ${bgmList.length} 首`)
    console.log('')
  })

  afterAll(() => {
    console.log('\n=== 测试进度汇总 ===')
    progressLogs.forEach(log => {
      console.log(`  ${log.stepName}: ${log.progress}%`)
    })
  })

  describe('Step 1: 声音克隆', () => {
    it.skipIf(shouldUseMock('rvc'))('should train voice model', async () => {
      // 真实 RVC 训练测试
      // 注意：这需要真实的音频文件和 RVC 服务
      const result = await generator.trainVoice?.({
        audioUrl: 'https://example.com/sample-voice.wav',
        voiceName: 'test-voice',
      })

      expect(result).toBeDefined()
      expect(result?.voiceId).toBeDefined()
    }, 120000)  // 2 分钟超时
  })

  describe('Step 2-5: 完整生成流程', () => {
    it('should generate rap with default BGM', async () => {
      const result = await generator.generate(
        {
          userId: 'test-user-e2e',
          userDescription: '我是一名程序员，喜欢写代码和喝咖啡',
          dialect: 'original',
          voiceModelId: 'test-voice-model',
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
      console.log(`  - Task ID: ${result.taskId}`)
      console.log(`  - Duration: ${result.duration}s`)
      console.log(`  - Audio URL: ${result.audioUrl}`)
    }, 300000)  // 5 分钟超时

    it('should generate rap with specific BGM', async () => {
      const bgmList = listAllBGM()
      const specificBgm = bgmList[1]  // 使用第二首 BGM

      const result = await generator.generate(
        {
          userId: 'test-user-e2e-2',
          userDescription: '测试指定 BGM',
          dialect: 'cantonese',
          voiceModelId: 'test-voice-model',
          bgmId: specificBgm.id,
        },
        onProgress
      )

      expect(result).toBeDefined()
      expect(result.audioUrl).toBeDefined()
      expect(result.dialect).toBe('cantonese')
    }, 300000)

    it('should generate rap with custom lyrics', async () => {
      const customLyrics = `[Verse 1]
这是测试歌词
用于验证自定义歌词功能

[Chorus]
测试测试测试
`

      const result = await generator.generate(
        {
          userId: 'test-user-e2e-3',
          userDescription: '',
          dialect: 'sichuan',
          voiceModelId: 'test-voice-model',
          lyrics: customLyrics,
        },
        onProgress
      )

      expect(result).toBeDefined()
      expect(result.lyrics).toBe(customLyrics)
    }, 300000)
  })

  describe('服务检查', () => {
    it('should check all services', async () => {
      const services = await generator.checkServices()

      expect(typeof services.suno).toBe('boolean')
      expect(typeof services.demucs).toBe('boolean')
      expect(typeof services.rvc).toBe('boolean')
      expect(typeof services.ffmpeg).toBe('boolean')

      // Mock 模式下所有服务应该可用
      if (shouldUseMock('suno')) {
        expect(services.suno).toBe(true)
        expect(services.demucs).toBe(true)
        expect(services.rvc).toBe(true)
      }
    })
  })

  describe('错误处理', () => {
    it('should handle invalid BGM ID', async () => {
      await expect(
        generator.generate({
          userId: 'test-user-error',
          userDescription: '',
          dialect: 'original',
          voiceModelId: 'test-voice',
          bgmId: 'invalid-bgm-id',
        })
      ).rejects.toThrow()
    }, 30000)

    it('should handle missing voice model', async () => {
      // 这取决于 RVC 客户端的实现
      // Mock 模式下可能不会失败
      if (!shouldUseMock('rvc')) {
        await expect(
          generator.generate({
            userId: 'test-user-error-2',
            userDescription: '',
            dialect: 'original',
            voiceModelId: '',
          })
        ).rejects.toThrow()
      }
    }, 30000)
  })
})
