/**
 * URL 解析 API
 *
 * 把各种音乐分享链接解析为直接音频 URL。
 * 使用 yt-dlp 作为核心解析引擎（支持 YouTube、Bilibili、SoundCloud 等几百个平台）。
 * 解析后下载音频，上传到 OSS，返回 OSS URL。
 *
 * POST /api/cover/resolve-url
 * Body: { url: string }
 * Response: { code: 0, data: { url, title? } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { uploadToOSS, isOSSConfigured } from '@/lib/oss'
import { withOptionalAuth, checkRateLimit } from '@/lib/middleware/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac', '.flac', '.mp4', '.mov', '.wma']

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
 */
async function downloadAndUpload(mediaUrl: string, filename: string): Promise<string> {
  console.log(`[ResolveURL] Downloading: ${mediaUrl.substring(0, 100)}...`)

  const response = await fetch(mediaUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`下载音频失败 (${response.status})`)
  }

  const contentType = response.headers.get('content-type') || 'audio/mpeg'
  const buffer = Buffer.from(await response.arrayBuffer())

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
  const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  const rateLimit = checkRateLimit(`resolve-url:${clientId}`, 10, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ code: 429, message: '请求过于频繁' }, { status: 429 })
  }

  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ code: 400, message: '请提供 URL' }, { status: 400 })
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
