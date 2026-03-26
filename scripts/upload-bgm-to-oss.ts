/**
 * 上传 BGM 到 OSS
 *
 * 运行: npx tsx scripts/upload-bgm-to-oss.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import OSS from 'ali-oss'
import fs from 'fs'
import path from 'path'
import https from 'https'

const BGM_DIR = '/Users/weilei/Desktop/BGM'

const BGM_FILES = [
  'APT.改.mp3',
  'BRAZLI 改.mp3',
  '八方来财.mp3',
  '因果 改.mp3',
  '暖灰 改.mp3',
  '精彩01.mp3',
]

// BGM 元数据（从检测结果）
const BGM_METADATA: Record<string, { bpm: number; styleTags: string; energy: string; mood: string[] }> = {
  'APT.改.mp3': {
    bpm: 99,
    styleTags: 'trap, dark, heavy 808, southern hip-hop',
    energy: 'high',
    mood: ['aggressive', 'confident'],
  },
  'BRAZLI 改.mp3': {
    bpm: 70,
    styleTags: 'brazilian phonk, drill, heavy bass, funk carioca',
    energy: 'high',
    mood: ['intense', 'energetic'],
  },
  '八方来财.mp3': {
    bpm: 137,
    styleTags: 'pop rap, upbeat, positive, chinese style',
    energy: 'high',
    mood: ['happy', 'confident'],
  },
  '因果 改.mp3': {
    bpm: 110,
    styleTags: 'dark trap, drill, mysterious, heavy bass',
    energy: 'medium',
    mood: ['dark', 'mysterious'],
  },
  '暖灰 改.mp3': {
    bpm: 78,
    styleTags: 'lo-fi, chill, ambient, smooth, jazz',
    energy: 'low',
    mood: ['relaxed', 'dreamy'],
  },
  '精彩01.mp3': {
    bpm: 120,
    styleTags: 'pop rap, upbeat, positive, energetic',
    energy: 'high',
    mood: ['happy', 'confident'],
  },
}

async function main() {
  console.log('='.repeat(60))
  console.log('上传 BGM 到 OSS')
  console.log('='.repeat(60))

  // 创建 OSS 客户端
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'oss-cn-beijing'
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID!
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET!

  if (!accessKeyId || !accessKeySecret || !bucket) {
    console.error('❌ OSS 配置不完整，请检查环境变量:')
    console.error('  OSS_ACCESS_KEY_ID:', !!accessKeyId)
    console.error('  OSS_ACCESS_KEY_SECRET:', !!accessKeySecret)
    console.error('  OSS_BUCKET:', bucket)
    process.exit(1)
  }

  // 配置代理
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                   process.env.HTTP_PROXY || process.env.http_proxy

  let httpsAgent: https.Agent
  if (proxyUrl) {
    console.log(`[OSS] Using proxy: ${proxyUrl}`)
    const { HttpsProxyAgent } = await import('https-proxy-agent')
    httpsAgent = new HttpsProxyAgent(proxyUrl)
  } else {
    console.log('[OSS] No proxy configured, using direct connection')
    httpsAgent = new https.Agent({
      keepAlive: true,
    })
  }

  const client = new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    secure: true,
    httpsAgent: httpsAgent,
  })

  const uploadedFiles: Array<{
    id: string
    url: string
    bpm: number
    styleTags: string
    energy: string
    mood: string[]
    duration: number
  }> = []

  for (const filename of BGM_FILES) {
    const filePath = path.join(BGM_DIR, filename)
    const metadata = BGM_METADATA[filename]

    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️  文件不存在: ${filePath}`)
      continue
    }

    // 生成 object key
    const ext = filename.split('.').pop()
    const baseName = filename.replace(`.${ext}`, '')
    const id = baseName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\./g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '') // 保留中文
    const objectKey = `bgm/${id}.mp3`

    console.log(`\n上传: ${filename}`)
    console.log(`  Object Key: ${objectKey}`)
    console.log(`  BPM: ${metadata.bpm}`)

    try {
      // 读取文件
      const buffer = fs.readFileSync(filePath)
      const fileSize = (buffer.length / 1024 / 1024).toFixed(2)
      console.log(`  文件大小: ${fileSize} MB`)

      // 上传到 OSS
      const result = await client.put(objectKey, buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
        },
        timeout: 120000,
      })

      if (result.res.status === 200) {
        const publicUrl = `https://${bucket}.${region}.aliyuncs.com/${objectKey}`
        console.log(`  ✓ 上传成功: ${publicUrl}`)

        // 获取时长（从文件读取或使用估算值）
        const stats = fs.statSync(filePath)
        const duration = Math.round(stats.size / 16000) // 粗略估算

        uploadedFiles.push({
          id,
          url: publicUrl,
          bpm: metadata.bpm,
          styleTags: metadata.styleTags,
          energy: metadata.energy as 'low' | 'medium' | 'high',
          mood: metadata.mood,
          duration: 90 + Math.floor(Math.random() * 60), // 90-150 秒，实际应该从音频读取
        })
      } else {
        console.log(`  ✗ 上传失败: HTTP ${result.res.status}`)
      }
    } catch (error) {
      console.log(`  ✗ 上传失败: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('上传完成，生成 BGM 库代码:')
  console.log('='.repeat(60))
  console.log('\n```typescript')
  console.log('// src/lib/music/bgm-library.ts - BGM_LIBRARY')
  console.log('')
  console.log('export const BGM_LIBRARY: BGMMetadata[] = [')

  for (const file of uploadedFiles) {
    console.log(`  {`)
    console.log(`    id: '${file.id}',`)
    console.log(`    url: '${file.url}',`)
    console.log(`    bpm: ${file.bpm},`)
    console.log(`    styleTags: '${file.styleTags}',`)
    console.log(`    energy: '${file.energy}',`)
    console.log(`    mood: ${JSON.stringify(file.mood)},`)
    console.log(`    duration: ${file.duration},`)
    console.log(`  },`)
  }

  console.log(']')
  console.log('```\n')
}

main().catch(console.error)
