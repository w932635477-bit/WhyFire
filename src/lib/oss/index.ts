/**
 * 阿里云 OSS 上传工具（undici fetch + V1 签名）
 *
 * 不依赖 ali-oss SDK，避免 urllib/webpack 兼容性问题。
 * 使用 OSS V1 签名 + undici fetch PUT 上传。
 *
 * 代理支持：通过 undici ProxyAgent 读取 HTTP_PROXY/HTTPS_PROXY 环境变量。
 * 生产环境（无代理）直连，无需任何额外配置。
 */

import crypto from 'crypto'
import { proxiedFetch } from '@/lib/fetch'

// ============================================================================
// 类型定义
// ============================================================================

export interface OSSUploadResult {
  success: boolean
  url?: string
  objectKey?: string
  error?: string
}

export interface OSSConfig {
  accessKeyId: string
  accessKeySecret: string
  region: string
  bucket: string
  endpoint?: string
}

// ============================================================================
// OSS V1 签名
// ============================================================================

/**
 * 构建 OSS V1 签名
 * Signature = Base64(HMAC-SHA1(AccessKeySecret, CanonicalString))
 */
function signOSSRequest(
  accessKeySecret: string,
  method: string,
  resourcePath: string,
  headers: Record<string, string>,
  date: string
): string {
  const OSS_PREFIX = 'x-oss-'

  // 收集 x-oss-* headers，排序
  const ossHeaders: string[] = []
  const lowerHeaders: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = v
  }
  Object.keys(lowerHeaders)
    .filter(k => k.startsWith(OSS_PREFIX))
    .sort()
    .forEach(k => {
      ossHeaders.push(`${k}:${lowerHeaders[k]}`)
    })

  // CanonicalString
  const canonicalString = [
    method.toUpperCase(),
    lowerHeaders['content-md5'] || '',
    lowerHeaders['content-type'] || '',
    date,
    ...ossHeaders,
    resourcePath,
  ].join('\n')

  // HMAC-SHA1 签名
  return crypto
    .createHmac('sha1', accessKeySecret)
    .update(Buffer.from(canonicalString, 'utf-8'))
    .digest('base64')
}

// ============================================================================
// OSS 操作
// ============================================================================

/**
 * 检查 OSS 是否已配置
 */
export function isOSSConfigured(): boolean {
  return !!(
    process.env.OSS_ACCESS_KEY_ID &&
    process.env.OSS_ACCESS_KEY_SECRET &&
    process.env.OSS_BUCKET
  )
}

/**
 * 上传文件到 OSS（undici fetch PUT）
 */
export async function uploadToOSS(
  file: Buffer | Blob | File,
  filename: string,
  options?: {
    folder?: string
    contentType?: string
    timeout?: number
  }
): Promise<OSSUploadResult> {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
  const region = process.env.OSS_REGION || 'oss-cn-beijing'
  const bucket = process.env.OSS_BUCKET

  if (!accessKeyId || !accessKeySecret || !bucket) {
    return {
      success: false,
      error: 'OSS 未配置，请设置 OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET 环境变量',
    }
  }

  try {
    // 生成对象 Key
    const folder = options?.folder || 'voice-cloning'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = filename.split('.').pop() || 'bin'
    const objectKey = `${folder}/${timestamp}-${randomStr}.${ext}`

    // 准备上传数据
    let buffer: Buffer
    if (Buffer.isBuffer(file)) {
      buffer = file
    } else {
      const arrayBuffer = await (file as Blob).arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }

    const contentType = options?.contentType || 'application/octet-stream'
    const date = new Date().toUTCString()
    const host = `${bucket}.${region}.aliyuncs.com`
    const resourcePath = `/${bucket}/${objectKey}`

    // 构建签名 headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
      'Date': date,
      'Host': host,
    }

    const signature = signOSSRequest(accessKeySecret, 'PUT', resourcePath, headers, date)
    headers['Authorization'] = `OSS ${accessKeyId}:${signature}`

    // 上传 URL
    const url = `https://${host}/${objectKey}`

    console.log(`[OSS] Uploading ${buffer.length} bytes to ${objectKey}`)

    const response = await proxiedFetch(url, {
      method: 'PUT',
      headers,
      body: buffer as unknown as BodyInit,
      signal: AbortSignal.timeout(options?.timeout || 60000),
    })

    if (response.ok) {
      console.log(`[OSS] Upload success: ${objectKey}`)
      return {
        success: true,
        url,
        objectKey,
      }
    } else {
      const errorText = await response.text()
      console.error(`[OSS] Upload failed: HTTP ${response.status} - ${errorText}`)
      return {
        success: false,
        error: `上传失败: HTTP ${response.status}`,
      }
    }
  } catch (error) {
    console.error('[OSS] Upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    }
  }
}

/**
 * 删除 OSS 上的文件
 */
export async function deleteFromOSS(objectKey: string): Promise<{ success: boolean; error?: string }> {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
  const region = process.env.OSS_REGION || 'oss-cn-beijing'
  const bucket = process.env.OSS_BUCKET

  if (!accessKeyId || !accessKeySecret || !bucket) {
    return { success: false, error: 'OSS 未配置' }
  }

  try {
    const date = new Date().toUTCString()
    const host = `${bucket}.${region}.aliyuncs.com`
    const resourcePath = `/${bucket}/${objectKey}`
    const headers: Record<string, string> = {
      'Date': date,
      'Host': host,
    }
    const signature = signOSSRequest(accessKeySecret, 'DELETE', resourcePath, headers, date)
    headers['Authorization'] = `OSS ${accessKeyId}:${signature}`

    const url = `https://${host}/${objectKey}`

    const response = await proxiedFetch(url, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(30000),
    })

    if (response.ok || response.status === 204) {
      return { success: true }
    }
    return {
      success: false,
      error: `删除失败: HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
    }
  }
}

/**
 * 获取 OSS 文件的公网 URL
 */
export function getOSSPublicUrl(objectKey: string): string {
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'oss-cn-beijing'
  return `https://${bucket}.${region}.aliyuncs.com/${objectKey}`
}

/**
 * 生成 OSS 签名 URL（临时公开访问）
 *
 * 使用 OSS V1 签名方式，适用于私有 bucket 对外分享文件。
 * 默认有效期 1 小时。
 */
export function getOSSsignedUrl(objectKey: string, expiresSeconds: number = 3600): string {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'oss-cn-beijing'

  if (!accessKeyId || !accessKeySecret) {
    // 没有密钥时返回普通 URL（公开 bucket 可用）
    return getOSSPublicUrl(objectKey)
  }

  const expires = Math.floor(Date.now() / 1000) + expiresSeconds
  const resourcePath = `/${bucket}/${objectKey}`

  // CanonicalString for signed URL: GET\n\n\n{expires}\n{resource}
  const canonicalString = `GET\n\n\n${expires}\n${resourcePath}`
  const signature = crypto
    .createHmac('sha1', accessKeySecret)
    .update(Buffer.from(canonicalString, 'utf-8'))
    .digest('base64')

  const encodedSig = encodeURIComponent(signature)
  return `https://${bucket}.${region}.aliyuncs.com/${objectKey}?OSSAccessKeyId=${accessKeyId}&Expires=${expires}&Signature=${encodedSig}`
}
