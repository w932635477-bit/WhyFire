/**
 * Seed-VC 零样本声音克隆客户端
 *
 * Seed-VC 是字节跳动开源的零样本语音转换模型：
 * - 无需训练，即时推理
 * - 只需要 1-30 秒参考音频
 * - 支持歌声转换 (SVC) 模式
 *
 * Modal 部署使用异步模式：
 * - POST /convert → 返回 task_id
 * - GET /status?task_id=xxx → 轮询结果
 * - 解决 Modal Web Endpoint 60 秒 HTTP 超时限制
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Seed-VC 转换请求
 */
export interface SeedVCConversionRequest {
  /** Suno 生成的人声 URL (来自 Add Vocals) */
  sourceAudio: string
  /** 用户参考音频 URL (1-30 秒) */
  referenceAudio: string
  /** 是否启用 F0 条件化 (Rap 模式必须为 true) */
  f0Condition?: boolean
  /** 是否使用半精度 */
  fp16?: boolean
  /** 扩散步数 */
  diffusionSteps?: number
  /** 分段长度 */
  chunkLength?: number
}

/**
 * Seed-VC 转换结果
 */
export interface SeedVCConversionResult {
  /** 任务 ID */
  taskId: string
  /** 任务状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** 输出音频 URL */
  outputAudio?: string
  /** 音频时长（秒） */
  duration?: number
  /** 处理时间（毫秒） */
  processingTime?: number
  /** 错误信息 */
  error?: string
}

/**
 * Seed-VC 客户端接口
 */
export interface ISeedVCClient {
  isAvailable(): Promise<boolean>
  convert(request: SeedVCConversionRequest): Promise<SeedVCConversionResult>
  getStatus(taskId: string): Promise<SeedVCConversionResult>
}

/**
 * Seed-VC 后端类型
 */
export type SeedVCBackend = 'mock' | 'modal' | 'autodl'

// ============================================================================
// Mock 客户端（本地测试用）
// ============================================================================

export class SeedVCMockClient implements ISeedVCClient {
  async convert(request: SeedVCConversionRequest): Promise<SeedVCConversionResult> {
    console.log('[SeedVC-Mock] Converting voice (mock mode)')
    const taskId = `mock-${Date.now()}`
    return {
      taskId,
      status: 'completed',
      outputAudio: request.sourceAudio,
      duration: 30,
      processingTime: 100,
    }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  async getStatus(taskId: string): Promise<SeedVCConversionResult> {
    return {
      taskId,
      status: 'completed',
      outputAudio: 'mock://output.mp3',
      duration: 30,
    }
  }
}

// ============================================================================
// Modal 客户端（生产环境用 - 异步模式）
// ============================================================================

export class SeedVCModalClient implements ISeedVCClient {
  private maxPollAttempts = 120  // 最多轮询 120 次
  private pollDelayMs = 3000     // 每 3 秒轮询一次（总计最多 6 分钟）

  async convert(request: SeedVCConversionRequest): Promise<SeedVCConversionResult> {
    console.log('[SeedVC-Modal] Starting async voice conversion')
    console.log(`  Source: ${request.sourceAudio}`)
    console.log(`  Reference: ${request.referenceAudio}`)

    const startTime = Date.now()
    const endpointUrl = process.env.MODAL_WEB_ENDPOINT_URL

    if (!endpointUrl) {
      throw new Error('MODAL_WEB_ENDPOINT_URL not configured')
    }

    try {
      // Step 1: 提交任务（异步 - 立即返回 task_id）
      console.log('[SeedVC-Modal] Submitting task...')
      let submitResponse: Response
      try {
        submitResponse = await fetch(endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_audio_url: request.sourceAudio,
            reference_audio_url: request.referenceAudio,
            f0_condition: request.f0Condition ?? true,
            fp16: request.fp16 ?? true,
            diffusion_steps: request.diffusionSteps ?? 10,
            length_adjust: 1.0,
            inference_cfg_rate: 0.7,
          }),
          signal: AbortSignal.timeout(30000),
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`提交任务失败 (${endpointUrl}): ${msg}`)
      }

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text()
        throw new Error(`提交任务失败: ${submitResponse.status} - ${errorText}`)
      }

