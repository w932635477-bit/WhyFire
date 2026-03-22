/**
 * Mureka API 测试脚本
 * 验证方言 RAP 能力
 *
 * 运行: npx tsx scripts/test-mureka.ts
 *
 * 确保设置 MUREKA_API_KEY 环境变量
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import * as fs from 'fs'
import * as path from 'path'

const MUREKA_API_KEY = process.env.MUREKA_API_KEY
const MUREKA_BASE_URL = 'https://api.mureka.ai/v1'

// 测试歌词 - 四川话 RAP
const RAP_LYRICS = `[Verse 1]
今天天气巴适得很
出来耍一耍心情嫩个好
看嘛这天蓝得很安逸
兄弟伙些一起搞起来

[Chorus]
四川人的热情像火锅
大口吃肉大口喝酒嘛
麻婆豆腐回锅肉好香
这种日子硬是安逸得很`

interface SongGenerateRequest {
  lyrics: string
  title?: string
  desc?: string
  vocal_gender?: 'female' | 'male'
  model?: 'V8' | 'O2' | 'V7.6' | 'V7.5'
}

interface SongGenerateResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  results?: Array<{
    id: string
    audio_url: string
    duration: number
    title: string
  }>
  error?: {
    code: string
    message: string
  }
}

/**
 * 生成歌曲
 */
async function generateSong(request: SongGenerateRequest): Promise<{ taskId: string }> {
  const response = await fetch(`${MUREKA_BASE_URL}/song/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MUREKA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || 'V8',
      lyrics: request.lyrics,
      title: request.title || 'WhyFire Test',
      desc: request.desc || 'chinese rap, hip-hop, trap, sichuan dialect',
      vocal_gender: request.vocal_gender || 'male',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Mureka API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return { taskId: data.id || data.task_id }
}

/**
 * 查询任务状态
 */
async function queryTask(taskId: string): Promise<SongGenerateResponse> {
  const response = await fetch(`${MUREKA_BASE_URL}/song/query/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${MUREKA_API_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to query task: ${response.status} - ${error}`)
  }

  return await response.json()
}

/**
 * 轮询等待结果
 */
async function pollTask(taskId: string, timeout = 180000): Promise<SongGenerateResponse> {
  const startTime = Date.now()
  const pollInterval = 5000 // 5秒轮询一次

  while (Date.now() - startTime < timeout) {
    const task = await queryTask(taskId)

    console.log(`[Mureka] Task ${taskId} status: ${task.status}, progress: ${task.progress || 0}%`)

    if (task.status === 'completed') {
      return task
    }

    if (task.status === 'failed') {
      throw new Error(`Task failed: ${task.error?.message || 'Unknown error'}`)
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  throw new Error('Task timeout - took longer than 3 minutes')
}

/**
 * 下载并保存音频
 */
async function saveAudio(url: string, filename: string): Promise<string> {
  const response = await fetch(url)
  const buffer = Buffer.from(await response.arrayBuffer())

  const outputDir = path.resolve(process.cwd(), 'test-output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const filepath = path.join(outputDir, filename)
  fs.writeFileSync(filepath, buffer)
  return filepath
}

async function main() {
  console.log('========================================')
  console.log('  Mureka API 方言 RAP 测试')
  console.log('========================================\n')

  if (!MUREKA_API_KEY) {
    console.error('❌ MUREKA_API_KEY 未配置')
    console.log('\n请访问 https://platform.mureka.ai/ 获取 API Key')
    console.log('然后添加到 .env.local:')
    console.log('MUREKA_API_KEY=your_mureka_api_key_here')
    process.exit(1)
  }

  console.log('✅ MUREKA_API_KEY 已配置\n')

  // 测试用例
  const tests = [
    {
      name: '四川话 RAP (V8)',
      request: {
        lyrics: RAP_LYRICS,
        title: '四川Rap测试',
        desc: 'chinese rap, hip-hop, trap, sichuan dialect, mandarin',
        model: 'V8' as const,
        vocal_gender: 'male' as const,
      },
    },
    {
      name: '东北话 RAP (V8)',
      request: {
        lyrics: `[Verse 1]
哎呀妈呀今天真带劲
出来溜达溜达心情贼拉好
瞅这天儿蓝得跟画似的
老铁们一起整起来

[Chorus]
东北人的热情像锅包肉
大口撸串大口整啤酒
地三鲜小鸡炖蘑菇老香了
这日子过得那是杠杠的`,
        title: '东北Rap测试',
        desc: 'chinese rap, hip-hop, trap, northeast dialect, dongbei',
        model: 'V8' as const,
        vocal_gender: 'male' as const,
      },
    },
  ]

  for (const test of tests) {
    console.log(`\n=== 测试: ${test.name} ===\n`)

    try {
      // 生成歌曲
      console.log('创建生成任务...')
      const { taskId } = await generateSong(test.request)
      console.log(`✅ 任务已创建: ${taskId}`)

      // 轮询等待结果
      console.log('\n等待生成完成 (约 45-90 秒)...')
      const result = await pollTask(taskId)

      if (result.results && result.results.length > 0) {
        console.log(`\n✅ 生成成功! 共 ${result.results.length} 个版本`)

        for (let i = 0; i < result.results.length; i++) {
          const song = result.results[i]
          console.log(`\n版本 ${i + 1}:`)
          console.log(`  - ID: ${song.id}`)
          console.log(`  - 标题: ${song.title}`)
          console.log(`  - 时长: ${song.duration}s`)

          // 下载音频
          if (song.audio_url) {
            console.log(`  - 下载中...`)
            const filename = `mureka-${test.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-v${i + 1}.mp3`
            const filepath = await saveAudio(song.audio_url, filename)
            console.log(`  ✅ 已保存: ${filepath}`)
          }
        }
      } else {
        console.log('⚠️ 任务完成但没有生成结果')
      }

    } catch (error) {
      console.error(`❌ 测试失败:`, error instanceof Error ? error.message : error)
    }

    // 等待避免速率限制
    console.log('\n等待 10 秒...')
    await new Promise(resolve => setTimeout(resolve, 10000))
  }

  console.log('\n========================================')
  console.log('  测试完成！')
  console.log('========================================')
  console.log('\n📁 音频文件保存在: test-output/')
  console.log('\n请手动播放音频文件，评估：')
  console.log('1. 方言发音是否地道（四川话/东北话）')
  console.log('2. 是否有 RAP 的节奏感')
  console.log('3. 与 Step-Audio + 混音方案的对比')
}

main().catch(console.error)
