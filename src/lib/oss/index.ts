/**
 * 阿里云 OSS 上传工具
 * 用于将音频文件上传到 OSS，获取公网可访问的 URL
 */

import OSS from 'ali-oss'
import https from 'https'

// 动态导入 https-proxy-agent（ESM only）
let HttpsProxyAgent: typeof import('https-proxy-agent').HttpsProxyAgent | null = null
async function loadHttpsProxyAgent() {
  if (!HttpsProxyAgent) {
    const module = await import('https-proxy-agent')
    HttpsProxyAgent = module.HttpsProxyAgent
  }
  return HttpsProxyAgent
}

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
// OSS 客户端
// ============================================================================

let ossClient: OSS | null = null
let ossClientPromise: Promise<OSS | null> | null = null

/**
 * 获取 OSS 客户端实例（异步）
 */
async function getOSSClient(): Promise<OSS | null> {
  if (ossClient) {
    return ossClient
  }

  // 避免重复创建
  if (ossClientPromise) {
    return ossClientPromise
  }

  ossClientPromise = (async () => {
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
    const region = process.env.OSS_REGION || 'oss-cn-beijing'
    const bucket = process.env.OSS_BUCKET

    if (!accessKeyId || !accessKeySecret || !bucket) {
      console.warn('[OSS] OSS configuration not complete, file upload will not work')
      return null
    }

    try {
      // 创建 HTTPS Agent（直连，阿里云 OSS 在当前环境下可正常访问）
      const httpsAgent = new https.Agent({
        keepAlive: true,
      })

      ossClient = new OSS({
        region,
        bucket,
        accessKeyId,
        accessKeySecret,
        secure: true,
        // @ts-expect-error httpsAgent is valid but not in types
        httpsAgent: httpsAgent,
      })
      return ossClient
    } catch (error) {
      console.error('[OSS] Failed to create OSS client:', error)
      return null
    }
  })()

  return ossClientPromise
}

/**
 * 检查 OSS 是否已配置
 */
export function isOSSConfigured(): boolean {
  return !!(process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET && process.env.OSS_BUCKET)
}

/**
 * 上传文件到 OSS
 * @param file 文件数据（Buffer 或 Blob）
 * @param filename 文件名
 * @param options 上传选项
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
  const client = await getOSSClient()

  if (!client) {
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
      // Blob 或 File 都可以用 arrayBuffer
      const arrayBuffer = await (file as Blob).arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }

    // 上传到 OSS
    const result = await client.put(objectKey, buffer, {
      headers: {
        'Content-Type': options?.contentType || 'application/octet-stream',
      },
      timeout: options?.timeout || 60000,
    })

    if (result.res.status === 200) {
      // 构建公网 URL
      const bucket = process.env.OSS_BUCKET!
      const region = process.env.OSS_REGION || 'oss-cn-beijing'
      const publicUrl = `https://${bucket}.${region}.aliyuncs.com/${objectKey}`

      console.log(`[OSS] File uploaded successfully: ${objectKey}`)

      return {
        success: true,
        url: publicUrl,
        objectKey,
      }
    } else {
      return {
        success: false,
        error: `上传失败: HTTP ${result.res.status}`,
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
 * @param objectKey 对象 Key
 */
export async function deleteFromOSS(objectKey: string): Promise<{ success: boolean; error?: string }> {
  const client = await getOSSClient()

  if (!client) {
    return { success: false, error: 'OSS 未配置' }
  }

  try {
    await client.delete(objectKey)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
    }
  }
}

/**
 * 获取 OSS 文件的公网 URL
 * @param objectKey 对象 Key
 * @param expires 过期时间（秒），默认 1 小时
 */
export function getOSSPublicUrl(objectKey: string): string {
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'oss-cn-beijing'
  return `https://${bucket}.${region}.aliyuncs.com/${objectKey}`
}
