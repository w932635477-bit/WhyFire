/**
 * Suno + RVC Rap 生成器
 *
 * 5 步流程：
 * 1. 用户声音克隆（RVC 训练）
 * 2. Claude 生成歌词
 * 3. Suno 生成 Rap（AI 音色）
 * 4. Demucs 人声分离
 * 5. RVC 音色替换 + FFmpeg 混音
 *
 * 技术方案文档: docs/self-hosted-deployment.md
 */

import { getSunoClient } from '@/lib/music/suno-client'
import { getRVCClient, type IRVCClient } from '@/lib/audio/rvc-client'
import { getDemucsClient, type SeparationResult } from '@/lib/audio/demucs-client'
import { FFmpegProcessor } from '@/lib/audio/ffmpeg-processor'
import { getBGMById, getDefaultBGM, type BGMMetadata } from '@/lib/music/bgm-library'
import type { DialectCode } from '@/types/dialect'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Rap 生成参数
 */
export interface RapGenerationParams {
  /** 用户 ID */
  userId: string
  /** 用户描述（职业、爱好、想说的） */
  userDescription: string
  /** 方言 */
  dialect: DialectCode
  /** 用户 RVC 模型 ID */
  voiceModelId: string
  /** BGM ID（从 BGM 库选择，可选） */
  bgmId?: string
  /** 歌词（可选，如果不提供则自动生成） */
  lyrics?: string
  // 注意：移除 bgmUrl，统一使用 bgmId
}

/**
 * 生成步骤
 */
export type GenerationStep =
  | 'lyrics'      // 歌词生成
  | 'suno'        // Suno 生成 Rap
  | 'separation'  // 人声分离
  | 'conversion'  // 音色替换
  | 'mixing'      // 混音

/**
 * 生成进度
 */
export interface GenerationProgress {
  /** 当前步骤 */
  step: GenerationStep
  /** 步骤名称 */
  stepName: string
  /** 进度 (0-100) */
  progress: number
  /** 消息 */
  message?: string
}

/**
 * Rap 生成结果
 */
export interface RapGenerationResult {
  /** 最终音频 URL */
  audioUrl: string
  /** 音频时长（秒） */
  duration: number
  /** 歌词 */
  lyrics: string
  /** 使用的方言 */
  dialect: DialectCode
  /** 任务 ID */
  taskId: string
}

/**
 * 进度回调
 */
export type ProgressCallback = (progress: GenerationProgress) => void

// ============================================================================
// Rap 生成器
// ============================================================================

/**
 * Suno + RVC Rap 生成器
 */
export class RapGeneratorSunoRvc {
  private sunoClient = getSunoClient()
  private rvcClient: IRVCClient = getRVCClient()
  private demucsClient = getDemucsClient()
  private ffmpegProcessor = new FFmpegProcessor()

