/**
 * 媒体代理 API
 *
 * 解决 COEP 环境下跨域视频/音频加载问题
 * 代理外部媒体资源，添加 Cross-Origin-Resource-Policy 头
 *
 * 安全：
 * - SSRF 防护（isValidPublicUrl，拒绝私有 IP / localhost）
 * - 速率限制（30 次/分钟/客户端）
 * - CORS 限制为本站域名
 * - 流式传输（不缓存整个资源到内存）
 * - 大小限制 200MB
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/middleware/auth'
import { isValidPublicUrl } from '@/lib/utils/url-validator'

const MAX_MEDIA_SIZE = 200 * 1024 * 1024 // 200MB

/** 获取允许的 CORS Origin */
function getAllowedOrigin(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const requestOrigin = request.headers.get('origin') || ''
  if (appUrl && requestOrigin === appUrl) return appUrl
  // 开发环境允许 localhost
  if (!appUrl && (requestOrigin.startsWith('http://localhost:') || requestOrigin.startsWith('http://127.0.0.1:'))) {
    return requestOrigin
  }
  return ''
}

/** OPTIONS: CORS 预检 */
export async function OPTIONS(request: NextRequest) {
  const headers = new Headers()
  const allowedOrigin = getAllowedOrigin(request)
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin)
    headers.set('Access-Control-Allow-Methods', 'GET')
    headers.set('Access-Control-Allow-Headers', 'Range')
    headers.set('Access-Control-Max-Age', '86400')
  }
  return new NextResponse(null, { status: 204, headers })
}

export async function GET(request: NextRequest) {
  // 速率限制
  const clientId = getClientIp(request)
  const rateLimit = checkRateLimit(`video-proxy:${clientId}`, 30, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: '请求过于频繁' }, { status: 429 })
  }

  const targetUrl = request.nextUrl.searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // URL 长度限制
  if (targetUrl.length > 2048) {
    return NextResponse.json({ error: 'URL too long' }, { status: 400 })
  }

  // SSRF 防护：拒绝私有 IP、localhost、非 HTTP(S) 协议
  if (!isValidPublicUrl(targetUrl)) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  try {
    // 手动处理重定向，对每个 Location 做 SSRF 校验
    let currentUrl = targetUrl
    let response: Response | null = null
    for (let redirectCount = 0; redirectCount < 5; redirectCount++) {
      response = await fetch(currentUrl, {
        headers: {
          ...(request.headers.get('range') && { Range: request.headers.get('range')! }),
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        redirect: 'manual',
      })
      const status = response.status
      if (status >= 300 && status < 400) {
        const location = response.headers.get('location')
        if (!location) break
        // 解析相对 URL
        const nextUrl = new URL(location, currentUrl).toString()
        // 对重定向目标也做 SSRF 校验
        if (!isValidPublicUrl(nextUrl)) {
          return NextResponse.json({ error: 'Redirect target not allowed' }, { status: 403 })
        }
        currentUrl = nextUrl
        continue
      }
      break
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response?.status || 502}` },
        { status: response?.status || 502 },
      )
    }
    // After the loop + null check, response is guaranteed non-null
    const upstream = response!

    // 大小检查
    const contentLength = parseInt(upstream.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_MEDIA_SIZE) {
      return NextResponse.json(
        { error: 'Media too large (max 200MB)' },
        { status: 413 },
      )
    }

    const headers = new Headers()
    const ct = upstream.headers.get('content-type')
    const cl = upstream.headers.get('content-length')
    const cr = upstream.headers.get('content-range')
    const ar = upstream.headers.get('accept-ranges')

    if (ct) headers.set('Content-Type', ct)
    if (cl) headers.set('Content-Length', cl)
    if (cr) headers.set('Content-Range', cr)
    if (ar) headers.set('Accept-Ranges', ar)

    // 关键：添加 CORP 头以兼容 COEP
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin')

    // CORS：仅允许本站域名
    const allowedOrigin = getAllowedOrigin(request)
    if (allowedOrigin) {
      headers.set('Access-Control-Allow-Origin', allowedOrigin)
    }
    headers.set('Cache-Control', 'public, max-age=3600')

    // 流式传输：直接 pipe upstream.body，不缓存到内存
    return new NextResponse(upstream.body, { status: upstream.status, headers })
  } catch (error) {
    console.error('[MediaProxy] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
  }
}
