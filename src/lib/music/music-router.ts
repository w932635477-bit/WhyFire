/**
 * 音乐生成路由层（重构版）
 * 基于需求文档: /docs/dialect-rap-requirements.md
 *
 * 核心架构：
 * 1. CosyVoice 3 - 方言语音合成（支持 8 种方言）
 * 2. GPT-SoVITS - 用户声音克隆
 *
 * 生成流程：
 * 用户录音 -> 声音克隆(GPT-SoVITS) -> 方言TTS(CosyVoice) -> 节奏适配 -> 混音合成
 *
 * 支持的 8 种方言：
 * - 普通话 (mandarin)
 * - 粤语 (cantonese)
 * - 四川话 (sichuan)
 * - 东北话 (dongbei)
 * - 山东话 (shandong)
 * - 上海话 (wu)
 * - 河南话 (henan)
 * - 湖南话 (xiang)
 */

import {
  getCosyVoiceClient,
  isCosyVoiceDialect,
  type CosyVoiceDialect,
  type CosyVoiceTTSResult,
} from '@/lib/tts'
import {
  getGPTSoVITSClient,
  type VoiceCloningRequest,
  type VoiceCloningResult,
} from '@/lib/voice'
import type { DialectCode } from '@/types/dialect'
import { DIALECT_CONFIGS } from '@/types/dialect'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 音乐风格
 */
export type MusicStyle = 'rap' | 'pop' | 'electronic' | 'rock' | 'chill'

/**
 * 音乐提供商标识
 */
export type MusicProvider = 'cosyvoice' | 'gpt_sovits'

/**
 * 音乐生成参数
 */
export interface MusicGenerationParams {
  /** 歌词内容 */
  lyrics: string
  /** 方言类型 */
  dialect: DialectCode
  /** 音乐风格 */
  style?: MusicStyle
  /** 目标时长（秒） */
  duration?: number
  /** 克隆的音色 ID（使用用户自己的声音） */
  voiceId?: string
  /** 强制使用指定提供商 */
  forceProvider?: MusicProvider
}

/**
 * 音乐生成结果
 */
export interface MusicGenerationResult {
  /** 音频 URL */
  audioUrl: string
  /** 提供商 */
  provider: MusicProvider
  /** 时长（秒） */
  duration?: number
  /** 方言 */
  dialect: DialectCode
  /** 任务 ID */
  taskId?: string
  /** 计费字符数 */
  characters?: number
  /** 字级别时间戳 */
  wordTimestamps?: Array<{
    text: string
    beginTime: number
    endTime: number
  }>
}

/**
 * 声音克隆参数
 */
export interface VoiceCloningParams {
  /** 音频数据（Base64） */
  audioData?: string
  /** 音频 URL */
  audioUrl?: string
  /** 用户 ID */
  userId: string
  /** 声音名称 */
  voiceName?: string
}

/**
 * 声音克隆结果
 */
export interface VoiceCloningStatusResult {
  /** 任务 ID */
  taskId: string
  /** 状态 */
  status: 'pending' | 'processing' | 'training' | 'completed' | 'failed'
  /** 音色 ID */
  voiceId?: string
  /** 进度 (0-100) */
  progress?: number
  /** 错误信息 */
  error?: string
}

/**
 * MVP 支持的方言列表（8 种）
 */
export const MVP_DIALECTS: readonly DialectCode[] = [
  'mandarin',
  'cantonese',
  'sichuan',
  'dongbei',
  'shandong',
  'wu',
  'henan',
  'xiang',
] as const

/**
 * 方言名称映射
 */
export const DIALECT_LABELS: Record<DialectCode, string> = Object.fromEntries(
  Object.entries(DIALECT_CONFIGS).map(([code, config]) => [code, config.name])
) as Record<DialectCode, string>

// 兼容旧类型
export type DialectType = DialectCode

// ============================================================================
// 核心功能：语音合成
// ============================================================================

/**
 * 生成方言语音
 * 使用 CosyVoice 3 进行方言 TTS
 *
 * @param params 生成参数
 * @returns 生成结果
 */
