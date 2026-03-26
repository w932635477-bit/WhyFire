/**
 * API 路由测试：/api/audio-proxy
 *
 * 安全测试：路径遍历攻击防护
 */

import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/audio-proxy/route'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API: /api/audio-proxy - 安全测试', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('路径遍历攻击防护', () => {
    it('should reject path with .. traversal', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=../../../etc/passwd',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should reject path with encoded .. traversal', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })

    it('should reject absolute path', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=/etc/passwd',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })

    it('should reject Windows drive path', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=C:\\Windows\\System32\\config',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })

    it('should reject path with null byte', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=voice-references/test.mp3%00.txt',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })

    it('should reject path with double slashes', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=voice-references//test.mp3',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })
  })

  describe('文件类型验证', () => {
    it('should reject non-audio file extensions', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=voice-references/test.txt',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })

    it('should reject executable files', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=voice-references/malware.exe',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })
  })

  describe('路径前缀白名单', () => {
    it('should reject path outside allowed prefixes', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=secret/credentials.mp3',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })

    it('should accept valid path with allowed prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(0),
        headers: new Headers({
          'content-type': 'audio/mpeg',
          'content-length': '1000',
        }),
      })

      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=voice-references/test.mp3',
        { method: 'GET' }
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('voice-references/test.mp3'),
        expect.any(Object)
      )
    })
  })

  describe('正常请求', () => {
    it('should accept valid audio file request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(100),
        headers: new Headers({
          'content-type': 'audio/mpeg',
          'content-length': '100',
        }),
      })

      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=bgm/track1.mp3',
        { method: 'GET' }
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin')
    })

    it('should forward Range header for audio seeking', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 206,
        arrayBuffer: async () => new ArrayBuffer(50),
        headers: new Headers({
          'content-type': 'audio/mpeg',
          'content-range': 'bytes 0-49/100',
        }),
      })

      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=suno/song.mp3',
        {
          method: 'GET',
          headers: { 'Range': 'bytes=0-49' },
        }
      )

      const response = await GET(request)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Range: 'bytes=0-49',
          }),
        })
      )
    })

    it('should handle OSS errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=voice-references/notfound.mp3',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('OSS error')
    })
  })

  describe('特殊字符处理', () => {
    it('should reject path with special characters', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=voice-references/test<>.mp3',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })

    it('should reject path with pipe character', async () => {
      const request = new NextRequest(
        'http://localhost/api/audio-proxy?path=voice-references/test|cmd.mp3',
        { method: 'GET' }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid or unsafe path')
    })
  })
})
