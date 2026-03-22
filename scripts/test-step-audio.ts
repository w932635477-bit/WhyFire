/**
 * Step-Audio TTS API 测试脚本
 * 运行: npx tsx scripts/test-step-audio.ts
 *
 * 确保 .env.local 文件中有 STEP_API_KEY
 *
 * 测试目标：
 * 1. 验证方言（四川话）发音质量
 * 2. 寻找/测试 RAP 功能
 */

// 手动加载 .env.local
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import * as fs from 'fs'
import * as path from 'path'

const STEP_API_KEY = process.env.STEP_API_KEY
const STEP_BASE_URL = 'https://api.stepfun.com/v1'

// 测试文本
const TEST_TEXTS = {
  sichuan: `今天天气巴适得很，出来耍一耍心情嫩个好。看嘛这天蓝得很安逸，兄弟伙些一起搞起来。`,
  dongbei: `哎呀妈呀，今天这天咋这么好呢！出来溜达溜达，心情贼拉好！`,
  mandarin: `今天天气真好，出来玩一玩心情特别棒。看这蓝天白云，朋友们一起嗨起来。`,
  rap_lyrics: `[Verse 1]
今天天气巴适得很
出来耍一耍心情嫩个好
看嘛这天蓝得很安逸
兄弟伙些一起搞起来

[Chorus]
四川人的热情像火锅
大口吃肉大口喝酒嘛
麻婆豆腐回锅肉好香
这种日子硬是安逸得很`,
}

interface TTSRequest {
  model: string
  input: string
  voice: string
  response_format?: 'mp3' | 'wav' | 'flac' | 'opus' | 'pcm'
  speed?: number
  volume?: number
  voice_label?: {
    language?: '粤语' | '四川话' | '日语'
    emotion?: string
    style?: string
  }
}

interface TTSResponse {
  audioBuffer: Buffer
  duration: number
}

/**
 * 调用 Step-Audio TTS API
 */
async function synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
  const response = await fetch(`${STEP_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STEP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Step-Audio API error: ${response.status} - ${error}`)
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())

  // 估算时长（约 3-4 字/秒）
  const duration = Math.ceil(request.input.length / 3.5)

  return { audioBuffer, duration }
}

/**
 * 保存音频文件
 */