export async function generateMusic(params: MusicGenerationParams): Promise<MusicGenerationResult> {
  const { lyrics, dialect, style = 'rap', duration, voiceId, forceProvider } = params

  console.log(`[MusicRouter] 开始生成，方言: ${dialect}, 风格: ${style}, 音色: ${voiceId || '默认'}`)

  // 检查方言支持
  if (!isDialectSupported(dialect)) {
    throw new Error(`不支持的方言: ${dialect}。MVP 仅支持 8 种方言: ${MVP_DIALECTS.join(', ')}`)
  }

  // 如果有用户克隆音色，使用 GPT-SoVITS
  if (voiceId) {
    return generateWithClonedVoice(lyrics, dialect, voiceId)
  }

  // 否则使用 CosyVoice 默认音色
  return generateWithCosyVoice(lyrics, dialect, forceProvider)
}

/**
 * 使用 CosyVoice 生成方言语音
 */
async function generateWithCosyVoice(
  lyrics: string,
  dialect: DialectCode,
  forceProvider?: MusicProvider
): Promise<MusicGenerationResult> {
  const client = getCosyVoiceClient()

  if (!client.isConfigured()) {
    throw new Error('CosyVoice API 未配置。请设置 DASHSCOPE_API_KEY 环境变量。')
  }

  // 检查方言是否被 CosyVoice 支持
  if (!isCosyVoiceDialect(dialect)) {
    throw new Error(`CosyVoice 不支持方言: ${dialect}`)
  }

  console.log(`[MusicRouter] 使用 CosyVoice 生成 ${DIALECT_LABELS[dialect]} 语音`)

  try {
    const result: CosyVoiceTTSResult = await client.generate({
      text: lyrics,
      dialect: dialect as CosyVoiceDialect,
      format: 'mp3',
      sampleRate: 22050,
    })

    // 上传音频并获取 URL
    const audioUrl = await client.uploadAudio(
      result.audioBuffer,
      dialect as CosyVoiceDialect,
      'mp3'
    )

    return {
      audioUrl,
      provider: 'cosyvoice',
      duration: result.duration,
      dialect,
      characters: result.characters,
      wordTimestamps: result.wordTimestamps,
    }
  } catch (error) {
    console.error('[MusicRouter] CosyVoice 生成失败:', error)
    throw error
  }
}

/**
 * 使用克隆的用户声音生成语音
 * GPT-SoVITS + CosyVoice 联合方案
 *
 * 1. 如果 GPT-SoVITS 配置了，使用用户克隆声音
 * 2. 否则回退到 CosyVoice 默认音色
 */
async function generateWithClonedVoice(
  lyrics: string,
  dialect: DialectCode,
  voiceId: string
): Promise<MusicGenerationResult> {
  const gptSoVITSClient = getGPTSoVITSClient()

  // 如果 GPT-SoVITS 未配置，回退到 CosyVoice
  if (!gptSoVITSClient.isConfigured()) {
    console.warn('[MusicRouter] GPT-SoVITS 未配置，回退到 CosyVoice 默认音色')
    return generateWithCosyVoice(lyrics, dialect)
  }

  console.log(`[MusicRouter] 使用 GPT-SoVITS 克隆音色: ${voiceId}`)

  try {
    const result = await gptSoVITSClient.synthesize({
      text: lyrics,
      voiceId,
      format: 'mp3',
    })

    // 上传音频并获取 URL
    const audioUrl = await gptSoVITSClient.uploadAudioToStorage(
      result.audioBuffer,
      voiceId,
      'mp3'
    )

    return {
      audioUrl,
      provider: 'gpt_sovits',
      duration: result.duration,
      dialect,
      wordTimestamps: undefined, // GPT-SoVITS 暂不支持字级别时间戳
    }
  } catch (error) {
    console.error('[MusicRouter] GPT-SoVITS 生成失败，回退到 CosyVoice:', error)
    // 回退到 CosyVoice
    return generateWithCosyVoice(lyrics, dialect)
  }
}

// ============================================================================
// 声音克隆功能
// ============================================================================

/**
 * 启动声音克隆
 * 用户录音 -> 训练模型 -> 获取 voiceId
 *
 * @param params 克隆参数
 * @returns 克隆任务信息
 */
