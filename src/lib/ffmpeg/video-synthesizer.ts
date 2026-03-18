/**
 * Video Synthesizer
 * Handles video synthesis with FFmpeg.wasm
 * Combines video, audio, and subtitles into final output
 */

import { FFmpegClient, getFFmpegClient } from './ffmpeg-client'
import type { VideoResolution } from './types'
import { SubtitleRenderer } from '@/lib/subtitle/subtitle-renderer'
import type { LyricLine } from '@/lib/subtitle/subtitle-styles'
import type { SubtitleConfig } from '@/lib/subtitle/subtitle-styles'
import { PRESET_STYLES } from '@/lib/subtitle/subtitle-styles'

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
 * Video Synthesizer class
 * Handles the complete video synthesis workflow
 */
export class VideoSynthesizer {
  private client: FFmpegClient | null = null
  private renderer: SubtitleRenderer
  private progressCallback: ((progress: SynthesisProgress) => void) | null = null
  private currentStage: SynthesisStage = 'idle'
  private stageProgress: number = 0

  constructor(subtitleConfig: SubtitleConfig = PRESET_STYLES.karaoke) {
    this.renderer = new SubtitleRenderer(subtitleConfig)
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
      subtitleConfig,
      outputFilename = FILE_NAMES.OUTPUT_VIDEO,
      onProgress,
      multiThread = true,
      resolution = '720p',
    } = options

    this.progressCallback = onProgress || null
    const startTime = Date.now()

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

      // Stage 4: Generate subtitles
      this.updateProgress('generating-subtitles', 0, 'Generating subtitles...')

      // Update renderer config if provided
      if (subtitleConfig) {
        this.renderer.setConfig(subtitleConfig)
      }

      const subtitleContent = this.renderer.generateASS(lyrics)
      await this.client.writeFile(FILE_NAMES.SUBTITLE_FILE, subtitleContent)
      this.updateProgress('generating-subtitles', 1, 'Subtitles generated')

      // Stage 5: Synthesize video
      this.updateProgress('synthesizing', 0, 'Synthesizing video...')

      // Set up progress listener for FFmpeg
      this.client.onProgress(({ ratio }) => {
        this.updateProgress('synthesizing', Math.max(0, Math.min(1, ratio)), 'Synthesizing video...')
      })

      const outputName = await this.client.synthesizeVideo({
        inputVideo: FILE_NAMES.INPUT_VIDEO,
        inputAudio: FILE_NAMES.INPUT_AUDIO,
        outputVideo: outputFilename,
        subtitleFile: FILE_NAMES.SUBTITLE_FILE,
        resolution,
      })
      this.updateProgress('synthesizing', 1, 'Video synthesized')

      // Stage 6: Read output
      this.updateProgress('reading-output', 0, 'Reading output video...')
      const videoBlob = await this.client.readFileAsBlob(outputName, 'video/mp4')
      const url = URL.createObjectURL(videoBlob)
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
