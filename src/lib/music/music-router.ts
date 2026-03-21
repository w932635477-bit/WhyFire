/**
 * 音乐生成路由层
 * 支持方言 TTS + 背景音乐生成
 *
 * 策略：
 * - 普通话/粤语/英语: 使用 MiniMax API（音乐生成能力强）
 * - 其他方言: 使用 Fish Audio TTS + 背景音乐
 */

import { getMiniMaxClient } from '@/lib/minimax/client'
import { getFishAudioClient } from '@/lib/tts'
import type { DialectCode } from '@/types/dialect'
import { DIALECT_CONFIGS } from '@/types/dialect'

/**
 * 音乐风格
 */
export type MusicStyle = 'rap' | 'pop' | 'electronic' | 'rock' | 'chill'

/**
 * 音乐生成参数
 */
export interface MusicGenerationParams {
  lyrics: string
  dialect: DialectCode
  style: MusicStyle
  duration?: number
  voiceId?: string
}

/**
 * 音乐生成结果
 */
export interface MusicGenerationResult {
  audioUrl: string
  provider: 'minimax' | 'fish_audio'
  duration?: number
  dialect: DialectCode
}

/**
 * 使用 MiniMax 支持的方言
 */
const MINIMAX_DIALECTS: DialectCode[] = ['mandarin', 'cantonese', 'english']

/**
 * 方言名称映射（兼容旧代码）
 */
export const DIALECT_LABELS: Record<DialectCode, string> = Object.fromEntries(
  Object.entries(DIALECT_CONFIGS).map(([code, config]) => [code, config.name])
) as Record<DialectCode, string>

// 兼容旧类型
export type DialectType = DialectCode

/**
 * 生成音乐
 */
export async function generateMusic(params: MusicGenerationParams): Promise<MusicGenerationResult> {
  const { lyrics, dialect, style, duration } = params

  console.log(`[MusicRouter] 方言: ${dialect}, 风格: ${style}`)

  // 判断使用哪个服务
  if (MINIMAX_DIALECTS.includes(dialect)) {
    return generateWithMiniMax(lyrics, dialect, style, duration)
  } else {
    return generateWithFishAudio(lyrics, dialect, style, duration)
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
 * TODO: 添加背景音乐混音
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
export function getRecommendedProvider(dialect: DialectCode): 'minimax' | 'fish_audio' {
  return MINIMAX_DIALECTS.includes(dialect) ? 'minimax' : 'fish_audio'
}