export async function startVoiceCloning(params: VoiceCloningParams): Promise<VoiceCloningStatusResult> {
  const client = getGPTSoVITSClient()

  if (!client.isConfigured()) {
    throw new Error('GPT-SoVITS API 未配置。请设置 GPT_SOVITS_API_URL 环境变量。')
  }

  console.log(`[MusicRouter] 启动声音克隆，用户: ${params.userId}`)

  const request: VoiceCloningRequest = {
    audioData: params.audioData,
    audioUrl: params.audioUrl,
    userId: params.userId,
    voiceName: params.voiceName,
  }

  const result = await client.cloneVoice(request)

  return {
    taskId: result.taskId,
    status: result.status,
    voiceId: result.voiceId,
    progress: result.progress,
    error: result.error,
  }
}

/**
 * 查询声音克隆状态
 *
 * @param taskId 任务 ID
 * @returns 克隆状态
 */
export async function getVoiceCloningStatus(taskId: string): Promise<VoiceCloningStatusResult> {
  const client = getGPTSoVITSClient()

  if (!client.isConfigured()) {
    throw new Error('GPT-SoVITS API 未配置')
  }

  const result = await client.getCloningStatus(taskId)

  return {
    taskId: result.taskId,
    status: result.status,
    voiceId: result.voiceId,
    progress: result.progress,
    error: result.error,
  }
}

// ============================================================================
// 辅助功能
// ============================================================================

/**
 * 获取支持的方言列表
 */
export function getSupportedDialects(): DialectCode[] {
  return [...MVP_DIALECTS]
}

/**
 * 检查方言是否支持
 */
export function isDialectSupported(dialect: DialectCode): boolean {
  return MVP_DIALECTS.includes(dialect as typeof MVP_DIALECTS[number])
}

/**
 * 获取方言的推荐服务
 */
export function getRecommendedProvider(_dialect: DialectCode): MusicProvider {
  // MVP 阶段统一使用 CosyVoice
  return 'cosyvoice'
}

/**
 * 获取所有可用的提供商
 */
export function getAvailableProviders(): MusicProvider[] {
  const providers: MusicProvider[] = []

  const cosyVoiceClient = getCosyVoiceClient()
  if (cosyVoiceClient.isConfigured()) {
    providers.push('cosyvoice')
  }

  const gptSoVITSClient = getGPTSoVITSClient()
  if (gptSoVITSClient.isConfigured()) {
    providers.push('gpt_sovits')
  }

  return providers
}

/**
 * 检查系统是否可用
 */
export function isSystemAvailable(): boolean {
  const cosyVoiceClient = getCosyVoiceClient()
  return cosyVoiceClient.isConfigured()
}

/**
 * 获取系统状态
 */
export function getSystemStatus(): {
  available: boolean
  providers: MusicProvider[]
  dialects: DialectCode[]
  voiceCloningEnabled: boolean
} {
  const cosyVoiceClient = getCosyVoiceClient()
  const gptSoVITSClient = getGPTSoVITSClient()

  return {
    available: cosyVoiceClient.isConfigured(),
    providers: getAvailableProviders(),
    dialects: getSupportedDialects(),
    voiceCloningEnabled: gptSoVITSClient.isConfigured(),
  }
}

// ============================================================================
// 向后兼容（保留旧 API 签名，但标记为废弃）
// ============================================================================

/**
 * @deprecated 使用 generateMusic 代替
 */
export async function generateWithSuno(
  _lyrics: string,
  _dialect: DialectCode,
  _style: MusicStyle
): Promise<MusicGenerationResult> {
  throw new Error('Suno API 已被移除。请使用 CosyVoice + GPT-SoVITS 方案。')
}

/**
 * @deprecated 使用 generateMusic 代替
 */
export async function generateWithMiniMax(
  _lyrics: string,
  _dialect: DialectCode,
  _style: MusicStyle,
  _duration?: number
): Promise<MusicGenerationResult> {
  throw new Error('MiniMax API 已被移除。请使用 CosyVoice + GPT-SoVITS 方案。')
}

/**
 * @deprecated 使用 generateMusic 代替
 */
export async function generateWithFishAudio(
  _lyrics: string,
  _dialect: DialectCode,
  _style: MusicStyle,
  _duration?: number
): Promise<MusicGenerationResult> {
  throw new Error('Fish Audio API 已被移除。请使用 CosyVoice + GPT-SoVITS 方案。')
}
