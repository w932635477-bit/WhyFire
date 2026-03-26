/**
 * RVC (Retrieval-based Voice Conversion) 客户端
 *
 * 支持多种后端:
 * - mock: 本地 Mock 服务（测试用）
 * - self-hosted: 自托管 RVC 服务
 * - replicate: Replicate 云端 API
 *
 * 部署文档: docs/self-hosted-deployment.md
 */

import { ProxyAgent } from 'undici'

// ============================================================================
// 代理配置
// ============================================================================

function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                   process.env.HTTP_PROXY || process.env.http_proxy ||
                   process.env.ALL_PROXY || process.env.all_proxy
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl)
  }
  return undefined
}

// ============================================================================
// RVC 后端类型
// ============================================================================

export type RVCBackend = 'mock' | 'self-hosted' | 'replicate'

export function getRVCBackend(): RVCBackend {
  const backend = process.env.RVC_BACKEND as RVCBackend
  if (backend && ['mock', 'self-hosted', 'replicate'].includes(backend)) {
    return backend
  }
  // 默认使用 mock（开发测试）
  return 'mock'
}

// ============================================================================
// RVC 客户端接口
// ============================================================================

/**
 * RVC 客户端接口（所有后端必须实现）
 */
export interface IRVCClient {
  /**
   * 检查服务是否可用
   */
  isAvailable(): Promise<boolean>

  /**
   * 音色转换
   */
  convert(request: RVCCOnversionRequest): Promise<RVCConversionResult>

  /**
   * 训练用户声音模型
   */
  trainModel(request: RVCTrainingRequest): Promise<RVCTrainingResult>

  /**
   * 获取训练状态
   */
  getTrainingStatus(taskId: string): Promise<RVCTrainingResult>

  /**
   * 获取可用模型列表
   */
  listModels(): Promise<RVCModelInfo[]>

  /**
   * 删除模型
   */
  deleteModel(modelName: string): Promise<void>
}

// ============================================================================
// 类型定义
// ============================================================================

/**
 * F0 提取方法
 */
export type F0Method = 'crepe' | 'pm' | 'harvest' | 'dio' | 'pip'

/**
 * 音色转换请求
 */
export interface RVCCOnversionRequest {
  /** 输入音频路径或 URL */
  inputAudio: string
  /** 用户 RVC 模型名称 */
  voiceModel: string
  /** F0 提取方法 */
  f0Method?: F0Method
  /** 音高偏移（半音） */
  f0UpKey?: number
  /** 索引比率 */
  indexRate?: number
  /** 过滤半径 */
  filterRadius?: number
  /** RMS 混合比率 */
  rmsMixRate?: number
  /** 保护清音 */
  protect?: number
}

/**
 * 音色转换结果
 */
export interface RVCConversionResult {
  /** 任务 ID */
  taskId: string
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** 输出音频路径 */
  outputAudio?: string
  /** 音频时长（秒） */
  duration?: number
  /** 错误信息 */
  error?: string
}

/**
 * 声音训练请求
 */
export interface RVCTrainingRequest {
  /** 训练音频 URL */
  audioUrl: string
  /** 模型名称 */
  modelName: string
  /** 训练轮数 */
  epochs?: number
  /** 批量大小 */
  batchSize?: number
}

/**
 * 训练结果
 */
export interface RVCTrainingResult {
  /** 任务 ID */
  taskId: string
  /** 状态 */
  status: 'pending' | 'training' | 'completed' | 'failed'
  /** 模型名称 */
  modelName?: string
  /** 进度 (0-100) */
  progress?: number
  /** 错误信息 */
  error?: string
}

/**
 * 模型信息
 */
export interface RVCModelInfo {
  /** 模型名称 */
  name: string
  /** 模型路径 */
  path: string
  /** 创建时间 */
  createdAt?: Date
  /** 文件大小 */
  size?: number
}

// ============================================================================
// RVC 本地客户端（Mock / Self-hosted）
// ============================================================================

/**
 * RVC 本地客户端（用于 Mock 服务或自托管服务）
 */
