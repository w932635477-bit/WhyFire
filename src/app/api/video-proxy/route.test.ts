/**
 * API 路由测试：/api/video-proxy
 *
 * 测试媒体代理 API 的安全性和功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// Mock url-validator
vi.mock('@/lib/utils/url-validator', () => ({
  isValidPublicUrl: vi.fn(),
}))

// Mock auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 29, resetTime: Date.now() + 60000 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

// Mock fetch for upstream requests
const mockFetch = vi.fn()
global.fetch = mockFetch

import { isValidPublicUrl } from '@/lib/utils/url-validator'
import { checkRateLimit } from '@/lib/middleware/auth'

describe('API: /api/video-proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: rate limit allowed
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 29, resetTime: Date.now() + 60000 })
    // Default: URL is valid
    vi.mocked(isValidPublicUrl).mockReturnValue(true)
    mockFetch.mockReset()
  })

  // ===========================================
  // SSRF 防护
  // ===========================================
  describe('SSRF 防护', () => {
    it('should reject localhost URL with 403', async () => {
      vi.mocked(isValidPublicUrl).mockReturnValue(false)

      const request = new NextRequest(
        'http://localhost/api/video-proxy?url=http://localhost:3000/video.mp4',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Domain not allowed')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should reject private IP with 403', async () => {
      vi.mocked(isValidPublicUrl).mockReturnValue(false)

      const request = new NextRequest(
        'http://localhost/api/video-proxy?url=http://192.168.1.1/video.mp4',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Domain not allowed')
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  // ===========================================
  // 参数验证
  // ===========================================
  describe('参数验证', () => {
    it('should return 400 when url param is missing', async () => {
      const request = new NextRequest(
        'http://localhost/api/video-proxy',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing url')
    })

    it('should return 400 when URL is too long (>2048 chars)', async () => {
      const longUrl = 'https://example.com/video?' + 'a'.repeat(2100)
      const request = new NextRequest(
        `http://localhost/api/video-proxy?url=${encodeURIComponent(longUrl)}`,
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('URL too long')
    })
  })

  // ===========================================
  // 速率限制
  // ===========================================
  describe('速率限制', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, remaining: 0, resetTime: Date.now() + 60000 })

      const request = new NextRequest(
        'http://localhost/api/video-proxy?url=https://example.com/video.mp4',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('频繁')
    })
  })

  // ===========================================
  // 成功代理
  // ===========================================
  describe('成功代理', () => {
    it('should return upstream body with CORP header', async () => {
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('video-data'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'video/mp4',
          'content-length': '12345',
        }),
        body: mockBody,
      })

      const request = new NextRequest(
        'http://localhost/api/video-proxy?url=https://example.com/video.mp4',
        { method: 'GET' }
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin')
      expect(response.headers.get('Content-Type')).toBe('video/mp4')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/video.mp4',
        expect.objectContaining({
          redirect: 'manual',
        })
      )
    })
  })

  // ===========================================
  // 重定向安全
  // ===========================================
  describe('重定向安全', () => {
    it('should reject redirect to private IP with 403', async () => {
      // First call returns a redirect
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers({
          'location': 'http://192.168.1.1/internal-video.mp4',
        }),
      })

      // isValidPublicUrl returns true for initial URL, false for redirect target
      vi.mocked(isValidPublicUrl)
        .mockReturnValueOnce(true)   // initial URL validation
        .mockReturnValueOnce(false)  // redirect target validation

      const request = new NextRequest(
        'http://localhost/api/video-proxy?url=https://example.com/video.mp4',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Redirect target not allowed')
    })
  })

  // ===========================================
  // CORS
  // ===========================================
  describe('CORS', () => {
    it('should not set ACAO header for non-matching origin', async () => {
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'video/mp4',
        }),
        body: mockBody,
      })

      const request = new NextRequest(
        'http://localhost/api/video-proxy?url=https://example.com/video.mp4',
        {
          method: 'GET',
          headers: { 'origin': 'https://evil.com' },
        }
      )

      const response = await GET(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })
  })

  // ===========================================
  // Range 头转发
  // ===========================================
  describe('Range 头转发', () => {
    it('should forward Range header to upstream', async () => {
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('partial-data'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValue({
        ok: true,
        status: 206,
        headers: new Headers({
          'content-type': 'video/mp4',
          'content-range': 'bytes 0-1023/10240',
          'accept-ranges': 'bytes',
        }),
        body: mockBody,
      })

      const request = new NextRequest(
        'http://localhost/api/video-proxy?url=https://example.com/video.mp4',
        {
          method: 'GET',
          headers: { 'Range': 'bytes=0-1023' },
        }
      )

      const response = await GET(request)

      expect(response.status).toBe(206)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/video.mp4',
        expect.objectContaining({
          headers: expect.objectContaining({
            Range: 'bytes=0-1023',
          }),
        })
      )
      expect(response.headers.get('Content-Range')).toBe('bytes 0-1023/10240')
    })
  })

  // ===========================================
  // 大文件限制
  // ===========================================
  describe('大文件限制', () => {
    it('should return 413 for files larger than 200MB', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'video/mp4',
          'content-length': String(201 * 1024 * 1024), // 201MB
        }),
        body: new ReadableStream({
          start(controller) { controller.close() },
        }),
      })

      const request = new NextRequest(
        'http://localhost/api/video-proxy?url=https://example.com/huge.mp4',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(413)
      expect(data.error).toContain('too large')
    })
  })
})
