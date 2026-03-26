/**
 * 配置 OSS Bucket CORS 规则
 * 运行此脚本来自动设置 CORS 规则
 */

import '@/lib/proxy'
import OSS from 'ali-oss'
import https from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'

async function setupOSSCors() {
  console.log('========================================')
  console.log('配置 OSS CORS 规则')
  console.log('========================================\n')

  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
  const region = process.env.OSS_REGION || 'oss-cn-beijing'
  const bucket = process.env.OSS_BUCKET

  if (!accessKeyId || !accessKeySecret || !bucket) {
    console.error('❌ OSS 环境变量未配置')
    process.exit(1)
  }

  // 创建 OSS 客户端
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy
  let httpsAgent: https.Agent
  if (proxyUrl) {
    console.log(`使用代理: ${proxyUrl}`)
    httpsAgent = new HttpsProxyAgent(proxyUrl)
  } else {
    httpsAgent = new https.Agent({ keepAlive: true })
  }

  const client = new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    secure: true,
    // @ts-expect-error httpsAgent is valid
    httpsAgent,
  })

  console.log(`Bucket: ${bucket}`)
  console.log(`Region: ${region}\n`)

  // CORS 规则配置
  const corsRule = {
    allowedOrigin: ['*'], // 允许所有来源，生产环境建议指定具体域名
    allowedMethod: ['GET', 'HEAD', 'POST', 'PUT'],
    allowedHeader: ['*'],
    exposeHeader: ['ETag', 'Content-Length', 'Content-Type', 'x-oss-request-id'],
    maxAgeSeconds: 3600,
  }

  console.log('CORS 规则:')
  console.log(JSON.stringify(corsRule, null, 2))
  console.log()

  try {
    // 设置 CORS 规则
    await client.putBucketCORS(corsRule)
    console.log('✅ CORS 规则设置成功！')

    // 验证设置
    console.log('\n验证 CORS 设置...')
    const result = await client.getBucketCORS()
    console.log('当前 CORS 规则:')
    console.log(JSON.stringify(result.rules, null, 2))

    console.log('\n========================================')
    console.log('配置完成！现在前端可以正常加载音频了')
    console.log('========================================')
  } catch (error) {
    console.error('❌ 设置失败:', error)
    if (error instanceof Error) {
      if (error.message.includes('AccessDenied')) {
        console.log('\n提示: 可能需要 OSS 管理员权限才能设置 CORS 规则')
        console.log('请使用阿里云控制台手动配置')
      }
    }
    process.exit(1)
  }
}

setupOSSCors()
