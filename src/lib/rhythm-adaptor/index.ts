/**
 * Rhythm Adaptor 核心模块
 * 将普通语音转换为有节奏的 Rap
 *
 * 流程：
 * 1. 音节切分 (Syllable Splitter)
 * 2. 节奏对齐 (Beat Aligner)
 * 3. 时间拉伸 (Time Stretcher)
 * 4. 人性化处理 (Humanizer)
 */

import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import type {
  RhythmConfig,
  RhythmAdaptorResult,
  SyllableSegmentResult,
  BeatAlignResult,
} from './types'
import { getSyllableSplitter } from './syllable-splitter'
import { getBeatAligner } from './beat-aligner'
import { getTimeStretcher } from './time-stretcher'
import { getHumanizer } from './humanizer'

// 导出所有类型
export * from './types'

// 导出子模块
export { SyllableSplitter, getSyllableSplitter } from './syllable-splitter'
export { BeatAligner, getBeatAligner } from './beat-aligner'
export { TimeStretcher, getTimeStretcher } from './time-stretcher'
export { Humanizer, getHumanizer } from './humanizer'

/**
 * Rhythm Adaptor 配置
 */
interface RhythmAdaptorConfig {
  tempDir: string
  pythonPath: string
  timeout: number
}

/**
 * Rhythm Adaptor
 * 将普通语音转换为有节奏的 Rap
 */
export class RhythmAdaptor {
  private config: RhythmAdaptorConfig
  private splitter = getSyllableSplitter()
  private aligner = getBeatAligner()
  private stretcher = getTimeStretcher()
  private humanizer = getHumanizer()

  constructor(config?: Partial<RhythmAdaptorConfig>) {
    this.config = {
      tempDir: config?.tempDir || '/tmp/dialect-rap/rhythm',
      pythonPath: config?.pythonPath || process.env.PYTHON_PATH || 'python3',
      timeout: config?.timeout || 180000, // 3分钟
    }
  }

  /**
   * 处理音频，添加 Rap 节奏
   *
   * @param audioPath 输入音频路径
   * @param lyrics 歌词文本
   * @param config 节奏配置
   */
  async process(
    audioPath: string,
    lyrics: string,
    config: RhythmConfig
  ): Promise<RhythmAdaptorResult> {
    const startTime = Date.now()
    const taskId = Date.now().toString()

    console.log('[RhythmAdaptor] Starting rhythm processing...')

    // 确保临时目录存在
    await fs.mkdir(this.config.tempDir, { recursive: true })

    // Step 1: 音节切分
    console.log('[RhythmAdaptor] Step 1: Segmenting syllables...')
    const segmentResult = await this.splitter.split(audioPath, lyrics)

    // Step 2: 节奏对齐
    console.log('[RhythmAdaptor] Step 2: Aligning to beat grid...')
    const alignmentResult = this.aligner.align(segmentResult.syllables, config)

    // Step 3: 人性化处理
    console.log('[RhythmAdaptor] Step 3: Applying humanization...')
    const humanizedAlignments = config.enableHumanization !== false
      ? this.humanizer.humanize(alignmentResult.alignments, {
          timeRange: config.humanizeRange || 20,
        })
      : alignmentResult.alignments

    // Step 4: 时间拉伸和合成
    console.log('[RhythmAdaptor] Step 4: Synthesizing rhythmic audio...')
    const outputAudio = await this.synthesizeRhythm(
      audioPath,
      humanizedAlignments,
      segmentResult,
      taskId
    )

    const processingTime = Date.now() - startTime
    console.log(`[RhythmAdaptor] Completed in ${processingTime}ms`)

    return {
      audioPath: outputAudio,
      processingTime,
      details: {
        syllableCount: segmentResult.syllables.length,
        duration: alignmentResult.totalDuration / 1000,
        bpm: config.bpm,
        beatCount: alignmentResult.beatCount,
      },
      alignments: humanizedAlignments,
    }
  }

  /**
   * 智能处理（自动检测 BPM 和重音）
   */
  async smartProcess(
    audioPath: string,
    lyrics: string,
    config?: Partial<RhythmConfig>
  ): Promise<RhythmAdaptorResult> {
    // Step 1: 音节切分
    const segmentResult = await this.splitter.split(audioPath, lyrics)

    // Step 2: 自动检测 BPM（如果未指定）
    let bpm = config?.bpm
    if (!bpm) {
      bpm = this.aligner.suggestBpm(
        segmentResult.syllables,
        segmentResult.duration * 1000
      )
      console.log(`[RhythmAdaptor] Auto-detected BPM: ${bpm}`)
    }

    // Step 3: 智能对齐
    const alignmentResult = this.aligner.smartAlign(
      segmentResult.syllables,
      { ...config, bpm }
    )

    // Step 4: 人性化处理
    const humanizedAlignments = config?.enableHumanization !== false
      ? this.humanizer.humanize(alignmentResult.alignments, {
          timeRange: config?.humanizeRange || 20,
        })
      : alignmentResult.alignments

    // Step 5: 合成
    const outputAudio = await this.synthesizeRhythm(
      audioPath,
      humanizedAlignments,
      segmentResult,
      Date.now().toString()
    )

    return {
      audioPath: outputAudio,
      processingTime: 0,
      details: {
        syllableCount: segmentResult.syllables.length,
        duration: alignmentResult.totalDuration / 1000,
        bpm,
        beatCount: alignmentResult.beatCount,
      },
      alignments: humanizedAlignments,
    }
  }

  /**
   * 合成节奏音频
   */
  private async synthesizeRhythm(
    audioPath: string,
    alignments: BeatAlignResult['alignments'],
    segmentResult: SyllableSegmentResult,
    taskId: string
  ): Promise<string> {
    const outputDir = path.join(this.config.tempDir, taskId)
    await fs.mkdir(outputDir, { recursive: true })

    // 如果没有音节信息，直接返回原音频
    if (alignments.length === 0) {
      return audioPath
    }

    // 简化方案：将整个音频按节奏拉伸
    // 更精确的方案应该切分每个音节再重组

    const totalDuration = alignments[alignments.length - 1].targetEndTime
    const originalDuration = segmentResult.duration * 1000
    const overallRatio = totalDuration / originalDuration

    const outputPath = path.join(outputDir, 'rhythm_output.wav')

    // 使用时间拉伸
    await this.stretcher.stretch({
      inputPath: audioPath,
      outputPath,
      ratio: overallRatio,
      mode: 'high_quality',
      preservePitch: true,
    })

    return outputPath
  }

  /**
   * 清理临时文件
   */
  async cleanup(taskId: string): Promise<void> {
    const taskDir = path.join(this.config.tempDir, taskId)
    try {
      await fs.rm(taskDir, { recursive: true, force: true })
    } catch (error) {
      console.warn('[RhythmAdaptor] Cleanup failed:', error)
    }
  }

  /**
   * 预览节奏（快速生成低质量预览）
   */
  async preview(
    audioPath: string,
    lyrics: string,
    bpm: number
  ): Promise<string> {
    const result = await this.process(audioPath, lyrics, {
      bpm,
      enableHumanization: false,
      stretchMode: 'simple',
    })

    return result.audioPath
  }
}

// 单例实例
let adaptorInstance: RhythmAdaptor | null = null

/**
 * 获取 Rhythm Adaptor 实例
 */
export function getRhythmAdaptor(): RhythmAdaptor {
  if (!adaptorInstance) {
    adaptorInstance = new RhythmAdaptor()
  }
  return adaptorInstance
}
