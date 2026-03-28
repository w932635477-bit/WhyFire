/**
 * 端到端测试 - 完整 Rap 生成流程
 *
 * 测试完整的 5 步流程：
 * 1. 歌词生成 (Claude API)
 * 2. Suno 演唱 (AI 人声)
 * 3. Demucs 分离 (人声 + 伴奏)
 * 4. Seed-VC 零样本音色替换
 * 5. BGM 混音 (最终输出)
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

import { getRapGenerator, type GenerationProgress } from '@/lib/services/rap-generator.js'
import { listAllBGM } from '@/lib/music/bgm-library.js'
import {
  shouldUseMock,
  getMockConfig,
  type MockConfig,
} from '../mocks/index.js'

describe.skip('Full Pipeline E2E（需要真实服务，旧架构待重写）', () => {
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
    console.log(`  - SeedVC: ${services.seedvc ? '✓' : '✗'}`)
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

  describe.skip('完整生成流程（需要真实服务）', () => {
    it('should generate rap with default BGM', async () => {
      const result = await generator.generate(
        {
          userId: 'test-user-e2e',
          userDescription: '我是一名程序员，喜欢写代码和喝咖啡',
          dialect: 'original',
          referenceAudioId: 'test-reference-audio',
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

    it('should generate rap with specific BGM', async () => {
      const bgmList = listAllBGM()
      const firstBgm = bgmList[0]

      const result = await generator.generate(
        {
          userId: 'test-user-e2e-bgm',
          userDescription: '测试指定 BGM',
          dialect: 'cantonese',
          referenceAudioId: 'test-reference-audio',
          bgmId: firstBgm?.id,
        },
        onProgress
      )

      expect(result).toBeDefined()
      expect(result.audioUrl).toBeDefined()
    }, 180000)

    it('should generate rap with custom lyrics', async () => {
      const customLyrics = `[Verse 1]
这是测试歌词
E2E 测试运行中
自动化的测试流程
代码质量有保证

[Chorus]
测试万岁
自动化万岁`

      const result = await generator.generate(
        {
          userId: 'test-user-e2e-lyrics',
          userDescription: '测试自定义歌词',
          dialect: 'sichuan',
          referenceAudioId: 'test-reference-audio',
          lyrics: customLyrics,
        },
        onProgress
      )

      expect(result).toBeDefined()
      expect(result.lyrics).toBe(customLyrics)
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
      if (shouldUseMock('suno')) {
        expect(services.seedvc).toBe(true)
      }
    })
  })
})
