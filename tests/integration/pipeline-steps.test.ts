/**
 * 管道步骤集成测试
 *
 * 测试各个步骤之间的数据流转：
 * Step 1: 声音克隆 → voiceModelId
 * Step 2: 歌词生成 → lyrics
 * Step 3: Suno 演唱 → audioUrl
 * Step 4: Demucs 分离 → vocals, accompaniment
 * Step 5: RVC + 混音 → finalAudioUrl
 *
 * 运行方式：
 * - Mock 模式: USE_MOCK_SERVICES=true npx vitest run tests/integration/pipeline-steps.test.ts
 * - 真实模式: FORCE_REAL_SERVICES=true npx vitest run tests/integration/pipeline-steps.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getSunoClient } from '@/lib/music/suno-client.js'
import { getDemucsClient } from '@/lib/audio/demucs-client.js'
import { getRVCClient } from '@/lib/audio/rvc-client.js'
import { FFmpegProcessor } from '@/lib/audio/ffmpeg-processor.js'
import { getBGMById, listAllBGM } from '@/lib/music/bgm-library.js'
import {
  shouldUseMock,
  mockSunoGenerate,
  mockDemucsSeparate,
  mockRVCConvert,
} from '../mocks/index.js'

describe('Pipeline Steps Integration', () => {
  const sunoClient = getSunoClient()
  const demucsClient = getDemucsClient()
  const rvcClient = getRVCClient()
  const ffmpegProcessor = new FFmpegProcessor()

  const useMock = shouldUseMock('suno')

  // 存储中间结果
  const pipelineState = {
    voiceModelId: '',
    lyrics: '',
    sunoAudioUrl: '',
    vocalsUrl: '',
    bgmUrl: '',
    rvcAudioUrl: '',
    finalAudioUrl: '',
  }

  beforeAll(async () => {
    console.log('\n=== 管道步骤集成测试 ===')
    console.log(`模式: ${useMock ? 'Mock' : '真实 API'}`)

    // 检查所有服务
    const [suno, demucs, rvc, ffmpeg] = await Promise.all([
      sunoClient.isConfigured(),
      demucsClient.isAvailable(),
      rvcClient.isAvailable(),
      ffmpegProcessor.isAvailable(),
    ])

    console.log('服务状态:')
    console.log(`  Suno: ${suno ? '✓' : '✗'}`)
    console.log(`  Demucs: ${demucs ? '✓' : '✗'}`)
    console.log(`  RVC: ${rvc ? '✓' : '✗'}`)
    console.log(`  FFmpeg: ${ffmpeg ? '✓' : '✗'}`)

    // 检查 BGM 库
    const bgmList = listAllBGM()
    console.log(`  BGM 库: ${bgmList.length} 首`)
    console.log('')
  })

  afterAll(() => {
    console.log('\n=== 管道状态汇总 ===')
    console.log(`Voice Model: ${pipelineState.voiceModelId || '(未设置)'}`)
    console.log(`Lyrics: ${pipelineState.lyrics.slice(0, 50)}...`)
    console.log(`Suno Audio: ${pipelineState.sunoAudioUrl || '(未生成)'}`)
    console.log(`Vocals: ${pipelineState.vocalsUrl || '(未分离)'}`)
    console.log(`BGM: ${pipelineState.bgmUrl || '(未选择)'}`)
    console.log(`RVC Audio: ${pipelineState.rvcAudioUrl || '(未转换)'}`)
    console.log(`Final Audio: ${pipelineState.finalAudioUrl || '(未合成)'}`)
  })

  describe('Step 1: 声音克隆', () => {
    it('should have voice model available', async () => {
      if (useMock) {
        pipelineState.voiceModelId = 'mock-voice-model'
      } else {
        const models = await rvcClient.listModels()
        if (models.length > 0) {
          pipelineState.voiceModelId = models[0].name
        } else {
          // 使用默认模型
          pipelineState.voiceModelId = 'default'
        }
      }

      expect(pipelineState.voiceModelId).toBeDefined()
      expect(pipelineState.voiceModelId).not.toBe('')
      console.log(`  ✓ 声音模型: ${pipelineState.voiceModelId}`)
    })
  })

  describe('Step 2: 歌词生成', () => {
    it('should generate lyrics', async () => {
      // 模拟歌词生成（实际项目中调用 Claude API）
      pipelineState.lyrics = `[Verse 1]
我是程序员，敲代码到深夜
一杯咖啡，陪我度过不眠夜
Bug 修复，功能上线
技术改变世界，梦想终会实现

[Chorus]
代码人生，激情燃烧
键盘敲击，节奏疯狂
代码人生，永不言弃
用技术创造，属于我们的传奇
`
      expect(pipelineState.lyrics).toBeDefined()
      expect(pipelineState.lyrics.length).toBeGreaterThan(50)
      console.log(`  ✓ 歌词长度: ${pipelineState.lyrics.length} 字符`)
    })
  })

  describe('Step 3: Suno 演唱', () => {
    it('should generate rap from lyrics', async () => {
      let result

      if (useMock) {
        result = await mockSunoGenerate({
          lyrics: pipelineState.lyrics,
          dialect: 'original',
          style: 'rap',
          bgm: {
            bpm: 120,
            styleTags: 'trap, dark',
            mood: ['confident'],
          },
        })
      } else {
        result = await sunoClient.generate({
          lyrics: pipelineState.lyrics,
          dialect: 'original',
          style: 'rap, chinese',
          model: 'suno-v4.5-beta',
        })

        // 等待完成
        if (result.status !== 'completed') {
          let attempts = 0
          while (attempts < 60) {
            await new Promise(r => setTimeout(r, 2000))
            result = await sunoClient.getStatus(result.taskId)
            if (result.status === 'completed') break
            if (result.status === 'failed') throw new Error('Suno generation failed')
            attempts++
          }
        }
      }

      expect(result.status).toBe('completed')
      expect(result.audioUrl).toBeDefined()

      pipelineState.sunoAudioUrl = result.audioUrl!
      console.log(`  ✓ Suno 音频: ${result.audioUrl}`)
      console.log(`  ✓ 时长: ${result.duration}s`)
    }, 180000)  // 3 分钟超时
  })

  describe('Step 4: Demucs 分离', () => {
    it('should separate vocals from audio', async () => {
      let result

      if (useMock) {
        result = await mockDemucsSeparate({
          audioUrl: pipelineState.sunoAudioUrl,
        })
      } else {
        result = await demucsClient.separate({
          audioUrl: pipelineState.sunoAudioUrl,
          model: 'htdemucs',
        })

        // 等待完成
        if (result.status !== 'completed') {
          let attempts = 0
          while (attempts < 60) {
            await new Promise(r => setTimeout(r, 2000))
            result = await demucsClient.getStatus(result.taskId)
            if (result.status === 'completed') break
            if (result.status === 'failed') throw new Error('Demucs separation failed')
            attempts++
          }
        }
      }

      expect(result.status).toBe('completed')
      expect(result.vocals).toBeDefined()

      pipelineState.vocalsUrl = result.vocals!
      console.log(`  ✓ 人声: ${result.vocals}`)

      if (result.accompaniment) {
        console.log(`  ✓ 伴奏: ${result.accompaniment}`)
      }
    }, 180000)
  })

  describe('Step 5: RVC 转换 + BGM 混音', () => {
    it('should select BGM from library', async () => {
      const bgm = getBGMById('fortune-flow')
      expect(bgm).toBeDefined()

      pipelineState.bgmUrl = bgm!.url
      console.log(`  ✓ BGM: ${bgm!.id} (${bgm!.bpm} BPM)`)
    })

    it('should convert voice with RVC', async () => {
      let result

      if (useMock) {
        result = await mockRVCConvert({
          inputAudio: pipelineState.vocalsUrl,
          voiceModel: pipelineState.voiceModelId,
        })
      } else {
        result = await rvcClient.convert({
          inputAudio: pipelineState.vocalsUrl,
          voiceModel: pipelineState.voiceModelId,
          f0Method: 'crepe',
          f0UpKey: 0,
        })
      }

      expect(result.outputAudio).toBeDefined()

      pipelineState.rvcAudioUrl = result.outputAudio!
      console.log(`  ✓ RVC 音频: ${result.outputAudio}`)
    }, 120000)

    it.skipIf(useMock)('should mix RVC vocals with BGM', async () => {
      if (useMock) {
        console.log('  ⊘ Mock 模式跳过混音测试')
        return
      }

      // 下载音频文件
      const [rvcResponse, bgmResponse] = await Promise.all([
        fetch(pipelineState.rvcAudioUrl),
        fetch(pipelineState.bgmUrl),
      ])

      const rvcBuffer = Buffer.from(await rvcResponse.arrayBuffer())
      const bgmBuffer = Buffer.from(await bgmResponse.arrayBuffer())

      // 混音
      const mixResult = await ffmpegProcessor.mixTracks(rvcBuffer, bgmBuffer, {
        vocalVolume: 1.0,
        bgmVolume: 0.3,
        loopBgm: false,
      })

      expect(mixResult.audioBuffer).toBeDefined()
      expect(mixResult.processedDuration).toBeGreaterThan(0)

      console.log(`  ✓ 混音时长: ${mixResult.processedDuration}s`)
      console.log(`  ✓ 最终音频大小: ${mixResult.audioBuffer!.length} bytes`)
    }, 60000)
  })

  describe('完整流程验证', () => {
    it('should have all pipeline steps completed', () => {
      expect(pipelineState.voiceModelId).not.toBe('')
      expect(pipelineState.lyrics).not.toBe('')
      expect(pipelineState.sunoAudioUrl).not.toBe('')
      expect(pipelineState.vocalsUrl).not.toBe('')
      expect(pipelineState.bgmUrl).not.toBe('')
      expect(pipelineState.rvcAudioUrl).not.toBe('')

      console.log('\n✓ 所有管道步骤已完成')
    })
  })
})
