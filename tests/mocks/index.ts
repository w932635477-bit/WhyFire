/**
 * Mock 服务统一入口
 */

// 从 service-mocks 导出
export {
  type MockConfig,
  defaultMockConfig,
  getMockConfig,
  shouldUseMock,
  simulateDelay,
  maybeFail,
} from './service-mocks.js'

// 从各服务 mock 导出
export {
  mockSunoGenerate,
  mockSunoStatus,
  createTestAudio,
  type SunoMockResponse,
} from './suno-mock.js'

export {
  mockDemucsSeparate,
  mockDemucsStatus,
  type DemucsMockResponse,
} from './demucs-mock.js'

export {
  mockRVCTrain,
  mockRVCConvert,
  mockRVCStatus,
  type RVCMockResponse,
} from './rvc-mock.js'
