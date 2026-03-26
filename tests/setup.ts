/**
 * 测试环境设置
 */

import { beforeAll, afterAll } from 'vitest'

// 设置测试环境变量
beforeAll(() => {
  // 默认启用 Mock 模式（除非明确指定真实服务）
  if (!process.env.FORCE_REAL_SERVICES) {
    process.env.USE_MOCK_SERVICES = 'true'
  }

  // 设置测试超时
  process.env.VITEST_TIMEOUT = process.env.E2E_REAL === 'true' ? '300000' : '30000'
})

afterAll(() => {
  // 清理
})
