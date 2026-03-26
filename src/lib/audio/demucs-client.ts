/**
 * Demucs 人声分离客户端
 *
 * 自托管服务，用于分离 Suno 生成的 Rap 中的人声和伴奏
 *
 * 部署文档: docs/self-hosted-deployment.md
 *
 * 代理配置: 由 src/lib/proxy.ts 统一管理
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Demucs 模型类型
 */
export type DemucsModel =
  | 'htdemucs'      // 默认模型，效果好
  | 'htdemucs_ft'   // 更快，效果略差
  | 'mdx'           // 音乐分离专用
  | 'mdx_extra'     // MDX 扩展版

/**
 * 人声分离请求
 */
export interface SeparationRequest {
  /** 输入音频 URL */
  audioUrl: string
  /** Demucs 模型 */
  model?: DemucsModel
  /** 输出格式 */
  outputFormat?: 'wav' | 'mp3' | 'flac'
}

/**
 * 分离结果
 */
export interface SeparationResult {
  /** 任务 ID */
  taskId: string
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** 人声 URL */
  vocals?: string
  /** 伴奏 URL */
  accompaniment?: string
  /** 鼓声 URL（如果使用多轨分离） */
  drums?: string
  /** 贝斯 URL */
  bass?: string
  /** 其他 URL */
  other?: string
  /** 音频时长（秒） */
  duration?: number
  /** 错误信息 */
  error?: string
}

// ============================================================================
// Demucs 客户端
// ============================================================================

/**
 * Demucs API 客户端
 */
export class DemucsClient {
  private apiUrl: string
  private timeout: number

  constructor() {
    this.apiUrl = process.env.DEMUCS_API_URL || 'http://localhost:8002'
    this.timeout = 240000 // 4 分钟超时（Demucs 需要较长时间）
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
   * 人声分离（双轨：人声 + 伴奏）
   *
   * @param request 分离参数
   * @returns 分离结果
   *
   * @example
   * ```ts
   * const client = new DemucsClient()
   * const result = await client.separate({
   *   audioUrl: 'https://suno.ai/generated-rap.mp3',
   *   model: 'htdemucs',
   * })
   *
   * console.log('人声:', result.vocals)
   * console.log('伴奏:', result.accompaniment)
   * ```
   */
  async separate(request: SeparationRequest): Promise<SeparationResult> {
    const { audioUrl, model = 'htdemucs', outputFormat = 'wav' } = request

    console.log(`[Demucs] Separating audio, model: ${model}, url: ${audioUrl}`)

    try {
      // 下载音频文件
      const audioResponse = await fetch(audioUrl, {
        signal: AbortSignal.timeout(60000), // 60 秒超时
      })
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.status}`)
      }

      const audioBuffer = await audioResponse.arrayBuffer()

      // 创建 FormData
      const formData = new FormData()
      formData.append('audio_file', new Blob([audioBuffer]), 'input.wav')
      formData.append('model', model)

      // 调用 Demucs API
      const response = await fetch(`${this.apiUrl}/api/v1/separate`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Demucs API error: ${response.status} - ${error}`)
      }

      const data = await response.json()

      // 将相对路径转换为完整 URL
      const toFullUrl = (path: string | undefined): string | undefined => {
        if (!path) return undefined
        if (path.startsWith('http')) return path
        return `${this.apiUrl}${path}`
      }

      return {
        taskId: data.task_id,
        status: data.status,
        vocals: toFullUrl(data.vocals),
        accompaniment: toFullUrl(data.accompaniment),
        duration: data.duration,
        error: data.error,
      }
    } catch (error) {
      console.error('[Demucs] Separation failed:', error)
      throw error
    }
  }

  /**
   * 获取任务状态
   *
   * 注意：当前实现是同步的，此方法仅用于兼容测试
   * 实际任务在 separate() 调用时已完成
   *
   * @param taskId 任务 ID
   * @returns 任务状态
   */
  async getStatus(taskId: string): Promise<SeparationResult> {
    // Demucs API 是同步的，任务在 separate() 调用时已完成
    // 这里返回一个模拟的已完成状态
    return {
      taskId,
      status: 'completed',
      vocals: `${this.apiUrl}/output/${taskId}/vocals.wav`,
      accompaniment: `${this.apiUrl}/output/${taskId}/accompaniment.wav`,
    }
  }

  /**
   * 下载分离后的音轨
   *
   * @param taskId 任务 ID
   * @param stem 音轨类型
   * @returns 音频 Buffer
   */
  async downloadStem(
    taskId: string,
    stem: 'vocals' | 'accompaniment' | 'drums' | 'bass' | 'other'
  ): Promise<Buffer> {
    const response = await fetch(`${this.apiUrl}/api/v1/download/${taskId}/${stem}`, {
      method: 'GET',
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      throw new Error(`Failed to download stem: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * 分离音频并返回 Buffer（便捷方法）
   *
   * @param audioUrl 音频 URL
   * @param model 模型类型
   * @returns 人声和伴奏的 Buffer
   */
  async separateToBuffer(
    audioUrl: string,
    model: DemucsModel = 'htdemucs'
  ): Promise<{
    vocals: Buffer
    accompaniment: Buffer
    duration: number
  }> {
    const result = await this.separate({ audioUrl, model })

    if (!result.vocals || !result.accompaniment) {
      throw new Error('Separation failed: missing stems')
    }

    const [vocalsBuffer, accompanimentBuffer] = await Promise.all([
      this.downloadStem(result.taskId, 'vocals'),
      this.downloadStem(result.taskId, 'accompaniment'),
    ])

    return {
      vocals: vocalsBuffer,
      accompaniment: accompanimentBuffer,
      duration: result.duration || 0,
    }
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let clientInstance: DemucsClient | null = null

/**
 * 获取 Demucs 客户端实例
 */
export function getDemucsClient(): DemucsClient {
  if (!clientInstance) {
    clientInstance = new DemucsClient()
  }
  return clientInstance
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 调用 Demucs 服务（便捷函数）
 */
export async function callDemucsService(request: SeparationRequest): Promise<SeparationResult> {
  const client = getDemucsClient()

  // 检查服务可用性
  const available = await client.isAvailable()
  if (!available) {
    throw new Error('Demucs service is not available. Please check the self-hosted server.')
  }

  return client.separate(request)
}
