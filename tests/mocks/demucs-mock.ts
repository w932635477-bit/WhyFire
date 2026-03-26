/**
 * Demucs Mock 服务
 *
 * 模拟音频分离 API 的响应
 */

import { simulateDelay, maybeFail, getMockConfig } from './service-mocks.ts'

export interface DemucsMockResponse {
  vocals?: string
  drums?: string
  bass?: string
  other?: string
  duration?: number
}

// 预分离的示例音频 URL
const SEPARATED_AUDIO_URLS = {
  vocals: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/sample-vocals.mp3',
  drums: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/sample-drums.mp3',
  bass: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/sample-bass.mp3',
  other: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/sample-other.mp3',
}

/**
 * Mock Demucs 分离请求
 */
export async function mockDemucsSeparate(params: {
  audioUrl: string
  model?: string
}): Promise<DemucsMockResponse> {
  const config = getMockConfig().demucs

  await simulateDelay(config.delay)
  maybeFail(config.failRate, 'Demucs separation')

  return {
    vocals: SEPARATED_AUDIO_URLS.vocals,
    drums: SEPARATED_AUDIO_URLS.drums,
    bass: SEPARATED_AUDIO_URLS.bass,
    other: SEPARATED_AUDIO_URLS.other,
    duration: 120,
  }
}

/**
 * Mock Demucs 状态查询
 */
export async function mockDemucsStatus(taskId: string): Promise<DemucsMockResponse> {
  const config = getMockConfig().demucs

  await simulateDelay(config.delay / 2)

  return {
    vocals: SEPARATED_AUDIO_URLS.vocals,
    duration: 120,
  }
}
