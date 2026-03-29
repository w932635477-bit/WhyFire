/**
 * 音频代理 API
 *
 * 解决 COEP (Cross-Origin-Embedder-Policy: require-corp) 兼容性问题
 * 给 OSS 资源添加 Cross-Origin-Resource-Policy: cross-origin 头
 *
 * 安全措施：
 * 1. 路径验证：禁止路径遍历攻击
 * 2. 文件类型限制：只允许音频文件
 */

import { NextRequest, NextResponse } from 'next/server'

// OSS 基础 URL
const OSS_BASE_URL = `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION || 'oss-cn-beijing'}.aliyuncs.com`

// 允许的音频文件扩展名
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.webm', '.ogg', '.m4a', '.aac', '.flac', '.mp4', '.mov', '.avi', '.mkv']

// 允许的路径前缀（白名单）
const ALLOWED_PATH_PREFIXES = [
  'voice-references/',
  'suno/',
  'bgm/',
  'vocals/',
  'samples/',
  'temp/',
  'rap/',
  'cover-uploads/',
]

/**
 * 验证路径安全性
 *
 * @param path 要验证的路径
 * @returns 如果路径安全返回 true， */
function isPathSafe(path: string): boolean {
  // 1. 检查路径遍历攻击
  if (path.includes('..')) return false

  // 2. 禁止绝对路径
  if (path.startsWith('/') || path.startsWith('\\')) return false

  // 3. 禁止 Windows 驱动器路径
  if (/^[a-zA-Z]:/.test(path)) return false

  // 4. 禁止 URL 编码的路径遍历
  if (path.includes('%2e%2e') || path.includes('%252e')) return false

  // 5. 禁止空字节注入
  if (path.includes('\0')) return false

  // 6. 检查文件扩展名
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext =>
    path.toLowerCase().endsWith(ext)
  )
  if (!hasValidExtension) return false

  // 7. 检查路径前缀（白名单）
  const hasValidPrefix = ALLOWED_PATH_PREFIXES.some(prefix =>
    path.startsWith(prefix)
  )
  if (!hasValidPrefix) return false

  // 8. 禁止过多斜杠
  if (path.includes('//')) return false

  // 9. 禁止特殊字符
  if (/[<>:"|?*]/.test(path)) return false

  return true
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  // 安全验证：检查路径是否安全
  if (!isPathSafe(path)) {
    console.warn(`[AudioProxy] Blocked unsafe path: ${path}`)
    return NextResponse.json(
      { error: 'Invalid or unsafe path' },
      { status: 400 }
    )
  }

  // 构建安全的 OSS URL
  const ossUrl = `${OSS_BASE_URL}/${path}`

  try {
    const response = await fetch(ossUrl, {
      headers: {
        // 转发 Range 请求头（支持音频 seek）
        ...(request.headers.get('range') && { 'Range': request.headers.get('range')! }),
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `OSS error: ${response.status}` },
        { status: response.status }
      )
    }

    // 获取响应体
    const arrayBuffer = await response.arrayBuffer()

    // 构建响应，添加 COEP 兼容头
    const headers = new Headers()

    // 复制必要的响应头
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    const contentRange = response.headers.get('content-range')
    const acceptRanges = response.headers.get('accept-ranges')

    if (contentType) headers.set('Content-Type', contentType)
    if (contentLength) headers.set('Content-Length', contentLength)
    if (contentRange) headers.set('Content-Range', contentRange)
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges)

    // 关键：添加 CORP 头以兼容 COEP
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin')

    // CORS 头
    headers.set('Access-Control-Allow-Origin', '*')

    // 缓存控制（1 小时）
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(arrayBuffer, {
      status: response.status,
      headers,
    })
  } catch (error) {
    console.error('[AudioProxy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audio' },
      { status: 500 }
    )
  }
}
