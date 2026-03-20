/**
 * Video Synthesizer (增强版)
 * Handles video synthesis with FFmpeg.wasm
 * Combines video, audio, subtitles, and effects into final output
 */

import { FFmpegClient, getFFmpegClient } from './ffmpeg-client'
import type { VideoResolution } from './types'
import { SubtitleRenderer } from '@/lib/subtitle/subtitle-renderer'
import type { LyricLine } from '@/lib/subtitle/subtitle-styles'
import type { SubtitleConfig } from '@/lib/subtitle/subtitle-styles'
import { PRESET_STYLES } from '@/lib/subtitle/subtitle-styles'
// 新增：特效系统
import {
  EffectsConfigEngine,
  UserEffectsConfig,
  LyricLineWithWords,
  DEFAULT_USER_EFFECTS_CONFIG,
} from '@/lib/effects'
// 新增：节拍检测系统
import {
  BeatDetector,
  TimestampMapper,
  BeatAnalysisResult,
} from '@/lib/audio'

/**
 * 默认字体配置
 * FFmpeg.wasm 需要字体文件才能渲染字幕
 * 注意：字体文件名必须与 ASS 字幕中的 Fontname 匹配
 *
 * 重要发现：FFmpeg.wasm 的 subtitles 滤镜需要：
 * 1. 字体文件必须存在于虚拟文件系统中（即使使用 Arial）
 * 2. 必须使用 fontsdir 参数指定字体目录
 * 参考：https://github.com/ffmpegwasm/ffmpeg.wasm/issues/138
 * 参考：https://github.com/ffmpegwasm/ffmpeg.wasm/issues/588
 */
const DEFAULT_FONT_CONFIG = {
  // 使用 Noto Sans SC 作为默认字体（支持中英文）
  fontName: 'Noto Sans SC',
  // 字体 URL - 使用 Google Fonts CDN
  fontUrl: 'https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYw.ttf',
  // 备选字体 URL（GitHub Raw - 文件较大约 36MB）
  fallbackFontUrl: 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf',
  // 字体在 FFmpeg 虚拟文件系统中的路径
  fontPath: '/tmp/NotoSansSC.ttf',
  // fontsdir 路径
  fontsDir: '/tmp',
}

/**
 * 字体缓存
 */
let fontCache: Uint8Array | null = null
let fontLoading = false

/**
 * Video synthesis progress stages
 */
export type SynthesisStage =
  | 'idle'
  | 'loading-ffmpeg'
  | 'writing-video'
  | 'writing-audio'
  | 'generating-subtitles'
  | 'synthesizing'
  | 'reading-output'
  | 'complete'
  | 'error'

/**
 * Video synthesis progress info
 */
export interface SynthesisProgress {
  /** Current stage */
  stage: SynthesisStage
  /** Progress within current stage (0-1) */
  progress: number
  /** Overall progress (0-1) */
  overallProgress: number
  /** Status message */
  message: string
  /** Error message if stage is 'error' */
  error?: string
}

/**
 * Video synthesizer options
 */
export interface VideoSynthesizerOptions {
  /** Video file to process */
  videoFile: File | Blob
  /** Audio file or URL */
  audioFile: File | Blob | string
  /** Lyrics with timing information */
  lyrics: LyricLine[]
  /** 纯文本歌词（用于节拍同步，优先于 lyrics）(新增) */
  plainTextLyrics?: string
  /** Subtitle configuration (optional, defaults to karaoke style) */
  subtitleConfig?: SubtitleConfig
  /** Output filename (optional, defaults to 'output.mp4') */
  outputFilename?: string
  /** Progress callback */
  onProgress?: (progress: SynthesisProgress) => void
  /** Use multi-threaded FFmpeg (optional, defaults to true) */
  multiThread?: boolean
  /** Output resolution (optional, defaults to '720p') */
  resolution?: VideoResolution
  /** 特效配置 (新增) */
  effectsConfig?: Partial<UserEffectsConfig>
  /** 是否禁用音频混合（当音频已存在于视频中时）(新增) */
  disableAudioMix?: boolean
}

/**
 * Video synthesizer result
 */