  /**
   * 生成 Rap
   *
   * @param params 生成参数
   * @param onProgress 进度回调
   * @returns 生成结果
   */
  async generate(
    params: RapGenerationParams,
    onProgress?: ProgressCallback
  ): Promise<RapGenerationResult> {
    const { userId, userDescription, dialect, voiceModelId, bgmId, lyrics: providedLyrics } = params
    const taskId = `${userId}-${Date.now()}`

    // 获取 BGM 元数据
    const bgmMetadata = bgmId
      ? getBGMById(bgmId)
      : getDefaultBGM()

    if (!bgmMetadata) {
      throw new Error(`BGM not found: ${bgmId || 'default'}. Please add BGM to the library or provide a valid bgmId.`)
    }

    console.log(`[RapGenerator] Using BGM: ${bgmMetadata.id} (${bgmMetadata.bpm} BPM)`)

    // Step 1: 生成歌词
    onProgress?.({
      step: 'lyrics',
      stepName: '生成歌词',
      progress: 0,
      message: '正在生成个性化歌词...',
    })

    const lyrics = providedLyrics || await this.generateLyrics(userDescription, dialect)

    onProgress?.({
      step: 'lyrics',
      stepName: '生成歌词',
      progress: 100,
      message: '歌词生成完成',
    })

    // Step 2: Suno 生成 Rap（注入 BGM 信息）
    onProgress?.({
      step: 'suno',
      stepName: '生成 Rap',
      progress: 0,
      message: '正在使用 Suno 生成 Rap...',
    })

    const sunoResult = await this.sunoClient.generate({
      lyrics,
      dialect,
      style: 'rap',
      title: `WhyFire ${dialect} Rap`,
      bgm: {
        bpm: bgmMetadata.bpm,
        styleTags: bgmMetadata.styleTags,
        mood: bgmMetadata.mood,
      },
    })

    if (!sunoResult.audioUrl) {
      throw new Error('Suno generation failed: no audio URL')
    }

    onProgress?.({
      step: 'suno',
      stepName: '生成 Rap',
      progress: 100,
      message: `Rap 生成完成 (${sunoResult.duration}s)`,
    })

    // Step 3: Demucs 人声分离
    onProgress?.({
      step: 'separation',
      stepName: '人声分离',
      progress: 0,
      message: '正在分离人声和伴奏...',
    })

    const separationResult = await this.demucsClient.separate({
      audioUrl: sunoResult.audioUrl,
      model: 'htdemucs',
    })

    if (!separationResult.vocals) {
      throw new Error('Demucs separation failed: no vocals')
    }

    onProgress?.({
      step: 'separation',
      stepName: '人声分离',
      progress: 100,
      message: '人声分离完成',
    })

    // Step 4: RVC 音色替换
    onProgress?.({
      step: 'conversion',
      stepName: '音色替换',
      progress: 0,
      message: '正在替换为用户音色...',
    })

    const rvcResult = await this.rvcClient.convert({
      inputAudio: separationResult.vocals,
      voiceModel: voiceModelId,
      f0Method: 'crepe',
      f0UpKey: 0,
    })

    if (!rvcResult.outputAudio) {
      throw new Error('RVC conversion failed: no output audio')
    }

    onProgress?.({
      step: 'conversion',
      stepName: '音色替换',
      progress: 100,
      message: '音色替换完成',
    })

    // Step 5: FFmpeg 混音（使用用户指定的 BGM）
    onProgress?.({
      step: 'mixing',
      stepName: '混音合成',
      progress: 0,
      message: '正在与 BGM 混音...',
    })

    // 下载 RVC 输出音频
    const rvcAudioUrl = rvcResult.outputAudio!
    if (!rvcAudioUrl.startsWith('http')) {
      throw new Error(`RVC output must be a full URL, got: ${rvcAudioUrl}`)
    }

    console.log(`[RapGenerator] Downloading RVC output: ${rvcAudioUrl}`)
    const rvcAudioRes = await fetch(rvcAudioUrl, {
      signal: AbortSignal.timeout(60000),
    })
    if (!rvcAudioRes.ok) {
      throw new Error(`Failed to download RVC audio: ${rvcAudioRes.status}`)
    }
    const rvcAudioBuffer = Buffer.from(await rvcAudioRes.arrayBuffer())

    // 下载用户指定的 BGM（而不是 Demucs 分离的伴奏）
    console.log(`[RapGenerator] Downloading BGM: ${bgmMetadata.url}`)
    const bgmRes = await fetch(bgmMetadata.url, {
      signal: AbortSignal.timeout(60000),
    })
    if (!bgmRes.ok) {
      throw new Error(`Failed to download BGM: ${bgmRes.status}`)
    }
    const bgmBuffer = Buffer.from(await bgmRes.arrayBuffer())

    // 计算时长
    const rvcDuration = rvcResult.duration || sunoResult.duration || 0

    // 决定是否循环 BGM
    const shouldLoopBgm = bgmMetadata.duration > 0 && bgmMetadata.duration < rvcDuration * 0.9

    console.log(`[RapGenerator] Mixing: vocal=${rvcDuration}s, bgm=${bgmMetadata.duration}s, loop=${shouldLoopBgm}`)

    // 混音
    const mixResult = await this.ffmpegProcessor.mixTracks(rvcAudioBuffer, bgmBuffer, {
      vocalVolume: 1.0,
      bgmVolume: 0.3,
      loopBgm: shouldLoopBgm,
    })

    // 保存混音结果到临时文件
    const outputDir = join(process.cwd(), 'temp')
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }
    const outputFileName = `final-rap-${taskId}.mp3`
    const outputPath = join(outputDir, outputFileName)
    writeFileSync(outputPath, mixResult.audioBuffer!)

    console.log(`[RapGenerator] Mix completed: ${outputPath}`)

    onProgress?.({
      step: 'mixing',
      stepName: '混音合成',
      progress: 100,
      message: '混音完成',
    })

    return {
      audioUrl: `file://${outputPath}`,
      duration: mixResult.processedDuration || 0,
      lyrics,
      dialect,
      taskId,
    }
  }

  /**
   * 生成歌词（调用 Claude API）
   */
  private async generateLyrics(description: string, dialect: DialectCode): Promise<string> {
    // TODO: 调用 Claude API 生成歌词
    // 这里使用简单的模板
    const dialectNames: Record<DialectCode, string> = {
      original: '普通话',
      cantonese: '粤语',
      sichuan: '四川话',
      dongbei: '东北话',
      shaanxi: '陕西话',
      wu: '上海话',
      minnan: '闽南语',
      tianjin: '天津话',
      nanjing: '南京话',
    }

    return `[Verse 1]
${description}

[Chorus]
用${dialectNames[dialect]}唱出我的style
节奏跳动 feeling so high
`
  }

  /**
   * 检查所有服务可用性
   */
  async checkServices(): Promise<{
    suno: boolean
    rvc: boolean
    demucs: boolean
    ffmpeg: boolean
  }> {
    const [suno, rvc, demucs] = await Promise.all([
      this.sunoClient.isConfigured(),
      this.rvcClient.isAvailable(),
      this.demucsClient.isAvailable(),
    ])

    const ffmpeg = await this.ffmpegProcessor.isAvailable()

    return { suno, rvc, demucs, ffmpeg }
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let generatorInstance: RapGeneratorSunoRvc | null = null

/**
 * 获取 Rap 生成器实例
 */
export function getRapGenerator(): RapGeneratorSunoRvc {
  if (!generatorInstance) {
    generatorInstance = new RapGeneratorSunoRvc()
  }
  return generatorInstance
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 生成 Rap（便捷函数）
 */
export async function generateRap(
  params: RapGenerationParams,
  onProgress?: ProgressCallback
): Promise<RapGenerationResult> {
  const generator = getRapGenerator()
  return generator.generate(params, onProgress)
}