function saveAudio(buffer: Buffer, filename: string): string {
  const outputDir = path.resolve(process.cwd(), 'test-output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  const filepath = path.join(outputDir, filename)
  fs.writeFileSync(filepath, buffer)
  return filepath
}

/**
 * 测试基础 TTS 功能
 */
async function testBasicTTS() {
  console.log('\n=== 测试 1: 基础 TTS (普通话) ===\n')

  try {
    const result = await synthesizeSpeech({
      model: 'step-tts-mini',
      input: TEST_TEXTS.mandarin,
      voice: 'cixingnansheng', // 磁性男声
      response_format: 'mp3',
    })

    const filepath = saveAudio(result.audioBuffer, 'step-basic-mandarin.mp3')
    console.log(`✅ 普通话 TTS 成功`)
    console.log(`   文件: ${filepath}`)
    console.log(`   大小: ${(result.audioBuffer.length / 1024).toFixed(2)} KB`)
    console.log(`   估算时长: ${result.duration}s`)
  } catch (error) {
    console.error('❌ 普通话 TTS 失败:', error)
  }
}

/**
 * 测试四川话方言
 */
async function testSichuanDialect() {
  console.log('\n=== 测试 2: 四川话方言 ===\n')

  try {
    const result = await synthesizeSpeech({
      model: 'step-tts-mini',
      input: TEST_TEXTS.sichuan,
      voice: 'cixingnansheng',
      response_format: 'mp3',
      voice_label: {
        language: '四川话',
      },
    })

    const filepath = saveAudio(result.audioBuffer, 'step-sichuan-dialect.mp3')
    console.log(`✅ 四川话 TTS 成功`)
    console.log(`   文件: ${filepath}`)
    console.log(`   大小: ${(result.audioBuffer.length / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error('❌ 四川话 TTS 失败:', error)
  }
}

/**
 * 测试不同风格（注意：language/emotion/style 只能三选一）
 */
async function testStyles() {
  console.log('\n=== 测试 3: 不同风格（只用 style，不用 language）===\n')

  // 只用 style，不用 language（因为 API 不支持组合）
  const styles = ['快速', '极快']

  for (const style of styles) {
    try {
      const result = await synthesizeSpeech({
        model: 'step-tts-mini',
        input: TEST_TEXTS.sichuan.substring(0, 30), // 短文本加快测试
        voice: 'cixingnansheng',
        response_format: 'mp3',
        voice_label: {
          style, // 只用 style，不用 language
        },
      })

      const filepath = saveAudio(result.audioBuffer, `step-style-${style}.mp3`)
      console.log(`✅ 风格 "${style}" 成功: ${filepath}`)
    } catch (error) {
      console.error(`❌ 风格 "${style}" 失败:`, error instanceof Error ? error.message : error)
    }
  }

  // 测试情绪
  console.log('\n测试情绪...')
  const emotions = ['高兴', '兴奋']

  for (const emotion of emotions) {
    try {
      const result = await synthesizeSpeech({
        model: 'step-tts-mini',
        input: TEST_TEXTS.sichuan.substring(0, 30),
        voice: 'cixingnansheng',
        response_format: 'mp3',
        voice_label: {
          emotion,
        },
      })

      const filepath = saveAudio(result.audioBuffer, `step-emotion-${emotion}.mp3`)
      console.log(`✅ 情绪 "${emotion}" 成功: ${filepath}`)
    } catch (error) {
      console.error(`❌ 情绪 "${emotion}" 失败:`, error instanceof Error ? error.message : error)
    }
  }
}

/**
 * 测试 RAP 相关 - 尝试各种可能的 RAP 触发方式
 */
async function testRapCapability() {
  console.log('\n=== 测试 4: RAP 功能探测 ===\n')

  // 尝试可能的 RAP 风格名称
  const possibleRapStyles = [
    'rap', 'RAP', 'Rap', '说唱', '饶舌',
    'rapping', 'hiphop', 'hip-hop',
  ]

  console.log('测试可能的 RAP 风格名称...')

  for (const style of possibleRapStyles) {
    try {
      const result = await synthesizeSpeech({
        model: 'step-tts-mini',
        input: '测试说唱',
        voice: 'cixingnansheng',
        response_format: 'mp3',
        voice_label: {
          language: '四川话',
          style,
        },
      })
      console.log(`✅ 风格 "${style}" 被接受！`)
      const filepath = saveAudio(result.audioBuffer, `step-rap-test-${style}.mp3`)
      console.log(`   文件: ${filepath}`)
    } catch (error) {
      console.log(`❌ 风格 "${style}" 不被支持`)
    }
  }

  // 尝试在 input 中用特殊标记
  console.log('\n测试在文本中加入 RAP 标记...')
  const rapMarkers = [
    { input: '[RAP] 今天天气巴适得很', desc: '前缀 [RAP]' },
    { input: '<rap>今天天气巴适得很</rap>', desc: 'XML 标签' },
    { input: '(说唱) 今天天气巴适得很', desc: '括号说唱' },
    { input: '用说唱的方式念：今天天气巴适得很', desc: '指令式' },
  ]

  for (const marker of rapMarkers) {
    try {
      const result = await synthesizeSpeech({
        model: 'step-tts-mini',
        input: marker.input,
        voice: 'cixingnansheng',
        response_format: 'mp3',
        voice_label: {
          language: '四川话',
        },
      })
      console.log(`✅ "${marker.desc}" 可用`)
      const filepath = saveAudio(result.audioBuffer, `step-rap-marker-${marker.desc.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`)
      console.log(`   文件: ${filepath}`)
    } catch (error) {
      console.log(`❌ "${marker.desc}" 失败`)
    }
  }
}

/**
 * 测试完整 RAP 歌词
 */
async function testFullRapLyrics() {
  console.log('\n=== 测试 5: 完整 RAP 歌词（对比测试）===\n')

  // 测试 A: 四川话方言（不用 style）
  console.log('测试 A: 四川话方言...')
  try {
    const result = await synthesizeSpeech({
      model: 'step-tts-mini',
      input: TEST_TEXTS.rap_lyrics,
      voice: 'cixingnansheng',
      response_format: 'mp3',
      speed: 1.2,
      voice_label: {
        language: '四川话', // 只用 language
      },
    })

    const filepath = saveAudio(result.audioBuffer, 'step-rap-sichuan-dialect.mp3')
    console.log(`✅ 四川话 RAP 歌词成功`)
    console.log(`   文件: ${filepath}`)
    console.log(`   大小: ${(result.audioBuffer.length / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error('❌ 四川话 RAP 歌词失败:', error)
  }

  // 测试 B: 普通话 + 极快风格（测试是否有节奏感）
  console.log('\n测试 B: 普通话 + 极快风格...')
  try {
    const result = await synthesizeSpeech({
      model: 'step-tts-mini',
      input: TEST_TEXTS.rap_lyrics,
      voice: 'cixingnansheng',
      response_format: 'mp3',
      speed: 1.3,
      voice_label: {
        style: '极快', // 只用 style
      },
    })

    const filepath = saveAudio(result.audioBuffer, 'step-rap-fast-style.mp3')
    console.log(`✅ 普通话+极快 RAP 歌词成功`)
    console.log(`   文件: ${filepath}`)
    console.log(`   大小: ${(result.audioBuffer.length / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error('❌ 普通话+极快 RAP 歌词失败:', error)
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('========================================')
  console.log('  Step-Audio TTS API 测试')
  console.log('========================================')

  // 检查 API Key
  if (!STEP_API_KEY) {
    console.error('\n❌ STEP_API_KEY 未配置')
    console.log('\n请在 .env.local 中添加:')
    console.log('STEP_API_KEY=your_step_api_key_here')
    console.log('\n获取 API Key: https://platform.stepfun.com')
    process.exit(1)
  }

  console.log('\n✅ STEP_API_KEY 已配置')

  try {
    // 依次运行测试
    await testBasicTTS()
    await testSichuanDialect()
    await testStyles()
    await testRapCapability()
    await testFullRapLyrics()

    console.log('\n========================================')
    console.log('  测试完成！')
    console.log('========================================')
    console.log('\n📁 音频文件保存在: test-output/')
    console.log('\n请手动播放音频文件，评估：')
    console.log('1. 四川话发音是否地道')
    console.log('2. 是否有 RAP 的节奏感')
    console.log('3. 与爆款视频的差距')
  } catch (error) {
    console.error('\n测试过程出错:', error)
    process.exit(1)
  }
}

main().catch(console.error)
