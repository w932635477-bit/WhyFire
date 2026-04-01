/**
 * API 路由测试：/api/cover/resolve-url
 *
 * 测试 URL 解析 API 的安全性和功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Create mock execFile via vi.hoisted
const mockExecFile = vi.hoisted(() => vi.fn())

// Completely mock child_process module (no importOriginal)
// For CJS built-ins with esModuleInterop, we must provide all exports including default
vi.mock('child_process', () => {
  const mod = {
    execFile: mockExecFile,
    exec: vi.fn(),
    spawn: vi.fn(),
    fork: vi.fn(),
    execFileSync: vi.fn(),
    execSync: vi.fn(),
    spawnSync: vi.fn(),
    ChildProcess: class {},
    _forkChild: vi.fn(),
  }
  return {
    ...mod,
    default: mod,
  }
})

// Mock OSS
const mockUploadToOSS = vi.fn()
const mockIsOSSConfigured = vi.fn()
vi.mock('@/lib/oss', () => ({
  uploadToOSS: (...args: unknown[]) => mockUploadToOSS(...args),
  isOSSConfigured: () => mockIsOSSConfigured(),
}))

// Mock auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  withOptionalAuth: (handler: Function) => handler,
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 9, resetTime: Date.now() + 60000 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

// Mock url-validator
vi.mock('@/lib/utils/url-validator', () => ({
  isValidPublicUrl: vi.fn(),
}))

// Mock fetch for downloadAndUpload
const mockFetch = vi.fn()
global.fetch = mockFetch

// Import after mocks are set up
import { POST } from './route'
import { isValidPublicUrl } from '@/lib/utils/url-validator'
import { checkRateLimit } from '@/lib/middleware/auth'

describe('API: /api/cover/resolve-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: rate limit allowed
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 9, resetTime: Date.now() + 60000 })
    // Default: URL is valid (for public URLs)
    vi.mocked(isValidPublicUrl).mockReturnValue(true)
    // Default: OSS configured
    mockIsOSSConfigured.mockReturnValue(true)
    mockUploadToOSS.mockResolvedValue({ success: true, url: 'https://oss.example.com/audio.mp3', objectKey: 'cover-uploads/audio.mp3' })
    mockFetch.mockReset()
    mockExecFile.mockReset()
  })

  // ===========================================
  // SSRF 防护
  // ===========================================
  describe('SSRF 防护', () => {
    it('should reject localhost URL with 400', async () => {
      vi.mocked(isValidPublicUrl).mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://localhost:3000/audio.mp3' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe(400)
      expect(data.message).toContain('不支持该链接')
    })

    it('should reject private IP (192.168.x.x) with 400', async () => {
      vi.mocked(isValidPublicUrl).mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://192.168.1.1/secret' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe(400)
      expect(data.message).toContain('不支持该链接')
    })

    it('should reject file:// scheme with 400', async () => {
      vi.mocked(isValidPublicUrl).mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'file:///etc/passwd' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe(400)
    })
  })

  // ===========================================
  // 直接音频 URL
  // ===========================================
  describe('直接音频 URL', () => {
    it('should return direct audio URL without resolving', async () => {
      vi.mocked(isValidPublicUrl).mockReturnValue(true)

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/song.mp3' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.code).toBe(0)
      expect(data.data.url).toBe('https://example.com/song.mp3')
      // Should not call yt-dlp
      expect(mockExecFile).not.toHaveBeenCalled()
    })
  })

  // ===========================================
  // 速率限制
  // ===========================================
  describe('速率限制', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, remaining: 0, resetTime: Date.now() + 60000 })

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/page' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.code).toBe(429)
      expect(data.message).toContain('频繁')
    })
  })

  // ===========================================
  // 请求体验证
  // ===========================================
  describe('请求体验证', () => {
    it('should return 400 when URL is missing', async () => {
      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe(400)
      expect(data.message).toContain('URL')
    })
  })

  // ===========================================
  // yt-dlp 解析
  // ===========================================
  describe('yt-dlp 解析成功', () => {
    it('should resolve URL, download and upload to OSS, return 200', async () => {
      // Mock yt-dlp returning a result
      mockExecFile.mockImplementation((_cmd: string, _args: string[], _opts: object, cb: Function) => {
        cb(null, JSON.stringify({
          url: 'https://cdn.example.com/audio-stream',
          title: 'Test Song',
          duration: 200,
          ext: 'mp3',
        }), '')
      })

      // Mock fetch for downloadAndUpload
      const audioBuffer = Buffer.alloc(2048, 'a')
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array(audioBuffer) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'audio/mpeg',
          'content-length': '2048',
        }),
        body: {
          getReader: () => mockReader,
        },
      })

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://youtube.com/watch?v=test123' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.code).toBe(0)
      expect(data.data.url).toBe('https://oss.example.com/audio.mp3')
      expect(data.data.title).toBe('Test Song')
      expect(mockExecFile).toHaveBeenCalledWith(
        'python3',
        expect.arrayContaining(['-m', 'yt_dlp']),
        expect.any(Object),
        expect.any(Function)
      )
    })
  })

  // ===========================================
  // yt-dlp 不支持的 URL
  // ===========================================
  describe('yt-dlp 错误', () => {
    it('should return friendly error for unsupported URL', async () => {
      mockExecFile.mockImplementation((_cmd: string, _args: string[], _opts: object, cb: Function) => {
        cb(new Error('Command failed'), '', 'ERROR: Unsupported URL')
      })

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/page' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.code).toBe(500)
      expect(data.message).toContain('不支持该平台')
    })
  })

  // ===========================================
  // 时长限制
  // ===========================================
  describe('时长限制', () => {
    it('should reject audio longer than 480 seconds', async () => {
      mockExecFile.mockImplementation((_cmd: string, _args: string[], _opts: object, cb: Function) => {
        cb(null, JSON.stringify({
          url: 'https://cdn.example.com/long-audio',
          title: 'Long Song',
          duration: 600,
          ext: 'mp3',
        }), '')
      })

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://youtube.com/watch?v=long' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe(400)
      expect(data.message).toContain('8 分钟限制')
    })
  })

  // ===========================================
  // 下载大小限制
  // ===========================================
  describe('下载大小限制', () => {
    it('should reject download larger than 100MB', async () => {
      mockExecFile.mockImplementation((_cmd: string, _args: string[], _opts: object, cb: Function) => {
        cb(null, JSON.stringify({
          url: 'https://cdn.example.com/huge-audio',
          title: 'Huge Song',
          duration: 200,
          ext: 'mp3',
        }), '')
      })

      // Content-Length exceeds 100MB
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'audio/mpeg',
          'content-length': String(101 * 1024 * 1024),
        }),
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValue({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      })

      const request = new NextRequest('http://localhost/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://youtube.com/watch?v=huge' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.code).toBe(500)
      expect(data.message).toContain('过大')
    })
  })
})
