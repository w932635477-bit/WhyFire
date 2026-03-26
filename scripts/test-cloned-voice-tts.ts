#!/usr/bin/env npx tsx
/**
 * 测试克隆音色 + 方言 TTS 完整流程
 *
 * 测试场景：
 * 1. 检查服务配置
 * 2. 创建复刻音色（真实 API 调用）
 * 3. 等待审核通过（最长 5 分钟）
 * 4. 使用克隆音色生成方言语音
 * 5. 验证 instruction 参数生效
 *
 * 运行方式：
 *   npx tsx scripts/test-cloned-voice-tts.ts
 *
 * 前置条件：
 *   - 设置 DASHSCOPE_API_KEY 环境变量
 *   - 设置 OSS 配置（OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET）
 *   - 准备一个测试音频文件（10秒-5分钟）
 *
 * 快速测试（使用已有 voiceId）：
 *   TEST_VOICE_ID=clone_xxx npx tsx scripts/test-cloned-voice-tts.ts
 */

// 加载环境变量
import { config } from 'dotenv'
config({ path: '.env.local' })

import { getCosyVoiceCloneClient, getDialectInstruction } from '../src/lib/tts/cosyvoice-clone-client'
import { getCosyVoiceClient, isCosyVoiceDialect } from '../src/lib/tts/cosyvoice-client'
import { getQwenTTSClient, hasDialectVoice } from '../src/lib/tts/qwen-tts-client'
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'

// 方言名称映射
const DIALECT_NAMES: Record<string, string> = {
  mandarin: '普通话',
  cantonese: '粤语',
  sichuan: '四川话',
  dongbei: '东北话',
  wu: '上海话',
  shaanxi: '陕西话',
  minnan: '闽南语',
  tianjin: '天津话',
  nanjing: '南京话',
}

// 测试音频文件路径
const TEST_AUDIO_PATH = process.env.TEST_AUDIO_PATH || join(process.cwd(), 'test-audio.mp3')

// 测试文本
const TEST_TEXTS: Record<string, string> = {
  mandarin: '大家好，我是测试音色。今天天气很好，我们来测试一下方言语音合成。',
  cantonese: '大家好，我系粤语测试。今日天气好好，适合出去行街。',
  sichuan: '大家好，我是四川话测试。今天天气巴适得很，安逸得很。',
  dongbei: '哎呀妈呀，今天咋这么冷呢，赶紧整点热乎的。',
  wu: '大家好，我是上海话测试。今朝天气老好了。',
  shaanxi: '大家好，我是陕西话测试。今儿个天气好得很。',
  minnan: '大家好，我是闽南语测试。今仔日天气真好。',
  tianjin: '大家好，我是天津话测试。介天儿不错啊。',
  nanjing: '大家好，我是南京话测试。今天天气蛮好的。',
}

// ============================================================================
// 辅助函数
// ============================================================================

function saveAudioFile(buffer: Buffer, filename: string) {
  const outputDir = join(process.cwd(), 'test-output')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }
  const filepath = join(outputDir, filename)
  writeFileSync(filepath, buffer)
  console.log(`    📁 保存到: ${filepath}`)
  return filepath
}

