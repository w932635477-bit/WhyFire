/**
 * Seed-VC 零样本声音克隆客户端
 *
 * Seed-VC 是字节跳动开源的零样本语音转换模型：
 * - 无需训练，即时推理
 * - 只需要 1-30 秒参考音频
 * - 支持歌声转换 (SVC) 模式
 *
 * GitHub: https://github.com/Plachtaa/seed-vc
 */

// 初始化全局代理（必须在其他 import 之前）
import '@/lib/proxy'

import { getModalClient, type ModalTaskStatus } from '@/lib/serverless/modal-client'
import { Agent, ProxyAgent } from 'undici'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Seed-VC 转换请求
 *
 * 相比 RVC 大幅简化：
 * - 无需 voiceModel 参数，改为 referenceAudio URL
 * - 无需训练相关参数
 */
export interface SeedVCConversionRequest {
  /** Suno 生成的人声 URL (来自 Demucs 分离) */
  sourceAudio: string
  /** 用户参考音频 URL (1-30 秒) */
  referenceAudio: string
  /** 是否启用 F0 条件化 (Rap 模式必须为 true) */
  f0Condition?: boolean // 默认 true
  /** 是否使用半精度 (更快，显存更少) */
  fp16?: boolean // 默认 true
  /** 扩散步数 (越多质量越高但越慢) */
  diffusionSteps?: number // 默认 30
  /** 分段长度 (处理长音频时) */
  chunkLength?: number // 默认 30 秒
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
 *
 * 相比 IRVCClient 简化：
 * - 移除 trainModel() 方法（零样本无需训练）
 * - 移除 getTrainingStatus() 方法
 * - 移除 listModels() 方法
 * - 移除 deleteModel() 方法
 */
export interface ISeedVCClient {
  /** 检查服务是否可用 */
  isAvailable(): Promise<boolean>
  /** 执行声音转换 */
  convert(request: SeedVCConversionRequest): Promise<SeedVCConversionResult>
  /** 获取任务状态 */
  getStatus(taskId: string): Promise<SeedVCConversionResult>
}

/**
 * Seed-VC 后端类型
 */
export type SeedVCBackend = 'mock' | 'modal'

// ============================================================================
// Mock 客户端（本地测试用）
// ============================================================================

/**
 * Seed-VC Mock 客户端
 *
 * 用于本地开发和测试，不进行实际的音色转换
 */
export class SeedVCMockClient implements ISeedVCClient {
  async convert(request: SeedVCConversionRequest): Promise<SeedVCConversionResult> {
    console.log('[SeedVC-Mock] Converting voice (mock mode)')
    console.log(`  Source: ${request.sourceAudio}`)
    console.log(`  Reference: ${request.referenceAudio}`)

    // Mock: 直接返回源音频
    const taskId = `mock-${Date.now()}`

    return {
      taskId,
      status: 'completed',
      outputAudio: request.sourceAudio, // Mock: 不转换，直接返回
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
// Modal 客户端（生产环境用）
// ============================================================================

/**
 * Seed-VC Modal 客户端
 *
 * 通过 Modal Serverless GPU 调用 Seed-VC 推理
 */
export class SeedVCModalClient implements ISeedVCClient {
  private modalClient = getModalClient()
  private maxPollAttempts = 60
  private pollDelayMs = 3000
  // 下载外部音频需要走代理（SunoAPI 返回的 tempfile 域名等）
  private proxyDispatcher: any

  constructor() {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy
    if (proxyUrl) {
      this.proxyDispatcher = new ProxyAgent(proxyUrl)
    }
  }

  async convert(request: SeedVCConversionRequest): Promise<SeedVCConversionResult> {
    console.log('[SeedVC-Modal] Starting voice conversion')
    console.log(`  Source: ${request.sourceAudio}`)
    console.log(`  Reference: ${request.referenceAudio}`)
    console.log(`  F0 Condition: ${request.f0Condition ?? true}`)

    const startTime = Date.now()

    try {
      const endpointUrl = process.env.MODAL_WEB_ENDPOINT_URL

      if (!endpointUrl) {
        throw new Error('MODAL_WEB_ENDPOINT_URL not configured')
      }

      // 在服务端下载音频并转为 base64（Modal 容器无法访问外部 URL）
      console.log('[SeedVC-Modal] Downloading source audio for base64 encoding...')
      const sourceRes = await fetch(request.sourceAudio, {
        signal: AbortSignal.timeout(60000),
        dispatcher: this.proxyDispatcher,
      } as any)
      if (!sourceRes.ok) throw new Error(`Failed to download source audio: ${sourceRes.status}`)
      const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer())

      console.log('[SeedVC-Modal] Downloading reference audio for base64 encoding...')
      const refRes = await fetch(request.referenceAudio, {
        signal: AbortSignal.timeout(60000),
        dispatcher: this.proxyDispatcher,
      } as any)
      if (!refRes.ok) throw new Error(`Failed to download reference audio: ${refRes.status}`)
      const refBuffer = Buffer.from(await refRes.arrayBuffer())

      const sourceBase64 = `data:audio/wav;base64,${sourceBuffer.toString('base64')}`
      const refBase64 = `data:audio/wav;base64,${refBuffer.toString('base64')}`

      console.log(`[SeedVC-Modal] Source: ${sourceBuffer.length} bytes, Reference: ${refBuffer.length} bytes`)

      // 构建请求（base64 传输，避免 Modal 容器网络隔离）
      // 使用直连 dispatcher 绕过全局代理，避免大请求体被代理截断
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_audio_base64: sourceBase64,
          reference_audio_base64: refBase64,
          f0_condition: request.f0Condition ?? true,
          fp16: request.fp16 ?? true,
          diffusion_steps: request.diffusionSteps ?? 25,
          length_adjust: 1.0,
          inference_cfg_rate: 0.7,
        }),
        signal: AbortSignal.timeout(600000), // 10 分钟超时（GPU 推理较慢）
        // @ts-expect-error Node.js fetch 支持 dispatcher 参数
        dispatcher: new Agent({ connect: { timeout: 30_000 } }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Modal API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      // 详细日志记录
      console.log('[SeedVC-Modal] Modal response:', JSON.stringify({
        status: result.status,
        task_id: result.task_id,
        has_output: !!result.output_audio,
        output_type: result.output_audio?.substring(0, 50) + '...',
        duration: result.duration,
        error: result.error,
      }, null, 2))

      // 检查响应状态
      if (result.status === 'failed') {
        console.error('[SeedVC-Modal] Modal returned failed status:', result.error)
        return {
          taskId: result.task_id || `failed-${Date.now()}`,
          status: 'failed',
          error: result.error || 'Modal conversion failed',
          processingTime: Date.now() - startTime,
        }
      }

      // 检查输出音频是否存在
      if (!result.output_audio) {
        console.error('[SeedVC-Modal] No output_audio in response. Full result:', JSON.stringify(result))
        return {
          taskId: result.task_id || `failed-${Date.now()}`,
          status: 'failed',
          error: result.error || 'No output audio generated. Check Modal service logs.',
          processingTime: Date.now() - startTime,
        }
      }

      // Modal 返回的格式: { status, task_id, output_audio, duration, processing_time, error }
      return {
        taskId: result.task_id || `vc-${Date.now()}`,
        status: result.status || 'completed',
        outputAudio: result.output_audio,
        duration: result.duration,
        processingTime: Date.now() - startTime,
        error: result.error,
      }
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

  async isAvailable(): Promise<boolean> {
    return !!process.env.MODAL_WEB_ENDPOINT_URL
  }

  async getStatus(taskId: string): Promise<SeedVCConversionResult> {
    const status = await this.modalClient.getStatus(taskId)

    return {
      taskId: status.taskId,
      status: status.status,
      outputAudio: status.result as string | undefined,
      error: status.error,
    }
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

let seedVCClientInstance: ISeedVCClient | null = null

/**
 * 获取 Seed-VC 客户端实例
 *
 * 根据环境变量 SEEDVC_BACKEND 选择后端：
 * - mock: 本地 Mock（默认）
 * - modal: Modal Serverless GPU
 */
export function getSeedVCClient(): ISeedVCClient {
  if (!seedVCClientInstance) {
    const backend = (process.env.SEEDVC_BACKEND || 'mock') as SeedVCBackend

    switch (backend) {
      case 'modal':
        seedVCClientInstance = new SeedVCModalClient()
        console.log('[SeedVC] Using Modal backend')
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

/**
 * 获取当前后端类型
 */
export function getSeedVCBackend(): SeedVCBackend {
  return (process.env.SEEDVC_BACKEND || 'mock') as SeedVCBackend
}

/**
 * 重置客户端实例（用于测试）
 */
export function resetSeedVCClient(): void {
  seedVCClientInstance = null
}
