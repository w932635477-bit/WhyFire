/**
 * URL 解析 API
 *
 * 把各种音乐分享链接解析为直接音频 URL。
 * 使用 yt-dlp 作为核心解析引擎（支持 YouTube、Bilibili、SoundCloud 等几百个平台）。
 * 解析后下载音频，上传到 OSS，返回 OSS URL。
 *
 * 安全：
 * - SSRF 防护：输入和解析结果 URL 都必须通过 isValidPublicUrl 校验
 * - 下载大小限制：100MB（Content-Length + 流式累积检查）
 * - 速率限制：10 次/分钟/客户端
 *
 * POST /api/cover/resolve-url
 * Body: { url: string }
 * Response: { code: 0, data: { url, title? } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { uploadToOSS, isOSSConfigured } from '@/lib/oss'
import { withOptionalAuth, checkRateLimit, getClientIp } from '@/lib/middleware/auth'
import { isValidPublicUrl } from '@/lib/utils/url-validator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac', '.flac', '.mp4', '.mov', '.wma']
const MAX_DOWNLOAD_SIZE = 100 * 1024 * 1024 // 100MB

function isDirectAudioUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return AUDIO_EXTENSIONS.some(ext => pathname.endsWith(ext))
  } catch {
    return false
  }
}

interface YtdlpResult {
  url: string
  title: string
  duration: number
  ext: string
}

/**
 * 用 yt-dlp 解析 URL，提取音频直链
 */
function resolveWithYtdlp(inputUrl: string): Promise<YtdlpResult> {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--prefer-free-formats',
      '--extract-audio',
      '--format', 'bestaudio/best',
      inputUrl,
    ]

    execFile('python3', ['-m', 'yt_dlp', ...args], {
      timeout: 30000,
      maxBuffer: 5 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        const errMsg = stderr?.trim() || error.message
        console.error(`[ResolveURL] yt-dlp error: ${errMsg}`)

        // 友好错误信息
        if (errMsg.includes('Unsupported URL')) {
          reject(new Error('暂不支持该平台的链接。请直接上传音频文件。'))
        } else if (errMsg.includes('Sign in') || errMsg.includes('login')) {
          reject(new Error('该链接需要登录才能访问。请直接上传音频文件。'))
        } else if (errMsg.includes('Video unavailable') || errMsg.includes('not found')) {
          reject(new Error('该链接无法访问或已被删除。'))
        } else {
          reject(new Error('链接解析失败，请直接上传音频文件。'))
        }
        return
      }

      try {
        const data = JSON.parse(stdout)
        resolve({
          url: data.url || data.webpage_url || '',
          title: data.title || '未知歌曲',
          duration: data.duration || 0,
          ext: data.ext || 'mp3',
        })
      } catch {
        reject(new Error('解析结果格式错误'))
      }
    })
  })
}

/**
 * 下载媒体文件并上传到 OSS
 *
 * 安全：流式读取 + 大小限制，防止内存溢出
 */
async function downloadAndUpload(mediaUrl: string, filename: string): Promise<string> {
  console.log(`[ResolveURL] Downloading: ${mediaUrl.substring(0, 100)}...`)

  // 手动处理重定向，对每个 Location 做 SSRF 校验
  let currentUrl = mediaUrl
  let response: Response | null = null
  for (let i = 0; i < 5; i++) {
    response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      redirect: 'manual',
    })
    const status = response.status
    if (status >= 300 && status < 400) {
      const location = response.headers.get('location')
      if (!location) break
      const nextUrl = new URL(location, currentUrl).toString()
      // 对重定向目标也做 SSRF 校验
      if (!isValidPublicUrl(nextUrl)) {
        throw new Error('下载链接重定向到不安全地址')
      }
      currentUrl = nextUrl
      continue
    }
    break
  }
  // After loop, response is guaranteed non-null (loop always runs at least once)
  if (!response) {
    throw new Error('下载音频失败：无响应')
  }

  if (!response.ok) {
    throw new Error(`下载音频失败 (${response.status})`)
  }

  // 大小检查：先看 Content-Length
  const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
  if (contentLength > MAX_DOWNLOAD_SIZE) {
    throw new Error(`文件过大（${Math.round(contentLength / 1024 / 1024)}MB），最大支持 100MB`)
  }

  const contentType = response.headers.get('content-type') || 'audio/mpeg'

  // 流式读取 + 累积大小检查，防止 Content-Length 伪造或无 Content-Length 时内存溢出
  const chunks: Uint8Array[] = []
  let totalSize = 0
  const reader = response.body!.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalSize += value.length
      if (totalSize > MAX_DOWNLOAD_SIZE) {
        throw new Error('文件过大，最大支持 100MB')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const buffer = Buffer.concat(chunks)

  console.log(`[ResolveURL] Downloaded ${buffer.length} bytes, type=${contentType}`)

  if (buffer.length < 1024) {
    throw new Error('下载的文件太小，可能不是有效的音频文件')
  }

  if (!isOSSConfigured()) {
    throw new Error('OSS 未配置')
  }

  const result = await uploadToOSS(buffer, filename, {
    folder: 'cover-uploads',
    contentType,
    timeout: 120000,
  })

  if (!result.success || !result.url) {
    throw new Error(result.error || '上传到 OSS 失败')
  }

  console.log(`[ResolveURL] Uploaded to OSS: ${result.objectKey}`)
  return result.url
}

export const POST = withOptionalAuth(async (request: NextRequest) => {
  const clientId = getClientIp(request)
  const rateLimit = checkRateLimit(`resolve-url:${clientId}`, 10, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ code: 429, message: '请求过于频繁' }, { status: 429 })
  }

  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ code: 400, message: '请提供 URL' }, { status: 400 })
    }

    // SSRF 防护：验证输入 URL
    if (!isValidPublicUrl(url)) {
      return NextResponse.json({ code: 400, message: '不支持该链接地址' }, { status: 400 })
    }

    // 直接音频链接：不需要解析
    if (isDirectAudioUrl(url)) {
      console.log(`[ResolveURL] Direct audio URL, skipping resolve`)
      return NextResponse.json({ code: 0, data: { url } })
    }

    console.log(`[ResolveURL] Resolving: ${url}`)

    // 用 yt-dlp 解析
    const result = await resolveWithYtdlp(url)

    if (!result.url) {
      return NextResponse.json({
        code: 400,
        message: '无法从该链接提取音频。请直接上传音频文件。',
      }, { status: 400 })
    }

    // SSRF 防护：验证 yt-dlp 解析出的 URL 也是公网地址
    if (!isValidPublicUrl(result.url)) {
      return NextResponse.json({
        code: 400,
        message: '解析结果不安全，请直接上传音频文件。',
      }, { status: 400 })
    }

    // 检查时长限制（SunoAPI 最多 8 分钟）
    if (result.duration > 480) {
      return NextResponse.json({
        code: 400,
        message: `音频时长 ${Math.round(result.duration / 60)} 分钟，超过 8 分钟限制。请选择更短的歌曲。`,
      }, { status: 400 })
    }

    // 下载并上传到 OSS
    const safeName = result.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff\-_.]/g, '_').substring(0, 50)
    const ossUrl = await downloadAndUpload(result.url, `${safeName}.${result.ext}`)

    return NextResponse.json({
      code: 0,
      data: {
        url: ossUrl,
        title: result.title,
      },
    })
  } catch (error) {
    console.error('[ResolveURL] Error:', error)
    return NextResponse.json({
      code: 500,
      message: error instanceof Error ? error.message : '链接解析失败',
    }, { status: 500 })
  }
})
