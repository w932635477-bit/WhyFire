/**
 * 音乐生成路由层
 * 支持多 API 智能路由
 *
 * 策略（优先级从高到低）：
 * 1. Suno API - 真正的音乐生成（支持所有方言/语言）✅ 推荐
 * 2. MiniMax API - 普通话/粤语/英语音乐生成
 * 3. Fish Audio TTS - 方言语音合成（降级方案）
 */

import { getMiniMaxClient } from '@/lib/minimax/client'
import { getFishAudioClient } from '@/lib/tts'
import { getSunoClient } from '@/lib/music/suno-client'
import type { DialectCode } from '@/types/dialect'
import { DIALECT_CONFIGS } from '@/types/dialect'

/**
 * 音乐风格
 */
export type MusicStyle = 'rap' | 'pop' | 'electronic' | 'rock' | 'chill'

/**
 * 音乐提供商标识
 */
export type MusicProvider = 'suno' | 'minimax' | 'fish_audio'

/**
 * 音乐生成参数
 */
export interface MusicGenerationParams {
  lyrics: string
  dialect: DialectCode
  style: MusicStyle
  duration?: number
  voiceId?: string
  /** 强制使用指定提供商 */
  forceProvider?: MusicProvider
}

/**
 * 音乐生成结果
 */
export interface MusicGenerationResult {
  audioUrl: string
  provider: MusicProvider
  duration?: number
  dialect: DialectCode
  taskId?: string
}

/**
 * 使用 MiniMax 支持的方言
 */
const MINIMAX_DIALECTS: DialectCode[] = ['mandarin', 'cantonese', 'english']

/**
 * 方言名称映射
 */
export const DIALECT_LABELS: Record<DialectCode, string> = Object.fromEntries(
  Object.entries(DIALECT_CONFIGS).map(([code, config]) => [code, config.name])
) as Record<DialectCode, string>

// 兼容旧类型
export type DialectType = DialectCode

/**
 * 生成音乐
 * 自动选择最佳 API
 */
export async function generateMusic(params: MusicGenerationParams): Promise<MusicGenerationResult> {
  const { lyrics, dialect, style, duration, forceProvider } = params

  console.log(`[MusicRouter] 方言: ${dialect}, 风格: ${style}, 强制: ${forceProvider || '自动'}`)

  // 如果指定了提供商，直接使用
  if (forceProvider) {
    return generateWithProvider(lyrics, dialect, style, duration, forceProvider)
  }

  // 自动选择最佳提供商
  const provider = selectBestProvider(dialect, style)
  console.log(`[MusicRouter] 选择提供商: ${provider}`)

  return generateWithProvider(lyrics, dialect, style, duration, provider)
}

/**
 * 选择最佳提供商
 */
function selectBestProvider(dialect: DialectCode, style: MusicStyle): MusicProvider {
  const sunoClient = getSunoClient()

  // Suno 是最佳选择（真正的音乐生成）
  if (sunoClient.isConfigured()) {
    return 'suno'
  }

  // MiniMax 适合普通话/粤语/英语
  if (MINIMAX_DIALECTS.includes(dialect)) {
    return 'minimax'
  }

  // 其他方言使用 Fish Audio TTS
  return 'fish_audio'
}

/**
 * 使用指定提供商生成
 */
async function generateWithProvider(
  lyrics: string,
  dialect: DialectCode,
  style: MusicStyle,
  duration: number | undefined,
  provider: MusicProvider
): Promise<MusicGenerationResult> {
  switch (provider) {
    case 'suno':
      return generateWithSuno(lyrics, dialect, style)

    case 'minimax':
      return generateWithMiniMax(lyrics, dialect, style, duration)

    case 'fish_audio':
      return generateWithFishAudio(lyrics, dialect, style, duration)

    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * 使用 Suno 生成（真正的音乐生成）✅ 推荐
 */
async function generateWithSuno(
  lyrics: string,
  dialect: DialectCode,
  style: MusicStyle
): Promise<MusicGenerationResult> {
  const client = getSunoClient()

  if (!client.isConfigured()) {
    throw new Error('Suno API 未配置。请设置 SUNO_API_KEY 环境变量。')
  }

  console.log(`[MusicRouter] 使用 Suno 生成音乐`)

  const result = await client.generate({
    lyrics,
    dialect,
    style,
    model: 'suno-v4.5-beta', // 推荐模型
  })

  return {
    audioUrl: result.audioUrl!,
    provider: 'suno',
    duration: result.duration,
    dialect,
    taskId: result.taskId,
  }
}

/**
 * 使用 MiniMax 生成（支持音乐生成）
 */
async function generateWithMiniMax(
  lyrics: string,
  dialect: DialectCode,
  style: MusicStyle,
  duration?: number
): Promise<MusicGenerationResult> {
  const client = getMiniMaxClient()

  const audioUrl = await client.generateMusic({
    lyrics,
    dialect: dialect as 'mandarin' | 'cantonese' | 'english',
    style,
    duration: duration || 30,
  })

  return {
    audioUrl,
    provider: 'minimax',
    duration,
    dialect,
  }
}

/**
 * 使用 Fish Audio 生成方言语音
 * 降级方案：TTS + 背景音乐
 */
async function generateWithFishAudio(
  lyrics: string,
  dialect: DialectCode,
  _style: MusicStyle,
  _duration?: number
): Promise<MusicGenerationResult> {
  const client = getFishAudioClient()

  if (!client.isConfigured()) {
    throw new Error(`Fish Audio API 未配置，无法生成 ${DIALECT_LABELS[dialect]} 语音。请设置 FISH_AUDIO_API_KEY 环境变量。`)
  }

  console.log(`[MusicRouter] 使用 Fish Audio TTS（降级方案）`)

  const result = await client.generate({
    text: lyrics,
    dialect,
    speed: 1.0,
    format: 'mp3',
  })

  return {
    audioUrl: result.audioUrl,
    provider: 'fish_audio',
    duration: result.duration,
    dialect,
  }
}

/**
 * 获取支持的方言列表
 */
export function getSupportedDialects(): DialectCode[] {
  return Object.keys(DIALECT_CONFIGS) as DialectCode[]
}

/**
 * 检查方言是否支持
 */
export function isDialectSupported(dialect: DialectCode): boolean {
  return dialect in DIALECT_CONFIGS
}

/**
 * 获取方言的推荐服务
 */
export function getRecommendedProvider(dialect: DialectCode): MusicProvider {
  return selectBestProvider(dialect, 'rap')
}

/**
 * 获取所有可用的提供商
 */
export function getAvailableProviders(): MusicProvider[] {
  const providers: MusicProvider[] = []

  const sunoClient = getSunoClient()
  if (sunoClient.isConfigured()) {
    providers.push('suno')
  }

  // MiniMax 通常已配置
  providers.push('minimax')

  const fishClient = getFishAudioClient()
  if (fishClient.isConfigured()) {
    providers.push('fish_audio')
  }

  return providers
}
