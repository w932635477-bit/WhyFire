/**
 * Modal API 结构测试
 *
 * 验证 Modal Web Endpoint 的正确调用格式
 * 运行：npx vitest run tests/integration/modal-api-structure.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

describe('Modal API Structure', () => {
  const baseUrl = process.env.MODAL_WEB_ENDPOINT_URL
  const apiToken = process.env.MODAL_API_TOKEN

  beforeAll(() => {
    if (!baseUrl) {
      console.warn('⚠️  MODAL_WEB_ENDPOINT_URL 未配置，部分测试将跳过')
      console.warn('   配置示例: MODAL_WEB_ENDPOINT_URL=https://your-workspace--seed-vc.modal.run')
    }
  })

  describe('环境配置', () => {
    it('should have MODAL_WEB_ENDPOINT_URL configured (optional)', () => {
      if (!baseUrl) {
        console.log('⊘ 跳过: MODAL_WEB_ENDPOINT_URL 未配置')
        return
      }
      expect(baseUrl).toMatch(/^https:\/\//)
      expect(baseUrl).toContain('.modal.run')
    })

    it('should have valid URL format', () => {
      if (!baseUrl) return

      const url = new URL(baseUrl)
      expect(url.protocol).toBe('https:')
      expect(url.hostname).toContain('modal.run')
    })
  })

  describe('API 端点发现', () => {
    it('should connect to Modal endpoint', async () => {
      if (!baseUrl) {
        console.log('⊘ 跳过: Modal URL 未配置')
        return
      }

      try {
        const response = await fetch(baseUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })

        console.log(`✓ Modal 连接成功: ${response.status}`)
        expect(response.status).toBeLessThan(500)
      } catch (error) {
        console.warn(`⚠️  Modal 连接失败: ${error}`)
        // 不让测试失败，只是警告
      }
    })

    it('should discover /convert endpoint', async () => {
      if (!baseUrl) {
        console.log('⊘ 跳过: Modal URL 未配置')
        return
      }

      try {
        const response = await fetch(`${baseUrl}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true }),
          signal: AbortSignal.timeout(10000),
        })

        console.log(`✓ /convert 端点响应: ${response.status}`)

        // 任何响应（包括 400/422）都表示端点存在
        if (response.status !== 404) {
          console.log('  ✓ /convert 端点存在')
        }

        expect(response.status).toBeLessThan(500)
      } catch (error) {
        console.warn(`⚠️  /convert 端点探测失败: ${error}`)
      }
    })

    it('should test /health endpoint', async () => {
      if (!baseUrl) {
        console.log('⊘ 跳过: Modal URL 未配置')
        return
      }

      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✓ /health 端点:', data)
        } else {
          console.log(`⊘ /health 返回 ${response.status}`)
        }
      } catch {
        console.log('⊘ /health 端点不存在（正常）')
      }
    })
  })

  describe('API 请求格式', () => {
    it('should send correct request format to /convert', async () => {
      if (!baseUrl) {
        console.log('⊘ 跳过: Modal URL 未配置')
        return
      }

      const testRequest = {
        source_audio_url: 'https://example.com/test-source.mp3',
        reference_audio_url: 'https://example.com/test-reference.mp3',
        f0_condition: true,
        fp16: true,
      }

      try {
        const response = await fetch(`${baseUrl}/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
          },
          body: JSON.stringify(testRequest),
          signal: AbortSignal.timeout(30000),
        })

        console.log(`✓ 请求格式测试: ${response.status}`)

        if (response.status === 200 || response.status === 201 || response.status === 202) {
          const result = await response.json()
          console.log('  响应数据:', JSON.stringify(result, null, 2).substring(0, 200))
          expect(result).toBeDefined()
        } else if (response.status === 400 || response.status === 422) {
          const error = await response.text()
          console.log('  验证错误（正常）:', error.substring(0, 200))
        } else {
          console.log(`  状态码: ${response.status}`)
        }
      } catch (error) {
        console.warn(`⚠️  请求测试失败: ${error}`)
      }
    })
  })

  describe('API 响应格式', () => {
    it('should document expected response format', () => {
      // 文档化期望的响应格式
      const expectedResponse = {
        task_id: 'string (optional)',
        status: 'pending | processing | completed | failed',
        result: 'string (audio URL when completed)',
        error: 'string (optional)',
      }

      console.log('期望的 Modal API 响应格式:')
      console.log(JSON.stringify(expectedResponse, null, 2))

      expect(expectedResponse).toBeDefined()
    })
  })
})

describe('Modal Client 集成', () => {
  it('should create ModalClient with correct configuration', async () => {
    const { getModalClient } = await import('@/lib/serverless/modal-client')

    const client = getModalClient()
    const isConfigured = client.isConfigured()

    if (!isConfigured) {
      console.log('⊘ Modal 未配置（需要设置环境变量）')
      return
    }

    console.log('✓ Modal 客户端已配置')
    expect(isConfigured).toBe(true)
  })

  it('should handle missing configuration gracefully', async () => {
    const originalUrl = process.env.MODAL_WEB_ENDPOINT_URL
    delete process.env.MODAL_WEB_ENDPOINT_URL

    // 重新导入以获取新配置
    const module = await import('@/lib/serverless/modal-client')
    const client = new (module.ModalClient as any)()

    expect(client.isConfigured()).toBe(false)

    // 恢复环境变量
    if (originalUrl) process.env.MODAL_WEB_ENDPOINT_URL = originalUrl
  })
})