export interface VideoSynthesizerResult {
  /** Output video blob */
  blob: Blob
  /** Object URL for the blob (remember to revoke when done) */
  url: string
  /** Output filename */
  filename: string
  /** File size in bytes */
  size: number
  /** Duration of synthesis in milliseconds */
  duration: number
}

/**
 * Default file names used in FFmpeg virtual filesystem
 */
const FILE_NAMES = {
  INPUT_VIDEO: 'input.mp4',
  INPUT_AUDIO: 'audio.mp3',
  SUBTITLE_FILE: 'subs.ass',
  OUTPUT_VIDEO: 'output.mp4',
} as const

/**
 * Stage progress weights for overall progress calculation
 */
const STAGE_WEIGHTS: Record<SynthesisStage, number> = {
  idle: 0,
  'loading-ffmpeg': 0.15,
  'writing-video': 0.25,
  'writing-audio': 0.15,
  'generating-subtitles': 0.05,
  synthesizing: 0.30,
  'reading-output': 0.10,
  complete: 1.0,
  error: 0,
}

/**
 * 加载字体文件（用于 FFmpeg.wasm 字幕渲染）
 * 从 CDN 加载字体并缓存
 *
 * 重要：FFmpeg.wasm 的 subtitles 滤镜必须有字体文件存在于虚拟文件系统中
 * 参考：https://github.com/ffmpegwasm/ffmpeg.wasm/issues/138
 */