      const submitResult = await submitResponse.json()
      const taskId = submitResult.task_id

      if (!taskId) {
        throw new Error(`提交任务返回无效 task_id: ${JSON.stringify(submitResult)}`)
      }

      console.log(`[SeedVC-Modal] Task submitted: ${taskId}, polling for result...`)

      // Step 2: 轮询结果
      const result = await this.pollForResult(taskId, endpointUrl)
      result.processingTime = Date.now() - startTime

      return result
    } catch (error) {
      console.error('[SeedVC-Modal] Conversion failed:', error)
      return {
        taskId: `failed-${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      }
    }
  }

  private async pollForResult(
    taskId: string,
    endpointUrl: string,
  ): Promise<SeedVCConversionResult> {
    // Modal fastapi_endpoint 为每个方法创建独立 URL：
    // convert → ...-convert.modal.run, status → ...-status.modal.run
    const statusUrl = `${endpointUrl.replace(/-convert\.modal\.run/, '-status.modal.run')}?task_id=${taskId}`

    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      await this.delay(this.pollDelayMs)

      try {
        const res = await fetch(statusUrl, {
          signal: AbortSignal.timeout(15000),
        })

        if (!res.ok) {
          console.warn(`[SeedVC-Modal] Status poll ${attempt + 1}: HTTP ${res.status}`)
          continue
        }

        const data = await res.json()

        console.log(`[SeedVC-Modal] Poll ${attempt + 1}: status=${data.status}` +
          (data.duration ? ` duration=${data.duration}s` : '') +
          (data.error ? ` error=${data.error.substring(0, 100)}` : ''))

        if (data.status === 'completed') {
          return {
            taskId: data.task_id || taskId,
            status: 'completed',
            outputAudio: data.output_audio,
            duration: data.duration,
            processingTime: data.processing_time,
          }
        }

        if (data.status === 'failed') {
          return {
            taskId: data.task_id || taskId,
            status: 'failed',
            error: data.error || 'Conversion failed',
          }
        }

        // status === 'processing' → 继续轮询
      } catch (e) {
        console.warn(`[SeedVC-Modal] Status poll ${attempt + 1} error:`, e instanceof Error ? e.message : String(e))
      }
    }

    return {
      taskId,
      status: 'failed',
      error: `轮询超时（${this.maxPollAttempts * this.pollDelayMs / 1000} 秒）`,
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.MODAL_WEB_ENDPOINT_URL
  }

  async getStatus(taskId: string): Promise<SeedVCConversionResult> {
    const endpointUrl = process.env.MODAL_WEB_ENDPOINT_URL
    if (!endpointUrl) {
      return { taskId, status: 'failed', error: 'MODAL_WEB_ENDPOINT_URL not configured' }
    }

    // Modal fastapi_endpoint 为每个方法创建独立 URL
    const statusUrl = `${endpointUrl.replace(/-convert\.modal\.run/, '-status.modal.run')}?task_id=${taskId}`
    try {
      const res = await fetch(statusUrl, {
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json()
      return {
        taskId: data.task_id || taskId,
        status: data.status || 'pending',
        outputAudio: data.output_audio,
        duration: data.duration,
        error: data.error,
      }
    } catch (e) {
      return {
        taskId,
        status: 'failed',
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// AutoDL 客户端（自托管 GPU）
// ============================================================================

export class SeedVCAutoDLClient implements ISeedVCClient {
  private maxPollAttempts = 120
  private pollDelayMs = 3000

  private get baseUrl(): string {
    const url = process.env.SEEDVC_AUTODL_URL
    if (!url) throw new Error('SEEDVC_AUTODL_URL not configured')
    return url.replace(/\/+$/, '')
  }

  async convert(request: SeedVCConversionRequest): Promise<SeedVCConversionResult> {
    console.log('[SeedVC-AutoDL] Starting voice conversion')

    const startTime = Date.now()

    try {
      // Step 1: 提交任务
      const submitResponse = await fetch(`${this.baseUrl}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_audio_url: request.sourceAudio,
          reference_audio_url: request.referenceAudio,
          f0_condition: request.f0Condition ?? true,
          fp16: request.fp16 ?? true,
          diffusion_steps: request.diffusionSteps ?? 10,
          length_adjust: 1.0,
          inference_cfg_rate: 0.7,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text()
        throw new Error(`提交任务失败: ${submitResponse.status} - ${errorText}`)
      }

      const submitResult = await submitResponse.json()
      const taskId = submitResult.task_id

      if (!taskId) {
        throw new Error(`提交任务返回无效 task_id: ${JSON.stringify(submitResult)}`)
      }

      console.log(`[SeedVC-AutoDL] Task submitted: ${taskId}`)

      // Step 2: 轮询结果
      const result = await this.pollForResult(taskId)
      result.processingTime = Date.now() - startTime
      return result
    } catch (error) {
      console.error('[SeedVC-AutoDL] Conversion failed:', error)
      return {
        taskId: `failed-${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      }
    }
  }

  private async pollForResult(taskId: string): Promise<SeedVCConversionResult> {
    const statusUrl = `${this.baseUrl}/status?task_id=${taskId}`

    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      await this.delay(this.pollDelayMs)

      try {
        const res = await fetch(statusUrl, {
          signal: AbortSignal.timeout(15000),
        })

        if (!res.ok) {
          console.warn(`[SeedVC-AutoDL] Poll ${attempt + 1}: HTTP ${res.status}`)
          continue
        }

        const data = await res.json()

        console.log(`[SeedVC-AutoDL] Poll ${attempt + 1}: status=${data.status}` +
          (data.duration ? ` duration=${data.duration}s` : ''))

        if (data.status === 'completed') {
          return {
            taskId: data.task_id || taskId,
            status: 'completed',
            outputAudio: data.output_audio,
            duration: data.duration,
            processingTime: data.processing_time,
          }
        }

        if (data.status === 'failed') {
          return {
            taskId: data.task_id || taskId,
            status: 'failed',
            error: data.error || 'Conversion failed',
          }
        }
      } catch (e) {
        console.warn(`[SeedVC-AutoDL] Poll ${attempt + 1} error:`, e instanceof Error ? e.message : String(e))
      }
    }

    return {
      taskId,
      status: 'failed',
      error: `轮询超时（${this.maxPollAttempts * this.pollDelayMs / 1000} 秒）`,
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(10000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async getStatus(taskId: string): Promise<SeedVCConversionResult> {
    try {
      const res = await fetch(`${this.baseUrl}/status?task_id=${taskId}`, {
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json()
      return {
        taskId: data.task_id || taskId,
        status: data.status || 'pending',
        outputAudio: data.output_audio,
        duration: data.duration,
        error: data.error,
      }
    } catch (e) {
      return {
        taskId,
        status: 'failed',
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

let seedVCClientInstance: ISeedVCClient | null = null

export function getSeedVCClient(): ISeedVCClient {
  if (!seedVCClientInstance) {
    const backend = (process.env.SEEDVC_BACKEND || 'mock') as SeedVCBackend

    switch (backend) {
      case 'modal':
        seedVCClientInstance = new SeedVCModalClient()
        console.log('[SeedVC] Using Modal backend (async mode)')
        break
      case 'autodl':
        seedVCClientInstance = new SeedVCAutoDLClient()
        console.log('[SeedVC] Using AutoDL backend (self-hosted GPU)')
        break
      case 'mock':
      default:
        seedVCClientInstance = new SeedVCMockClient()
        console.log('[SeedVC] Using Mock backend')
        break
    }
  }

  return seedVCClientInstance
}

export function getSeedVCBackend(): SeedVCBackend {
  return (process.env.SEEDVC_BACKEND || 'mock') as SeedVCBackend
}

export function resetSeedVCClient(): void {
  seedVCClientInstance = null
}
