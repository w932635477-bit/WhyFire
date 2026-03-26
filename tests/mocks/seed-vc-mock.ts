/**
 * Seed-VC Mock 服务
 *
 * 用于测试 Seed-VC 客户端，不进行实际的音色转换
 */

import type { SeedVCConversionResult } from '../../src/lib/audio/seed-vc-client.js'

/**
 * Seed-VC Mock 响应配置
 */
export interface SeedVCMockResponse {
  /** 是否模拟延迟 */
  delay?: number
  /** 是否模拟失败 */
  shouldFail?: boolean
  /** 失败错误信息 */
  errorMessage?: string
}

/**
 * 默认 Mock 配置
 */
const defaultMockConfig: SeedVCMockResponse = {
  delay: 100,
  shouldFail: false,
}

/**
 * 模拟延迟
 */
async function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock Seed-VC 音色转换
 *
 * @param sourceAudio 源音频 URL
 * @param referenceAudio 参考音频 URL
 * @param config Mock 配置
 */
export async function mockSeedVCConvert(
  sourceAudio: string,
  referenceAudio: string,
  config: SeedVCMockResponse = defaultMockConfig
): Promise<SeedVCConversionResult> {
  if (config.delay) {
    await simulateDelay(config.delay)
  }

  if (config.shouldFail) {
    return {
      taskId: `failed-${Date.now()}`,
      status: 'failed',
      error: config.errorMessage || 'Mock conversion failed',
    }
  }

  // Mock: 直接返回源音频（不进行转换）
  return {
    taskId: `mock-seedvc-${Date.now()}`,
    status: 'completed',
    outputAudio: sourceAudio,
    duration: 30,
    processingTime: 100,
  }
}

/**
 * Mock 获取 Seed-VC 任务状态
 *
 * @param taskId 任务 ID
 * @param config Mock 配置
 */
export async function mockSeedVCStatus(
  taskId: string,
  config: SeedVCMockResponse = defaultMockConfig
): Promise<SeedVCConversionResult> {
  if (config.delay) {
    await simulateDelay(config.delay)
  }

  if (config.shouldFail) {
    return {
      taskId,
      status: 'failed',
      error: config.errorMessage || 'Mock task failed',
    }
  }

  return {
    taskId,
    status: 'completed',
    outputAudio: 'mock://seedvc-output.mp3',
    duration: 30,
    processingTime: 100,
  }
}