async function loadFontForFFmpeg(): Promise<{ fontData: Uint8Array; fontName: string }> {
  if (fontCache) {
    console.log('[VideoSynthesizer] 使用缓存的字体')
    return { fontData: fontCache, fontName: DEFAULT_FONT_CONFIG.fontName }
  }

  if (fontLoading) {
    // 等待其他地方的加载完成
    while (fontLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (fontCache) {
      return { fontData: fontCache, fontName: DEFAULT_FONT_CONFIG.fontName }
    }
  }

  fontLoading = true
  console.log('[VideoSynthesizer] 开始加载字体...')

  try {
    // 尝试主 URL
    let response = await fetch(DEFAULT_FONT_CONFIG.fontUrl)

    if (!response.ok) {
      console.log('[VideoSynthesizer] 主字体 URL 加载失败，尝试备选 URL...')
      response = await fetch(DEFAULT_FONT_CONFIG.fallbackFontUrl)
    }

    if (!response.ok) {
      throw new Error(`字体加载失败: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    fontCache = new Uint8Array(arrayBuffer)

    console.log(`[VideoSynthesizer] 字体加载成功，大小: ${fontCache.length} bytes`)
    return { fontData: fontCache, fontName: DEFAULT_FONT_CONFIG.fontName }
  } catch (error) {
    console.error('[VideoSynthesizer] 字体加载失败:', error)
    fontLoading = false
    throw new Error(`无法加载字幕字体: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    fontLoading = false
  }
}

/**
 * Video Synthesizer class
 * Handles the complete video synthesis workflow
 */
export class VideoSynthesizer {
  private client: FFmpegClient | null = null
  private renderer: SubtitleRenderer
  private effectsEngine: EffectsConfigEngine
  private progressCallback: ((progress: SynthesisProgress) => void) | null = null
  private currentStage: SynthesisStage = 'idle'
  private stageProgress: number = 0

  constructor(subtitleConfig: SubtitleConfig = PRESET_STYLES.karaoke) {
    this.renderer = new SubtitleRenderer(subtitleConfig)
    this.effectsEngine = new EffectsConfigEngine()
  }

  /**
   * Update progress and notify callback
   */
  private updateProgress(
    stage: SynthesisStage,
    progress: number,
    message: string,
    error?: string
  ): void {
    this.currentStage = stage
    this.stageProgress = progress

    // Calculate overall progress
    const previousStagesWeight = Object.entries(STAGE_WEIGHTS)
      .filter(([s]) => {
        const stages = Object.keys(STAGE_WEIGHTS)
        return stages.indexOf(s) < stages.indexOf(stage)
      })
      .reduce((sum, [, weight]) => sum + weight, 0)

    const currentStageWeight = STAGE_WEIGHTS[stage]
    const overallProgress = previousStagesWeight + currentStageWeight * progress

    const progressInfo: SynthesisProgress = {
      stage,
      progress,
      overallProgress,
      message,
      error,
    }

    this.progressCallback?.(progressInfo)
  }

  /**
   * Synthesize video with audio and subtitles
   */
  async synthesize(options: VideoSynthesizerOptions): Promise<VideoSynthesizerResult> {
    const {
      videoFile,
      audioFile,
      lyrics,
      plainTextLyrics,
      subtitleConfig,
      outputFilename = FILE_NAMES.OUTPUT_VIDEO,
      onProgress,
      multiThread = true,
      resolution = '720p',
      effectsConfig,
    } = options

    this.progressCallback = onProgress || null
    const startTime = Date.now()

    // Debug: Log input file sizes
    const videoSize = videoFile instanceof Blob ? videoFile.size : (videoFile as Uint8Array).length
    console.log('[VideoSynthesizer] Input files:', {
      videoFileSize: videoSize,
      videoFileType: videoFile instanceof Blob ? videoFile.type : typeof videoFile,
      audioFileSize: audioFile instanceof Blob ? audioFile.size : typeof audioFile,
      lyricsCount: lyrics.length,
      hasPlainTextLyrics: !!plainTextLyrics,
    })

    // 验证视频文件不为空
    if (videoSize === 0) {
      throw new Error('视频文件为空 (0 bytes)，请重新上传视频文件')
    }

    try {
      // Stage 1: Load FFmpeg
      this.updateProgress('loading-ffmpeg', 0, 'Loading FFmpeg...')
      this.client = getFFmpegClient()

      await this.client.load({
        multiThread,
        onProgress: (p) => {
          this.updateProgress('loading-ffmpeg', p, 'Loading FFmpeg...')
        },
      })
      this.updateProgress('loading-ffmpeg', 1, 'FFmpeg loaded')

      // Stage 2: Write video file
      this.updateProgress('writing-video', 0, 'Writing video file...')
      await this.client.writeFile(FILE_NAMES.INPUT_VIDEO, videoFile)
      this.updateProgress('writing-video', 1, 'Video file written')

      // Stage 3: Write audio file
      this.updateProgress('writing-audio', 0, 'Writing audio file...')

      if (typeof audioFile === 'string') {
        // If it's a URL, fetch it first
        const response = await fetch(audioFile)
        const audioBlob = await response.blob()
        await this.client.writeFile(FILE_NAMES.INPUT_AUDIO, audioBlob)
      } else {
        await this.client.writeFile(FILE_NAMES.INPUT_AUDIO, audioFile)
      }
      this.updateProgress('writing-audio', 1, 'Audio file written')

      // Stage 3.1: Beat detection and lyrics sync (if plain text lyrics provided)
      let syncedLyrics: LyricLineWithWords[] | null = null
      if (plainTextLyrics && typeof audioFile === 'string') {
        this.updateProgress('writing-audio', 0.95, 'Analyzing audio beats...')

        try {
          // Get audio duration
          const audioDuration = await this.getAudioDuration(audioFile)

          // Analyze beats
          const beatInfo = await this.analyzeBeat(audioFile)

          // Map lyrics to timestamps
          syncedLyrics = this.mapLyricsToTimestamps(plainTextLyrics, beatInfo, audioDuration)

          console.log(`[VideoSynthesizer] 节拍同步完成: ${syncedLyrics.length} 行歌词`)
        } catch (error) {
          console.error('[VideoSynthesizer] 节拍同步失败，将使用原始歌词:', error)
          syncedLyrics = null
        }
      }

      // Stage 3.5: Load and write font file for subtitle rendering
      // FFmpeg.wasm needs fonts to be available in its virtual filesystem
      // 这是关键步骤：必须将字体写入 /tmp 目录，然后通过 fontsdir 参数引用
      // 参考：https://github.com/ffmpegwasm/ffmpeg.wasm/issues/138
      this.updateProgress('generating-subtitles', 0, 'Loading font for subtitles...')
      let loadedFontName = DEFAULT_FONT_CONFIG.fontName
      try {
        const { fontData, fontName } = await loadFontForFFmpeg()
        await this.client.writeFile(DEFAULT_FONT_CONFIG.fontPath, fontData)
        console.log(`[VideoSynthesizer] 字体已写入 FFmpeg 虚拟文件系统: ${DEFAULT_FONT_CONFIG.fontPath}`)
        loadedFontName = fontName
        console.log(`[VideoSynthesizer] 使用字体: ${fontName}`)
      } catch (fontError) {
        console.warn('[VideoSynthesizer] 字体加载失败，字幕可能无法正确渲染:', fontError)
      }

      // Stage 4: Generate subtitles with effects
      this.updateProgress('generating-subtitles', 0, 'Generating subtitles with effects...')

      console.log('[VideoSynthesizer] ===== SUBTITLE DEBUG START =====')
      console.log('[VideoSynthesizer] Input lyrics count:', lyrics.length)
      console.log('[VideoSynthesizer] First 3 lyrics:', lyrics.slice(0, 3))
      console.log('[VideoSynthesizer] Effects config:', effectsConfig)
      console.log('[VideoSynthesizer] Using font:', loadedFontName)
      console.log('[VideoSynthesizer] Synced lyrics available:', !!syncedLyrics)

      // 使用特效引擎生成字幕（如果提供了特效配置）
      let subtitleContent: string

      // 决定使用哪种歌词：节拍同步歌词 > 原始歌词
      const finalLyrics: LyricLineWithWords[] = syncedLyrics
        ? syncedLyrics
        : lyrics.map(line => ({
            id: line.id,
            text: line.text,
            startTime: line.startTime,
            endTime: line.endTime,
            words: line.words || [],
          }))

      console.log('[VideoSynthesizer] Final lyrics count:', finalLyrics.length)
      console.log('[VideoSynthesizer] Final lyrics sample:', finalLyrics.slice(0, 2))

      if (effectsConfig) {
        // 合并字体配置到 effectsConfig
        // 确保 subtitleConfig 有所有必需的字段
        // 使用 Arial 作为默认字体（FFmpeg.wasm 内置支持）
        const baseSubtitleConfig = {
          primaryColor: '#FFFFFF',
          secondaryColor: '#8B5CF6',
          fontSize: 52,
          fontFamily: loadedFontName, // 使用 Arial 或已加载的字体
          outlineColor: '#000000',
          outlineWidth: 3,
          shadowEnabled: true,
          ...effectsConfig.subtitleConfig,
        }

        const mergedEffectsConfig: Partial<UserEffectsConfig> = {
          ...effectsConfig,
          subtitleConfig: {
            ...baseSubtitleConfig,
            fontFamily: loadedFontName, // 确保使用加载的字体
          },
        }

        // 更新特效引擎配置
        this.effectsEngine = new EffectsConfigEngine(mergedEffectsConfig)

        // 获取应用预设后的完整配置
        const appliedConfig = this.effectsEngine.getConfig()
        console.log('[VideoSynthesizer] Applied effects config:', appliedConfig)

        console.log('[VideoSynthesizer] Lyrics with words:', finalLyrics.slice(0, 2))

        // 使用特效引擎渲染
        const rendered = this.effectsEngine.render(finalLyrics, FILE_NAMES.SUBTITLE_FILE)
        subtitleContent = rendered.assContent

        console.log('[VideoSynthesizer] Generated subtitle content length:', subtitleContent.length)
        console.log('[VideoSynthesizer] Subtitle content preview:')
        console.log(subtitleContent.substring(0, 800))
        console.log('[VideoSynthesizer] Generated filter chain:', rendered.ffmpegFilterChain || '(empty)')
      } else {
        // 回退到传统字幕渲染
        console.log('[VideoSynthesizer] Using legacy subtitle renderer')
        if (subtitleConfig) {
          // 更新字体配置
          subtitleConfig.fontFamily = loadedFontName
          this.renderer.setConfig(subtitleConfig)
        }
        subtitleContent = this.renderer.generateASS(lyrics)
        console.log('[VideoSynthesizer] Legacy subtitle content length:', subtitleContent.length)
      }

      console.log('[VideoSynthesizer] Writing subtitle file:', FILE_NAMES.SUBTITLE_FILE)
      console.log('[VideoSynthesizer] Subtitle content size:', subtitleContent.length, 'characters')

      await this.client.writeFile(FILE_NAMES.SUBTITLE_FILE, subtitleContent)
      console.log('[VideoSynthesizer] Subtitle file written successfully')
      this.updateProgress('generating-subtitles', 1, 'Subtitles generated')

      // Stage 5: Synthesize video with filters
      this.updateProgress('synthesizing', 0, 'Synthesizing video...')

      // Set up progress listener for FFmpeg
      this.client.onProgress(({ ratio }) => {
        this.updateProgress('synthesizing', Math.max(0, Math.min(1, ratio)), 'Synthesizing video...')
      })

      // 获取滤镜链（如果使用特效引擎）
      let filterChain = ''
      if (effectsConfig) {
        const currentConfig = this.effectsEngine.getConfig()
        console.log('[VideoSynthesizer] Current effects config:', {
          videoFilter: currentConfig.videoFilter,
          additionalFilters: currentConfig.additionalFilters,
          preset: currentConfig.preset,
        })
        const rendered = this.effectsEngine.render([], FILE_NAMES.SUBTITLE_FILE)
        filterChain = rendered.ffmpegFilterChain
        console.log('[VideoSynthesizer] Generated filter chain:', filterChain || '(empty)')
      }

      const outputName = await this.synthesizeWithEffects({
        inputVideo: FILE_NAMES.INPUT_VIDEO,
        inputAudio: FILE_NAMES.INPUT_AUDIO,
        outputVideo: outputFilename,
        subtitleFile: FILE_NAMES.SUBTITLE_FILE,
        resolution,
        videoFilter: filterChain,
      })
      this.updateProgress('synthesizing', 1, 'Video synthesized')

      // Stage 6: Read output
      this.updateProgress('reading-output', 0, 'Reading output video...')
      console.log(`[VideoSynthesizer] Reading output file: ${outputName}`)
      const videoBlob = await this.client.readFileAsBlob(outputName, 'video/mp4')
      console.log(`[VideoSynthesizer] Output blob size: ${videoBlob.size} bytes`)
      const url = URL.createObjectURL(videoBlob)
      console.log(`[VideoSynthesizer] Created object URL: ${url}`)
      this.updateProgress('reading-output', 1, 'Output ready')

      // Cleanup temp files
      await this.cleanup()

      // Complete
      const duration = Date.now() - startTime
      this.updateProgress('complete', 1, 'Video synthesis complete!')

      return {
        blob: videoBlob,
        url,
        filename: outputFilename,
        size: videoBlob.size,
        duration,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.updateProgress('error', 0, 'Synthesis failed', errorMessage)
      throw error
    }
  }

  /**
   * 合成视频（带特效）
   */
  private async synthesizeWithEffects(options: {
    inputVideo: string
    inputAudio: string
    outputVideo: string
    subtitleFile: string
    resolution: VideoResolution
    videoFilter?: string
  }): Promise<string> {
    const { inputVideo, inputAudio, outputVideo, subtitleFile, resolution, videoFilter } = options

    // 获取分辨率
    const resolutions: Record<VideoResolution, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    }
    const { width, height } = resolutions[resolution]

    // 构建视频滤镜链
    const videoFilters: string[] = []

    // 1. 缩放和填充
    videoFilters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`)
    videoFilters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`)

    // 2. 添加特效滤镜
    if (videoFilter && videoFilter.length > 0) {
      videoFilters.push(videoFilter)
    }

    // 3. 添加字幕（字幕必须在最后）
    // 注意：FFmpeg.wasm 0.12 的 subtitles 滤镜需要 fontsdir 参数
    // 必须指定字体目录，否则会报 "Can't find selected font provider"
    // 参考：https://github.com/ffmpegwasm/ffmpeg.wasm/issues/138
    // 参考：https://github.com/ffmpegwasm/ffmpeg.wasm/issues/588
    videoFilters.push(`subtitles=${subtitleFile}:fontsdir=/tmp`)

    console.log('[VideoSynthesizer] ===== FFmpeg FILTER DEBUG =====')
    console.log('[VideoSynthesizer] Video filters:', videoFilters)
    console.log('[VideoSynthesizer] Combined filter chain:', videoFilters.join(','))

    // 构建 FFmpeg 命令
    // 注意: -map 0:v:0 只取视频流，-map 1:a:0 只取新生成的音频
    // 如果原视频有音频，会被自动忽略（因为我们没有 -map 0:a）
    // 这是预期行为：用户上传的视频通常是背景素材，Rap 音频才是主要内容
    const args: string[] = [
      '-i', inputVideo,
      '-i', inputAudio,
      '-vf', videoFilters.join(','),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-shortest',
      '-y',
      outputVideo,
    ]

    console.log('[VideoSynthesizer] FFmpeg 命令:', args.join(' '))

    await this.client!.exec(args)
    return outputVideo
  }

  /**
   * Clean up temporary files from virtual filesystem
   */
  private async cleanup(): Promise<void> {
    if (!this.client || !this.client.isLoaded()) {
      return
    }

    const filesToDelete = [
      FILE_NAMES.INPUT_VIDEO,
      FILE_NAMES.INPUT_AUDIO,
      FILE_NAMES.SUBTITLE_FILE,
    ]

    for (const filename of filesToDelete) {
      try {
        await this.client.deleteFile(filename)
      } catch {
        // Ignore errors during cleanup
      }
    }
  }

  /**
   * Get current synthesis stage
   */
  getStage(): SynthesisStage {
    return this.currentStage
  }

  /**
   * Get current stage progress
   */
  getStageProgress(): number {
    return this.stageProgress
  }

  /**
   * Update subtitle configuration
   */
  setSubtitleConfig(config: SubtitleConfig): void {
    this.renderer.setConfig(config)
  }

  /**
   * Get current subtitle configuration
   */
  getSubtitleConfig(): SubtitleConfig {
    return this.renderer.getConfig()
  }

  /**
   * 设置特效配置
   */
  setEffectsConfig(config: Partial<UserEffectsConfig>): void {
    this.effectsEngine = new EffectsConfigEngine(config)
  }

  /**
   * 获取特效引擎
   */
  getEffectsEngine(): EffectsConfigEngine {
    return this.effectsEngine
  }

  /**
   * 分析音频节拍
   */
  private async analyzeBeat(audioUrl: string): Promise<BeatAnalysisResult> {
    console.log('[VideoSynthesizer] 开始分析音频节拍...')

    try {
      // 获取音频数据
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()

      // 使用节拍检测器分析
      const detector = new BeatDetector({ debug: false })
      const beatInfo = await detector.analyze(arrayBuffer)

      console.log(`[VideoSynthesizer] 节拍分析完成: BPM=${beatInfo.bpm}, offset=${beatInfo.offset}s`)

      return beatInfo
    } catch (error) {
      console.error('[VideoSynthesizer] 节拍分析失败:', error)
      // 返回默认值，确保流程继续
      return {
        bpm: 120,
        offset: 0,
        beatInterval: 500,
        confidence: 0.5,
      }
    }
  }

  /**
   * 将纯文本歌词转换为带时间戳的歌词
   */
  private mapLyricsToTimestamps(
    lyrics: string,
    beatInfo: BeatAnalysisResult,
    audioDuration: number
  ): LyricLineWithWords[] {
    const mapper = new TimestampMapper({
      alignToBeats: true,
      generateWords: true,
      minWordDuration: 100,
    })

    return mapper.mapLyricsToBeats(lyrics, beatInfo, audioDuration)
  }

  /**
   * 获取音频时长
   */
  private async getAudioDuration(audioSource: File | Blob | string): Promise<number> {
    // 创建 AudioContext 来获取音频时长
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    try {
      let audioBuffer: ArrayBuffer

      if (typeof audioSource === 'string') {
        // 从 URL 获取音频
        const response = await fetch(audioSource)
        audioBuffer = await response.arrayBuffer()
      } else {
        // 从 Blob/File 获取音频
        audioBuffer = await audioSource.arrayBuffer()
      }

      // 解码音频数据
      const decodedData = await audioContext.decodeAudioData(audioBuffer)
      const duration = decodedData.duration

      console.log(`[VideoSynthesizer] 音频时长: ${duration.toFixed(2)}s`)

      return duration
    } finally {
      await audioContext.close()
    }
  }
}

/**
 * Create a video synthesizer with specified subtitle style
 */
export function createVideoSynthesizer(
  subtitleConfig?: SubtitleConfig
): VideoSynthesizer {
  return new VideoSynthesizer(subtitleConfig)
}

/**
 * Helper function to download a blob as a file
 */
export function downloadVideoBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Helper function to revoke video URL when done
 */
export function revokeVideoUrl(url: string): void {
  URL.revokeObjectURL(url)
}
