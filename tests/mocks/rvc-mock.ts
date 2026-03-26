/**
 * RVC Mock 服务
 *
 * 模拟声音克隆和音色转换 API 的响应
 */

import { simulateDelay, maybeFail, getMockConfig } from './service-mocks.ts'

export interface RVCMockResponse {
  taskId?: string
  modelName?: string
  voiceId?: string
  outputAudio?: string
  duration?: number
  status: 'completed' | 'failed' | 'processing'
  progress?: number
}

// 预生成的示例音频 URL
const RVC_OUTPUT_URLS = [
  'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/sample-rvc-output-1.mp3',
  'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/sample-rvc-output-2.mp3',
]

/**
 * Mock RVC 声音训练
 */
export async function mockRVCTrain(params: {
  audioUrl: string
  voiceName?: string
  epochs?: number
}): Promise<RVCMockResponse> {
  const config = getMockConfig().rvc

  await simulateDelay(config.delay * 2)  // 训练更慢
  maybeFail(config.failRate, 'RVC training')

  const modelName = params.voiceName || `mock-voice-${Date.now()}`

  return {
    taskId: `mock-train-${Date.now()}`,
    modelName,
    voiceId: modelName,
    status: 'completed',
  }
}

/**
 * Mock RVC 音色转换
 */
export async function mockRVCConvert(params: {
  inputAudio: string
  voiceModel: string
  f0Method?: string
  f0UpKey?: number
}): Promise<RVCMockResponse> {
  const config = getMockConfig().rvc

  await simulateDelay(config.delay)
  maybeFail(config.failRate, 'RVC conversion')

  return {
    outputAudio: RVC_OUTPUT_URLS[Math.floor(Math.random() * RVC_OUTPUT_URLS.length)],
    duration: 120,
    status: 'completed',
  }
}

/**
 * Mock RVC 状态查询
 */
export async function mockRVCStatus(taskId: string): Promise<RVCMockResponse> {
  const config = getMockConfig().rvc

  await simulateDelay(config.delay / 2)

  return {
    taskId,
    status: 'completed',
    progress: 100,
  }
}
