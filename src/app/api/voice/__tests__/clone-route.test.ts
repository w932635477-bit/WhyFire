/**
 * 声音克隆 API 端点测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '../clone/route'

// 模拟 CosyVoiceCloneClient
const mockCreateVoice = vi.fn()
const mockDeleteVoice = vi.fn()
const mockIsConfigured = vi.fn()
const mockWaitForVoiceReady = vi.fn()

vi.mock('@/lib/tts/cosyvoice-clone-client', () => ({
  getCosyVoiceCloneClient: () => ({
    isConfigured: mockIsConfigured,
    createVoice: mockCreateVoice,
    deleteVoice: mockDeleteVoice,
    waitForVoiceReady: mockWaitForVoiceReady,
  }),
}))

// 模拟 OSS 模块
vi.mock('@/lib/oss', () => ({
  isOSSConfigured: vi.fn(() => true),
  uploadToOSS: vi.fn(async () => ({
    success: true,
    url: 'https://oss.example.com/test-audio.mp3',
  })),
}))

describe('/api/voice/clone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsConfigured.mockReturnValue(true)
    mockWaitForVoiceReady.mockResolvedValue({ ready: true, status: 'ok' })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ===========================================
  // GET - 服务状态检查
  // ===========================================
  describe('GET', () => {
    it('服务可用时应该返回 enabled: true', async () => {
      mockIsConfigured.mockReturnValue(true)

      const response = await GET()
      const result = await response.json()

      expect(result.code).toBe(0)
      expect(result.data.enabled).toBe(true)
      expect(result.data.provider).toBe('cosyvoice')
    })

    it('服务不可用时应该返回 enabled: false', async () => {
      mockIsConfigured.mockReturnValue(false)

      const response = await GET()
      const result = await response.json()

      expect(result.code).toBe(0)
      expect(result.data.enabled).toBe(false)
      expect(result.data.message).toContain('DASHSCOPE_API_KEY')
    })
  })

  // ===========================================
  // POST - 创建声音克隆
  // ===========================================
  describe('POST', () => {
    it('服务不可用时应该返回 503', async () => {
      mockIsConfigured.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/voice/clone', {
        method: 'POST',
        body: JSON.stringify({ audioUrl: 'https://example.com/audio.mp3' }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(503)
      expect(result.code).toBe(503)
      expect(result.message).toContain('未配置')
    })

    it('JSON 格式请求应该正确处理', async () => {
      mockCreateVoice.mockResolvedValueOnce({
        success: true,
        voiceId: 'voice-test-123',
      })

      const request = new NextRequest('http://localhost/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: 'https://example.com/audio.mp3',
          dialect: 'sichuan',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.code).toBe(0)
      expect(result.data.voiceId).toBe('voice-test-123')
      expect(result.data.status).toBe('completed')
    })

    it('缺少音频参数时应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialect: 'sichuan' }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.code).toBe(400)
      expect(result.message).toContain('必须提供')
    })

    it('创建失败时应该返回 500', async () => {
      mockCreateVoice.mockResolvedValueOnce({
        success: false,
        error: '音频时长不足',
      })

      const request = new NextRequest('http://localhost/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: 'https://example.com/audio.mp3',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.code).toBe(500)
      expect(result.data.status).toBe('failed')
      expect(result.message).toContain('音频时长')
    })

    it('异常时应该返回 500', async () => {
      mockCreateVoice.mockRejectedValueOnce(new Error('Network error'))

      const request = new NextRequest('http://localhost/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: 'https://example.com/audio.mp3',
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.code).toBe(500)
    })

    it('FormData 格式请求应该正确处理', async () => {
      mockCreateVoice.mockResolvedValueOnce({
        success: true,
        voiceId: 'voice-formdata-456',
      })

      // 模拟 FormData
      const formData = new FormData()
      formData.append('audio', new Blob(['audio-data'], { type: 'audio/mp3' }), 'test.mp3')
      formData.append('dialect', 'cantonese')

      const request = new NextRequest('http://localhost/api/voice/clone', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const result = await response.json()

      expect(result.code).toBe(0)
      expect(result.data.voiceId).toBe('voice-formdata-456')
    })
  })

  // ===========================================
  // DELETE - 删除声音克隆
  // ===========================================
  describe('DELETE', () => {
    it('服务不可用时应该返回 503', async () => {
      mockIsConfigured.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/voice/clone?voiceId=voice-123', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const result = await response.json()

      expect(response.status).toBe(503)
      expect(result.code).toBe(503)
    })

    it('缺少 voiceId 时应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/voice/clone', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.code).toBe(400)
      expect(result.message).toContain('voiceId')
    })

    it('成功删除时应该返回成功', async () => {
      mockDeleteVoice.mockResolvedValueOnce({ success: true })

      const request = new NextRequest('http://localhost/api/voice/clone?voiceId=voice-123', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const result = await response.json()

      expect(result.code).toBe(0)
      expect(result.data.success).toBe(true)
    })

    it('删除失败时应该返回错误', async () => {
      mockDeleteVoice.mockResolvedValueOnce({
        success: false,
        error: '音色不存在',
      })

      const request = new NextRequest('http://localhost/api/voice/clone?voiceId=voice-404', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const result = await response.json()

      expect(result.code).toBe(500)
      expect(result.data.success).toBe(false)
    })

    it('异常时应该返回 500', async () => {
      mockDeleteVoice.mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/voice/clone?voiceId=voice-123', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.code).toBe(500)
    })
  })
})
