/**
 * Suno + Seed-VC Rap 生成器
 *
 * Add Vocals 管道（3 步）：
 *   1. Claude 生成歌词（根据 BGM 时长约束字数）
 *   2. SunoAPI Add Vocals（在用户 BGM 上生成人声，节拍自动匹配）
 *   3. Seed-VC 零样本音色替换 → 上传 OSS
 */

import { getSunoApiClient, type SunoApiClient } from '@/lib/music/suno-api-client'
import { getSeedVCClient, type ISeedVCClient } from '@/lib/audio/seed-vc-client'
import { getBGMById, getDefaultBGM, type BGMMetadata, toSunoStyle } from '@/lib/music/bgm-library'
import { uploadToOSS, isOSSConfigured } from '@/lib/oss'
import { generateWithClaude } from '@/lib/ai/claude-client'
import { buildViralLyricsPrompt, VIRAL_DIALECT_CONFIGS } from '@/lib/ai/prompts/viral-lyrics-prompts'
import { getTimeContext, getTrendingService } from '@/lib/ai/context'
import type { DialectCode } from '@/types/dialect'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

// ============================================================================
// 类型定义
// ============================================================================

export interface RapGenerationParams {
  userId: string
  userDescription: string
  dialect: DialectCode
  referenceAudioId: string
  bgmId?: string
  lyrics?: string
}

export type GenerationStep =
  | 'lyrics'      // 歌词生成
  | 'suno'        // Suno Add Vocals
  | 'conversion'  // Seed-VC 音色替换

export interface GenerationProgress {
  step: GenerationStep
  stepName: string
  progress: number
  message?: string
}

export interface RapGenerationResult {
  audioUrl: string
  duration: number
  lyrics: string
  dialect: DialectCode
  taskId: string
  pipeline: 'add-vocals'
}

export type ProgressCallback = (progress: GenerationProgress) => void

// ============================================================================
// 方言到 Suno 风格映射
// ============================================================================

const DIALECT_RAP_STYLE: Partial<Record<DialectCode, string>> = {
  original: 'chinese rap, mandarin rap, hip-hop, trap',
  cantonese: 'cantonese rap, hong kong hip-hop, trap',
  sichuan: 'sichuan rap, chinese hip-hop, trap, dialect rap',
  dongbei: 'northeastern chinese rap, dongbei rap, hip-hop, trap',
  shaanxi: 'shaanxi rap, chinese hip-hop, folk rap',
  wu: 'wu dialect rap, shanghai rap, hip-hop',
  minnan: 'taiwanese rap, minnan hip-hop, dialect rap',
  tianjin: 'tianjin rap, northern rap, hip-hop',
  nanjing: 'nanjing rap, jiangsu rap, hip-hop',
}

const EXCLUDED_STYLES = 'singing, melody, ballad, pop song, slow, romantic, acoustic'

// ============================================================================
// Rap 生成器
// ============================================================================

export class RapGeneratorSunoRvc {
  private sunoApiClient: SunoApiClient = getSunoApiClient()
  private seedVCClient: ISeedVCClient = getSeedVCClient()

