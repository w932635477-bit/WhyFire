/**
 * 视频代理 API
 *
 * 解决 COEP 环境下跨域视频加载问题
 * 代理外部视频资源，添加 Cross-Origin-Resource-Policy 头
 *
 * 安全：仅允许白名单域名
 */

import { NextRequest, NextResponse } from 'next/server'

// 允许代理的域名白名单
const ALLOWED_HOSTS = [
  'qishui.douyin.com',
  'douyin.com',
  'www.douyin.com',
  'sf3-dycdn-tos.pstatp.com',
  'sf6-dycdn-tos.pstatp.com',
  'v26-web.douyinvod.com',
  'v3-web.douyinvod.com',
  'v9-dy.douyinvod.com',
]

function isAllowedHost(url: URL): boolean {
  return ALLOWED_HOSTS.some(host => url.hostname === host || url.hostname.endsWith('.' + host))
}

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(targetUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (!isAllowedHost(parsedUrl)) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // 转发 Range 请求头（支持视频 seek）
        ...(request.headers.get('range') && { Range: request.headers.get('range')! }),
        // 伪装常见 UA，避免被 CDN 拒绝
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status },
      )
    }

    const body = await response.arrayBuffer()

    const headers = new Headers()
    const ct = response.headers.get('content-type')
    const cl = response.headers.get('content-length')
    const cr = response.headers.get('content-range')
    const ar = response.headers.get('accept-ranges')

    if (ct) headers.set('Content-Type', ct)
    if (cl) headers.set('Content-Length', cl)
    if (cr) headers.set('Content-Range', cr)
    if (ar) headers.set('Accept-Ranges', ar)

    // 关键：添加 CORP 头以兼容 COEP
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(body, { status: response.status, headers })
  } catch (error) {
    console.error('[VideoProxy] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}