function logStep(step: number, title: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📋 Step ${step}: ${title}`)
  console.log('='.repeat(60))
}

// ============================================================================
// 测试主函数
// ============================================================================

async function testClonedVoiceTTS() {
  console.log('\n🎤 克隆音色 + 方言 TTS 测试')
  console.log('='.repeat(60))

  // Step 1: 检查服务配置
  logStep(1, '检查服务配置')

  const cloneClient = getCosyVoiceCloneClient()
  const cosyvoiceClient = getCosyVoiceClient()
  const qwenTTSClient = getQwenTTSClient()

  if (!cloneClient.isConfigured()) {
    console.log('  ❌ CosyVoice Clone API 未配置')
    console.log('  ℹ️  请设置 DASHSCOPE_API_KEY 环境变量')
    return false
  }
  console.log('  ✅ CosyVoice Clone API 已配置')

  if (!cosyvoiceClient.isConfigured()) {
    console.log('  ❌ CosyVoice TTS API 未配置')
    return false
  }
  console.log('  ✅ CosyVoice TTS API 已配置')

  if (qwenTTSClient.isConfigured()) {
    console.log('  ✅ Qwen-TTS API 已配置（作为回退）')
  } else {
    console.log('  ℹ️  Qwen-TTS API 未配置（天津话、南京话将无法使用）')
  }

  // Step 2: 检查测试音频
  logStep(2, '检查测试音频')

  const USE_EXISTING_VOICE_ID = process.env.TEST_VOICE_ID
  let voiceId: string

  if (USE_EXISTING_VOICE_ID) {
    voiceId = USE_EXISTING_VOICE_ID
    console.log(`  ✅ 使用已有 voiceId: ${voiceId}`)
  } else {
    if (!existsSync(TEST_AUDIO_PATH)) {
      console.log(`  ❌ 测试音频不存在: ${TEST_AUDIO_PATH}`)
      console.log('  ℹ️  请设置 TEST_AUDIO_PATH 环境变量，或放置 test-audio.mp3 到项目根目录')
      console.log('  ℹ️  音频要求：10秒-5分钟，清晰人声，无背景音乐')
      console.log('  ℹ️  或者设置 TEST_VOICE_ID 环境变量使用已有音色')
      return false
    }

    const audioBuffer = readFileSync(TEST_AUDIO_PATH)
    console.log(`  ✅ 测试音频已加载: ${TEST_AUDIO_PATH}`)
    console.log(`  ℹ️  文件大小: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`)

    // Step 3: 创建复刻音色
    logStep(3, '创建复刻音色')

    const prefix = Date.now().toString(36).slice(-10).padStart(6, '0')
    console.log(`  ℹ️  音色前缀: ${prefix}`)
    console.log('  ℹ️  正在创建复刻音色...')

    // 转换为 Base64
    const audioBase64 = audioBuffer.toString('base64')

    const createResult = await cloneClient.createVoice({
      audioData: audioBase64,
      prefix,
      targetModel: 'cosyvoice-v3-flash',
      languageHints: ['zh'],
    })

    if (!createResult.success) {
      console.log(`  ❌ 创建失败: ${createResult.error}`)
      return false
    }

    voiceId = createResult.voiceId!
    console.log(`  ✅ 复刻音色已创建: ${voiceId}`)

    // Step 4: 等待审核通过
    logStep(4, '等待审核通过')

    console.log('  ℹ️  正在等待审核...（最长 5 分钟）')
    const startTime = Date.now()

    const reviewResult = await cloneClient.waitForVoiceReady(voiceId, 300000, 5000)

    const waitTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`  ℹ️  等待时间: ${waitTime} 秒`)

    if (!reviewResult.ready) {
      console.log(`  ❌ 审核未通过: ${reviewResult.error}`)
      return false
    }

    console.log('  ✅ 审核已通过！')
  }

  // Step 5: 测试方言 TTS
  logStep(5, '测试克隆音色 + 方言 TTS')

  const testDialects = ['mandarin', 'sichuan', 'dongbei', 'cantonese']

  for (const dialect of testDialects) {
    const dialectName = DIALECT_NAMES[dialect] || dialect
    console.log(`\n  --- 测试 ${dialectName} ---`)

    const text = TEST_TEXTS[dialect]
    const instruction = getDialectInstruction(dialect)

    console.log(`  ℹ️  指令: ${instruction}`)
    console.log(`  ℹ️  文本: ${text.substring(0, 30)}...`)

    try {
      if (isCosyVoiceDialect(dialect)) {
        // CosyVoice 支持
        const result = await cosyvoiceClient.generate({
          text,
          dialect: dialect as any,
          voiceId,
          instruction,
          format: 'mp3',
          sampleRate: 22050,
        })

        saveAudioFile(result.audioBuffer, `cloned-${dialect}-${Date.now()}.mp3`)
        console.log(`  ✅ 生成成功，时长: ${result.duration}s, 字符数: ${result.characters}`)
      } else {
        console.log('  ℹ️  CosyVoice 不支持此方言，跳过')
      }
    } catch (error) {
      console.log(`  ❌ 生成失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  // Step 6: 测试回退方言
  logStep(6, '测试不支持的方言（回退到 Qwen-TTS）')

  const fallbackDialects = ['tianjin', 'nanjing']

  for (const dialect of fallbackDialects) {
    const dialectName = DIALECT_NAMES[dialect] || dialect
    console.log(`\n  --- 测试 ${dialectName}（回退）---`)

    if (!qwenTTSClient.isConfigured()) {
      console.log('  ℹ️  跳过（Qwen-TTS 未配置）')
      continue
    }

    if (!hasDialectVoice(dialect)) {
      console.log(`  ℹ️  方言 ${dialect} 没有原生 Qwen-TTS 音色，跳过`)
      continue
    }

    const text = TEST_TEXTS[dialect]

    try {
      const result = await qwenTTSClient.generate({
        text,
        dialect: dialect as any,
        format: 'mp3',
        sampleRate: 24000,
      })

      saveAudioFile(result.audioBuffer, `fallback-${dialect}-${Date.now()}.mp3`)
      console.log(`  ✅ 生成成功，时长: ${result.duration}s`)
    } catch (error) {
      console.log(`  ❌ 生成失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  // 总结
  console.log(`\n${'='.repeat(60)}`)
  console.log('🎉 测试完成！')
  console.log('='.repeat(60))
  console.log(`
  后续步骤:
  1. 检查 test-output 目录中的音频文件
  2. 播放验证是否使用了克隆音色
  3. 验证方言发音是否正确
  `)

  return true
}

// 运行测试
testClonedVoiceTTS()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n❌ 测试执行失败:', error)
    process.exit(1)
  })