  async generate(
    params: RapGenerationParams,
    onProgress?: ProgressCallback
  ): Promise<RapGenerationResult> {
    const { userId, userDescription, dialect, referenceAudioId, bgmId, lyrics: providedLyrics } = params
    const taskId = `${userId}-${Date.now()}`

    const bgmMetadata = bgmId
      ? getBGMById(bgmId)
      : getDefaultBGM()

    if (!bgmMetadata) {
      throw new Error(`BGM not found: ${bgmId || 'default'}. Please add BGM to the library or provide a valid bgmId.`)
    }

    if (!this.sunoApiClient.isConfigured()) {
      throw new Error('SunoAPI not configured. Set SUNOAPI_API_KEY in .env.local.')
    }

    console.log(`[RapGenerator] BGM: ${bgmMetadata.id} (${bgmMetadata.bpm} BPM, ${bgmMetadata.duration}s)`)

    // Step 1: 生成歌词（根据 BGM 时长约束字数）
    onProgress?.({
      step: 'lyrics',
      stepName: '生成歌词',
      progress: 0,
      message: '正在生成个性化歌词...',
    })

    const lyrics = providedLyrics || await this.generateLyrics(userDescription, dialect, bgmMetadata.duration)

    onProgress?.({
      step: 'lyrics',
      stepName: '生成歌词',
      progress: 100,
      message: '歌词生成完成',
    })

    const referenceAudioUrl = this.resolveReferenceAudioUrl(referenceAudioId)

    // Step 2: Suno Add Vocals — 在用户 BGM 上生成人声
    onProgress?.({
      step: 'suno',
      stepName: '生成 Rap',
      progress: 0,
      message: '正在使用 Suno Add Vocals 生成人声（跟随你的 BGM 节拍）...',
    })

    const dialectStyle = DIALECT_RAP_STYLE[dialect] || 'rap, hip-hop'
    const bgmStyle = toSunoStyle(bgmMetadata)
    const combinedStyle = `rap, hip-hop, ${dialectStyle}, ${bgmStyle}`

    const addVocalsResult = await this.sunoApiClient.addVocals({
      uploadUrl: bgmMetadata.url,
      prompt: this.formatLyrics(lyrics),
      title: `WhyFire ${dialect} Rap`,
      style: combinedStyle,
      negativeTags: EXCLUDED_STYLES,
      audioWeight: 0.6,
      model: 'V4_5PLUS',
    })

    if (!addVocalsResult.audioUrl) {
      throw new Error(`Suno Add Vocals failed: ${addVocalsResult.error || 'no audio URL'}`)
    }

    console.log(`[RapGenerator] Add Vocals completed: ${addVocalsResult.duration}s`)

    onProgress?.({
      step: 'suno',
      stepName: '生成 Rap',
      progress: 100,
      message: `Rap 生成完成 (${addVocalsResult.duration}s)`,
    })

    // Step 3: Seed-VC 音色替换
    onProgress?.({
      step: 'conversion',
      stepName: '音色替换',
      progress: 0,
      message: '正在替换为用户音色...',
    })

    const seedVCResult = await this.seedVCClient.convert({
      sourceAudio: addVocalsResult.audioUrl!,
      referenceAudio: referenceAudioUrl,
      f0Condition: true,
      fp16: true,
    })

    if (!seedVCResult.outputAudio) {
      throw new Error(`Seed-VC 音色转换失败: ${seedVCResult.error || 'Unknown error'}`)
    }

    onProgress?.({
      step: 'conversion',
      stepName: '音色替换',
      progress: 100,
      message: '音色替换完成',
    })

    console.log(`[RapGenerator] Seed-VC conversion succeeded (${seedVCResult.duration}s)`)

    return {
      audioUrl: seedVCResult.outputAudio,
      duration: seedVCResult.duration || addVocalsResult.duration || 0,
      lyrics,
      dialect,
      taskId,
      pipeline: 'add-vocals',
    }
  }

  // ---------------------------------------------------------------------------
  // 工具方法
  // ---------------------------------------------------------------------------

  private resolveReferenceAudioUrl(referenceAudioId: string): string {
    if (referenceAudioId.startsWith('http')) {
      return referenceAudioId
    }
    const bucket = process.env.OSS_BUCKET
    const region = process.env.OSS_REGION || 'oss-cn-beijing'
    console.warn('[RapGenerator] referenceAudioId should be a complete URL from upload API')
    return `https://${bucket}.${region}.aliyuncs.com/voice-references/${referenceAudioId}`
  }

