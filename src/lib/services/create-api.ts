/**
 * 创作流程 API 服务层
 * 封装所有创作相关的 API 调用
 */

// 类型定义
export type SceneType = 'product' | 'funny' | 'ip' | 'vlog'
export type DialectCode = 'mandarin' | 'cantonese' | 'sichuan' | 'dongbei' | 'shandong' | 'shanghai' | 'henan' | 'hunan' | 'fujian' | 'jiangsu' | 'zhejiang' | 'anhui' | 'jiangxi' | 'hubei' | 'guangxi' | 'hainan' | 'sichaun' | 'chongqing'
export type MusicStyle = 'rap' | 'pop' | 'electronic' | 'rock' | 'chill'

// API 响应类型
export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

// 歌词生成请求
export interface LyricsGenerateRequest {
  scene: SceneType
  dialect: DialectCode
  selfDescription?: string
  selectedTopics?: string[]
  selectedMemes?: string[]
  timeOptions?: {
    includeFestival?: boolean
    includeTrending?: boolean
    includeMemes?: boolean
  }
}

// 歌词生成响应
export interface LyricsGenerateResponse {
  lyricsId: string
  content: string
  wordCount: number
  estimatedDuration: number
  meta: {
    festival?: { id: string; name: string }
    trendingTopics?: string[]
    memes?: string[]
  }
}

// Rap 增强预设类型
export type RapPresetCode = 'subtle' | 'balanced' | 'energetic' | 'aggressive' | 'melodic'

// 音乐生成请求
export interface MusicGenerateRequest {
  lyrics: string
  dialect: DialectCode
  style?: MusicStyle
  duration?: number
  voiceId?: string
  bgmId?: string  // D-Lite BGM ID (beat-1 to beat-6)
  rapPreset?: RapPresetCode  // Rap 增强预设
  enableRapEnhance?: boolean  // 是否启用 Rap 增强，默认 true
}

// 音乐生成响应
export interface MusicGenerateResponse {
  taskId: string
  status: 'completed' | 'failed' | 'processing'
  audioUrl?: string
  duration?: number
  provider?: string
  dialect?: string
  wordTimestamps?: Array<{
    text: string
    beginTime: number
    endTime: number
  }>
}

// 音色克隆请求
export interface VoiceCloneRequest {
  audioFile: File | Blob
  dialect: DialectCode
}

// 音色克隆响应
export interface VoiceCloneResponse {
  voiceId: string
  status: 'completed' | 'failed' | 'processing'
  message?: string
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 通用请求方法
 */
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders: HeadersInit = {}

  // 如果不是 FormData，添加 JSON Content-Type
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  const result: ApiResponse<T> = await response.json()

  if (result.code !== 0) {
    throw new ApiError(result.code, result.message || '请求失败', result.data)
  }

  return result.data
}

/**
 * 歌词生成 API
 */
export async function generateLyrics(
  params: LyricsGenerateRequest
): Promise<LyricsGenerateResponse> {
  // 转换为 V2 API 格式
  const requestBody = {
    scene: params.scene,
    dialect: params.dialect,
    funnyInfo: {
      theme: params.selfDescription || '',
      keywords: params.selectedMemes || [],
    },
    timeOptions: params.timeOptions || {
      includeFestival: true,
      includeTrending: true,
      includeMemes: true,
    },
  }

  return request<LyricsGenerateResponse>('/api/lyrics/generate-v2', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  })
}

/**
 * UI Beat ID 到 BGM Library ID 的映射
 */
const BEAT_TO_BGM_MAP: Record<string, string> = {
  'beat-1': 'fortune-flow',      // 八方来财
  'beat-2': 'karma-dark',        // 因果
  'beat-3': 'apt-remix',         // APT.
  'beat-4': 'brazilian-phonk',   // BRAZIL
  'beat-5': 'warm-gray',         // 暖灰
  'beat-6': 'wonderful-01',      // 精彩01
}

/**
 * 转换 UI Beat ID 为 BGM Library ID
 */
function convertToBgmId(beatId: string | undefined): string | undefined {
  if (!beatId) return undefined
  // 如果已经是 bgm-library 格式，直接返回
  if (!beatId.startsWith('beat-')) return beatId
  return BEAT_TO_BGM_MAP[beatId]
}

/**
 * 音乐生成 API (Suno + RVC 方案)
 */
export async function generateMusic(
  params: MusicGenerateRequest
): Promise<MusicGenerateResponse> {
  // 转换 bgmId（UI beat-1~6 → bgm-library ID）
  const bgmId = convertToBgmId(params.bgmId)

  // 使用 Suno + Seed-VC 生成 API
  const response = await fetch('/api/rap/generate-v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'web-user',  // 默认用户 ID
      userDescription: '',  // 用户描述（可选）
      lyrics: params.lyrics,
      dialect: params.dialect,
      bgmId: bgmId,
      referenceAudioId: params.voiceId,  // Seed-VC 零样本克隆使用参考音频 ID
    }),
  })

  const result = await response.json()

  if (result.code !== 0) {
    throw new ApiError(result.code, result.message || '生成失败')
  }

  // 转换 V2 API 响应格式为标准格式
  return {
    taskId: result.data.taskId,
    status: result.data.status,
    audioUrl: result.data.audioUrl,
    duration: result.data.duration,
    provider: 'suno-rvc',
    dialect: result.data.dialect,
    wordTimestamps: undefined,
  }
}

/**
 * 音色克隆 API
 */
export async function cloneVoice(
  params: VoiceCloneRequest
): Promise<VoiceCloneResponse> {
  const formData = new FormData()
  formData.append('audio', params.audioFile)
  formData.append('dialect', params.dialect)

  return request<VoiceCloneResponse>('/api/voice/clone', {
    method: 'POST',
    body: formData,
  })
}

/**
 * 获取支持的方言列表
 */
export async function getSupportedDialects() {
  const response = await fetch('/api/music/generate')
  const result = await response.json()
  return result.data?.dialects || []
}

/**
 * 获取可用的音乐风格
 */
export async function getAvailableStyles(): Promise<string[]> {
  const response = await fetch('/api/music/generate')
  const result = await response.json()
  return result.data?.styles || ['rap', 'pop', 'electronic', 'rock', 'chill']
}

/**
 * 重试包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // 如果是客户端错误（4xx），不重试
      if (error instanceof ApiError && error.code >= 400 && error.code < 500) {
        throw error
      }

      // 最后一次尝试不等待
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)))
      }
    }
  }

  throw lastError
}

/**
 * 轮询任务状态
 */
export async function pollTaskStatus<T>(
  taskId: string,
  statusUrl: string,
  options: {
    intervalMs?: number
    timeoutMs?: number
    onComplete?: (result: T) => void
    onProgress?: (progress: number) => void
  } = {}
): Promise<T> {
  const { intervalMs = 2000, timeoutMs = 180000 } = options
  const startTime = Date.now()

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      throw new ApiError(408, '任务超时')
    }

    const response = await fetch(`${statusUrl}?taskId=${taskId}`)
    const result = await response.json()

    if (result.code !== 0) {
      throw new ApiError(result.code, result.message)
    }

    const { status } = result.data

    if (status === 'completed') {
      options.onComplete?.(result.data)
      return result.data
    }

    if (status === 'failed') {
      throw new ApiError(500, result.data.message || '任务失败')
    }

    // 报告进度（如果 API 返回了进度）
    if (result.data.progress) {
      options.onProgress?.(result.data.progress)
    }

    // 等待下一次轮询
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}
