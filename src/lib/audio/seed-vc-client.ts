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

  async convert(request: SeedVCConversionRequest): Promise<SeedVCConversionResult> {
    console.log('[SeedVC-Modal] Starting voice conversion')
    console.log(`  Source: ${request.sourceAudio}`)
    console.log(`  Reference: ${request.referenceAudio}`)
    console.log(`  F0 Condition: ${request.f0Condition ?? true}`)

    const startTime = Date.now()

    try {
      // 调用 Modal Web Endpoint
      const result = await this.modalClient.invoke({
        functionName: 'convert',
        args: {
          source_audio_url: request.sourceAudio,
          reference_audio_url: request.referenceAudio,
          f0_condition: request.f0Condition ?? true,
          fp16: request.fp16 ?? true,
          diffusion_steps: request.diffusionSteps ?? 30,
          chunk_length: request.chunkLength ?? 30,
        },
        timeout: 180000, // 3 分钟
      })

      const modalResult = result as ModalTaskStatus

      return {
        taskId: modalResult.taskId,
        status: modalResult.status,
        outputAudio: modalResult.result as string | undefined,
        processingTime: Date.now() - startTime,
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
    return this.modalClient.isConfigured()
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