export class RVCLocalClient implements IRVCClient {
  private apiUrl: string
  private timeout: number

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || process.env.RVC_API_URL || 'http://localhost:8001'
    this.timeout = 180000 // 3 分钟超时
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 音色转换
   *
   * @param request 转换参数
   * @returns 转换结果
   *
   * @example
   * ```ts
   * const client = new RVCClient()
   * const result = await client.convert({
   *   inputAudio: 'https://suno.ai/generated-rap.mp3',
   *   voiceModel: 'user_voice_001',
   *   f0Method: 'crepe',
   * })
   * ```
   */
  async convert(request: RVCCOnversionRequest): Promise<RVCConversionResult> {
    const {
      inputAudio,
      voiceModel,
      f0Method = 'crepe',
      f0UpKey = 0,
      indexRate = 0.5,
      filterRadius = 3,
      rmsMixRate = 0.25,
      protect = 0.33,
    } = request

    console.log(`[RVC] Converting voice, model: ${voiceModel}, method: ${f0Method}`)

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_audio: inputAudio,
          voice_model: voiceModel,
          f0_method: f0Method,
          f0_up_key: f0UpKey,
          index_rate: indexRate,
          filter_radius: filterRadius,
          rms_mix_rate: rmsMixRate,
          protect: protect,
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`RVC API error: ${response.status} - ${error}`)
      }

      const data = await response.json()

      return {
        taskId: data.task_id,
        status: data.status,
        outputAudio: data.output_audio,
        duration: data.duration,
        error: data.error,
      }
    } catch (error) {
      console.error('[RVC] Conversion failed:', error)
      throw error
    }
  }

  /**
   * 训练用户声音模型
   *
   * @param request 训练参数
   * @returns 训练任务信息
   */
  async trainModel(request: RVCTrainingRequest): Promise<RVCTrainingResult> {
    const { audioUrl, modelName, epochs = 100, batchSize = 8 } = request

    console.log(`[RVC] Starting training, model: ${modelName}, epochs: ${epochs}`)

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          model_name: modelName,
          epochs,
          batch_size: batchSize,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`RVC training failed: ${response.status} - ${error}`)
      }

      const data = await response.json()

      return {
        taskId: data.task_id,
        status: data.status,
        modelName: data.model_name,
        progress: data.progress,
        error: data.error,
      }
    } catch (error) {
      console.error('[RVC] Training failed:', error)
      throw error
    }
  }

  /**
   * 获取训练状态
   *
   * @param taskId 训练任务 ID
   * @returns 训练状态
   */
  async getTrainingStatus(taskId: string): Promise<RVCTrainingResult> {
    const response = await fetch(`${this.apiUrl}/api/v1/train/${taskId}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Failed to get training status: ${response.status}`)
    }

    const data = await response.json()

    return {
      taskId: data.task_id,
      status: data.status,
      modelName: data.model_name,
      progress: data.progress,
      error: data.error,
    }
  }

  /**
   * 获取可用模型列表
   *
   * @returns 模型列表
   */
  async listModels(): Promise<RVCModelInfo[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`)
      }

      const data = await response.json()

      return data.models.map((m: Record<string, unknown>) => ({
        name: m.name as string,
        path: m.path as string,
        createdAt: m.created_at ? new Date(m.created_at as string) : undefined,
        size: m.size as number | undefined,
      }))
    } catch (error) {
      console.error('[RVC] Failed to list models:', error)
      return []
    }
  }

  /**
   * 删除模型
   *
   * @param modelName 模型名称
   */
  async deleteModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/v1/models/${modelName}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete model: ${response.status}`)
    }

    console.log(`[RVC] Model deleted: ${modelName}`)
  }
}

// ============================================================================
// RVC Replicate 客户端
// ============================================================================

/**
 * RVC Replicate 云端客户端
 */
export class RVCReplicateClient implements IRVCClient {
  private apiUrl: string = 'https://api.replicate.com/v1'
  private apiToken: string
  private modelVersion: string

  constructor() {
    this.apiToken = process.env.REPLICATE_API_TOKEN || ''
    this.modelVersion = process.env.RVC_REPLICATE_VERSION || ''
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.apiToken && this.modelVersion)
  }

  async convert(request: RVCCOnversionRequest): Promise<RVCConversionResult> {
    if (!this.apiToken) {
      throw new Error('REPLICATE_API_TOKEN is not configured')
    }

    console.log(`[RVC-Replicate] Converting voice, model: ${request.voiceModel}`)

    try {
      const response = await fetch(`${this.apiUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: this.modelVersion,
          input: {
            audio: request.inputAudio,
            model: request.voiceModel,
            f0_method: request.f0Method || 'crepe',
            f0_up_key: request.f0UpKey || 0,
          },
        }),
        signal: AbortSignal.timeout(180000),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Replicate API error: ${response.status} - ${error}`)
      }

      const data = await response.json()

      // Poll for completion
      return await this.pollForResult(data.id)
    } catch (error) {
      console.error('[RVC-Replicate] Conversion failed:', error)
      throw error
    }
  }

  private async pollForResult(predictionId: string): Promise<RVCConversionResult> {
    const maxAttempts = 60
    const delayMs = 3000

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${this.apiUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.apiToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to poll prediction: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'succeeded') {
        return {
          taskId: predictionId,
          status: 'completed',
          outputAudio: Array.isArray(data.output) ? data.output[0] : data.output,
          duration: data.metrics?.predict_time || 0,
        }
      }

      if (data.status === 'failed') {
        return {
          taskId: predictionId,
          status: 'failed',
          error: data.error || 'Unknown error',
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    return {
      taskId: predictionId,
      status: 'failed',
      error: 'Timeout waiting for result',
    }
  }

  async trainModel(request: RVCTrainingRequest): Promise<RVCTrainingResult> {
    // Replicate 使用预训练模型，不支持自定义训练
    console.log('[RVC-Replicate] Training not supported, using pre-trained models')
    return {
      taskId: 'not-supported',
      status: 'failed',
      error: 'Custom training not supported on Replicate. Use pre-trained models or self-hosted RVC.',
    }
  }

  async getTrainingStatus(taskId: string): Promise<RVCTrainingResult> {
    return {
      taskId,
      status: 'failed',
      error: 'Training not supported on Replicate',
    }
  }

  async listModels(): Promise<RVCModelInfo[]> {
    // Replicate 使用预训练模型列表
    return [
      { name: 'default', path: 'replicate:rvc/default' },
    ]
  }

  async deleteModel(modelName: string): Promise<void> {
    console.log(`[RVC-Replicate] Cannot delete model: ${modelName}`)
  }
}

// ============================================================================
// 兼容别名
// ============================================================================

/**
 * @deprecated 使用 RVCLocalClient 代替
 */
export const RVCClient = RVCLocalClient

// ============================================================================
// 单例实例
// ============================================================================

let clientInstance: IRVCClient | null = null

/**
 * 获取 RVC 客户端实例（自动选择后端）
 */
export function getRVCClient(): IRVCClient {
  if (!clientInstance) {
    const backend = getRVCBackend()
    switch (backend) {
      case 'replicate':
        clientInstance = new RVCReplicateClient()
        break
      case 'mock':
      case 'self-hosted':
      default:
        clientInstance = new RVCLocalClient()
        break
    }
  }
  return clientInstance
}

/**
 * 重置客户端实例（用于切换后端）
 */
export function resetRVCClient(): void {
  clientInstance = null
}
