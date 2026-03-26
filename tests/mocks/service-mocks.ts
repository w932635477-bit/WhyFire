/**
 * 测试用 Mock 服务层
 *
 * 使用方式：
 * 1. 设置环境变量 USE_MOCK_SERVICES=true 启用 Mock
 * 2. 各服务自动切换到 Mock 实现
 */

export interface MockConfig {
  suno: {
    enabled: boolean
    delay: number      // 模拟延迟（毫秒）
    failRate: number   // 失败率 (0-1)
  }
  demucs: {
    enabled: boolean
    delay: number
    failRate: number
  }
  rvc: {
    enabled: boolean
    delay: number
    failRate: number
  }
}

export const defaultMockConfig: MockConfig = {
  suno: { enabled: true, delay: 1000, failRate: 0 },
  demucs: { enabled: true, delay: 500, failRate: 0 },
  rvc: { enabled: true, delay: 800, failRate: 0 },
}

// 全局 Mock 配置
let mockConfig = defaultMockConfig

export function setMockConfig(config: Partial<MockConfig>) {
  mockConfig = { ...mockConfig, ...config }
}

export function getMockConfig() {
  return mockConfig
}

export function shouldUseMock(service: 'suno' | 'demucs' | 'rvc'): boolean {
  const envMock = process.env.USE_MOCK_SERVICES === 'true'
  const forceReal = process.env.FORCE_REAL_SERVICES === 'true'

  if (forceReal) return false
  if (envMock) return true
  return mockConfig[service].enabled
}

/**
 * 模拟延迟
 */
export async function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 根据失败率决定是否抛出错误
 */
export function maybeFail(failRate: number, message: string): void {
  if (Math.random() < failRate) {
    throw new Error(`[Mock] Simulated failure: ${message}`)
  }
}