  private async downloadAudio(source: string): Promise<Buffer> {
    if (source.startsWith('data:audio')) {
      const base64Data = source.split(',')[1]
      return Buffer.from(base64Data!, 'base64')
    }

    console.log(`[RapGenerator] Downloading: ${source}`)
    const res = await fetch(source, {
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) throw new Error(`Failed to download audio: ${res.status} from ${source}`)
    return Buffer.from(await res.arrayBuffer())
  }

  private async uploadResult(
    audioData: string | Buffer,
    taskId: string,
    contentType: string = 'audio/mpeg'
  ): Promise<string> {
    const buffer = typeof audioData === 'string'
      ? await this.downloadAudio(audioData)
      : audioData

    if (isOSSConfigured()) {
      const ossResult = await uploadToOSS(buffer, `final-rap-${taskId}.mp3`, {
        folder: 'rap',
        contentType,
      })

      if (ossResult.success && ossResult.url) {
        const audioUrl = this.getProxiedAudioUrl(ossResult.url)
        console.log(`[RapGenerator] Uploaded to OSS: ${ossResult.url}`)
        return audioUrl
      }

      console.warn(`[RapGenerator] OSS upload failed: ${ossResult.error}, saving locally`)
    }

    return this.saveToLocal(buffer, taskId)
  }

  private saveToLocal(audioBuffer: Buffer, taskId: string): string {
    const outputDir = join(process.cwd(), 'temp')
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })
    const outputPath = join(outputDir, `final-rap-${taskId}.mp3`)
    writeFileSync(outputPath, audioBuffer)
    console.log(`[RapGenerator] Saved to local: ${outputPath}`)
    return `file://${outputPath}`
  }

  private getProxiedAudioUrl(ossUrl: string): string {
    const ossPath = ossUrl.replace(/^https?:\/\/[^/]+\//, '')
    return `/api/audio-proxy?path=${encodeURIComponent(ossPath)}`
  }

  private formatLyrics(lyrics: string): string {
    if (lyrics.includes('[Verse]') || lyrics.includes('[Chorus]')) {
      return lyrics
    }
    const lines = lyrics.split('\n').filter(line => line.trim())
    const formatted: string[] = ['[Verse 1]']
    let lineCount = 0
    for (const line of lines) {
      formatted.push(line)
      lineCount++
      if (lineCount === 4) {
        formatted.push('')
        formatted.push('[Chorus]')
        lineCount = 0
      }
    }
    return formatted.join('\n')
  }

  private async generateLyrics(description: string, dialect: DialectCode, bgmDuration: number): Promise<string> {
    const timeContext = getTimeContext()
    let trendingTopics: Awaited<ReturnType<ReturnType<typeof getTrendingService>['getTrendingTopics']>> | undefined
    let memes: Awaited<ReturnType<ReturnType<typeof getTrendingService>['getInternetMemes']>> | undefined

    try {
      const trendingService = getTrendingService()
      trendingTopics = await trendingService.getTrendingTopics({ limit: 3 })
      memes = await trendingService.getInternetMemes()
    } catch {
      // 时效性数据非关键
    }

    const prompt = buildViralLyricsPrompt({
      description,
      dialect,
      timeContext,
      trendingTopics,
      memes,
      bgmDurationSeconds: bgmDuration,
    })

    try {
      const lyrics = await generateWithClaude(prompt, {
        maxTokens: 2048,
        temperature: 0.9,
      })
      return lyrics.trim()
    } catch (error) {
      console.error('Claude 歌词生成失败，使用回退模板:', error)
      const config = VIRAL_DIALECT_CONFIGS[dialect]
      return `[Chorus]\n${config.goldenPhrases[0]}\n${config.culturalSymbols[0]}里的故事\n`
    }
  }

  async checkServices(): Promise<{
    sunoApi: boolean
    seedvc: boolean
  }> {
    const [sunoApi, seedvc] = await Promise.all([
      this.sunoApiClient.isConfigured(),
      this.seedVCClient.isAvailable(),
    ])

    return { sunoApi, seedvc }
  }
}

// ============================================================================
// 单例
// ============================================================================

let generatorInstance: RapGeneratorSunoRvc | null = null

export function getRapGenerator(): RapGeneratorSunoRvc {
  if (!generatorInstance) {
    generatorInstance = new RapGeneratorSunoRvc()
  }
  return generatorInstance
}

export async function generateRap(
  params: RapGenerationParams,
  onProgress?: ProgressCallback
): Promise<RapGenerationResult> {
  const generator = getRapGenerator()
  return generator.generate(params, onProgress)
}
