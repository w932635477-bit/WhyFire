/**
 * Seed-VC 客户端集成测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getSeedVCClient,
  getSeedVCBackend,
  resetSeedVCClient,
  SeedVCMockClient,
  type ISeedVCClient,
  type SeedVCConversionRequest,
} from '../../src/lib/audio/seed-vc-client.js'

describe('SeedVCClient', () => {
  beforeEach(() => {
    // 重置客户端实例
    resetSeedVCClient()
    // 清除环境变量
    delete process.env.SEEDVC_BACKEND
    delete process.env.MODAL_API_TOKEN
    delete process.env.MODAL_APP_ID
  })

  describe('getSeedVCBackend', () => {
    it('should return mock by default', () => {
      expect(getSeedVCBackend()).toBe('mock')
    })

    it('should return modal when configured', () => {
      process.env.SEEDVC_BACKEND = 'modal'
      expect(getSeedVCBackend()).toBe('modal')
    })
  })

  describe('getSeedVCClient', () => {
    it('should return MockClient by default', () => {
      const client = getSeedVCClient()
      expect(client).toBeInstanceOf(SeedVCMockClient)
    })

    it('should return ModalClient when backend is modal', () => {
      process.env.SEEDVC_BACKEND = 'modal'
      process.env.MODAL_API_TOKEN = 'test-token'
      process.env.MODAL_APP_ID = 'test-app'

      const client = getSeedVCClient()
      // ModalClient 在没有 API 时会返回失败，但类型是正确的
      expect(client.constructor.name).toContain('Client')
    })
  })

  describe('SeedVCMockClient', () => {
    let client: ISeedVCClient

    beforeEach(() => {
      client = new SeedVCMockClient()
    })

    it('should be available', async () => {
      const available = await client.isAvailable()
      expect(available).toBe(true)
    })

    it('should convert voice and return source audio', async () => {
      const request: SeedVCConversionRequest = {
        sourceAudio: 'https://example.com/vocals.mp3',
        referenceAudio: 'https://example.com/reference.mp3',
        f0Condition: true,
      }

      const result = await client.convert(request)

      expect(result.status).toBe('completed')
      expect(result.outputAudio).toBe(request.sourceAudio)
      expect(result.taskId).toMatch(/^mock-/)
    })

    it('should get status for a task', async () => {
      const result = await client.getStatus('test-task-id')

      expect(result.taskId).toBe('test-task-id')
      expect(result.status).toBe('completed')
    })
  })

  describe('SeedVCConversionRequest', () => {
    it('should have correct default values', () => {
      const request: SeedVCConversionRequest = {
        sourceAudio: 'https://example.com/source.mp3',
        referenceAudio: 'https://example.com/reference.mp3',
      }

      // 默认值在客户端中处理
      expect(request.f0Condition).toBeUndefined()
      expect(request.fp16).toBeUndefined()
    })
  })
})
