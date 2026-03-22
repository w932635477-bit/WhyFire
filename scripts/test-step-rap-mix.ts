/**
 * Step-Audio 方言 RAP 混音测试
 * 目标：验证 Step-Audio 方言 + 快速语速 是否能产生 RAP 效果
 *
 * 运行: npx tsx scripts/test-step-rap-mix.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import * as fs from 'fs'
import * as path from 'path'

const STEP_API_KEY = process.env.STEP_API_KEY
const STEP_BASE_URL = 'https://api.stepfun.com/v1'

// 完整 RAP 歌词
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

async function synthesizeSpeech(params: {
  input: string
  voice?: string
  speed?: number
  language?: '四川话' | '粤语'
}): Promise<Buffer> {
  const response = await fetch(`${STEP_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STEP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'step-tts-mini',
      input: params.input,
      voice: params.voice || 'cixingnansheng',
      response_format: 'mp3',
      speed: params.speed || 1.0,
      voice_label: params.language ? { language: params.language } : undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Step-Audio API error: ${response.status} - ${error}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

function saveAudio(buffer: Buffer, filename: string): string {
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
  console.log('  Step-Audio 方言 RAP 混音测试')
  console.log('========================================\n')

  if (!STEP_API_KEY) {
    console.error('❌ STEP_API_KEY 未配置')
    process.exit(1)
  }

  console.log('✅ STEP_API_KEY 已配置\n')

  // 测试不同语速的四川话
  const speedTests = [
    { speed: 1.0, desc: '正常语速' },
    { speed: 1.2, desc: '1.2倍速' },
    { speed: 1.4, desc: '1.4倍速' },
    { speed: 1.6, desc: '1.6倍速' },
  ]

  console.log('=== 测试不同语速的四川话 RAP ===\n')

  // 只用前4行测试，避免太长
  const shortLyrics = `今天天气巴适得很
出来耍一耍心情嫩个好
看嘛这天蓝得很安逸
兄弟伙些一起搞起来`

  for (const test of speedTests) {
    try {
      console.log(`生成 ${test.desc} (speed=${test.speed})...`)
      const audio = await synthesizeSpeech({
        input: shortLyrics,
        language: '四川话',
        speed: test.speed,
      })
      const filepath = saveAudio(audio, `step-sichuan-rap-speed-${test.speed}.mp3`)
      console.log(`✅ 成功: ${filepath}`)
      console.log(`   大小: ${(audio.length / 1024).toFixed(2)} KB\n`)

      // 等待一下避免速率限制
      await new Promise(r => setTimeout(r, 7000))
    } catch (error) {
      console.error(`❌ 失败:`, error instanceof Error ? error.message : error, '\n')
    }
  }

  console.log('========================================')
  console.log('  测试完成！')
  console.log('========================================')
  console.log('\n请播放以下文件，找出最有 RAP 感的语速：')
  console.log('- step-sichuan-rap-speed-1.0.mp3 (正常)')
  console.log('- step-sichuan-rap-speed-1.2.mp3')
  console.log('- step-sichuan-rap-speed-1.4.mp3')
  console.log('- step-sichuan-rap-speed-1.6.mp3')
  console.log('\n下一步：选择最佳语速 + 添加 Rap Beat 背景音乐')
}

main().catch(console.error)
