#!/usr/bin/env npx tsx
/**
 * 声音克隆 + 方言 TTS 完整端到端测试
 *
 * 流程:
 * 1. 上传音频到 OSS
 * 2. 创建克隆音色
 * 3. 等待审核通过
 * 4. 测试所有 9 种方言 TTS
 *
 * 运行方式:
 *   npx tsx scripts/test-e2e-voice-cloning.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { getCosyVoiceCloneClient, getDialectInstruction } from '../src/lib/tts/cosyvoice-clone-client'
import { getCosyVoiceClient, isCosyVoiceDialect } from '../src/lib/tts/cosyvoice-client'
import { getQwenTTSClient, hasDialectVoice } from '../src/lib/tts/qwen-tts-client'
import { uploadToOSS, isOSSConfigured } from '../src/lib/oss'
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'

// 保存代理设置
const savedProxy = process.env.HTTPS_PROXY || process.env.https_proxy

const AUDIO_PATH = process.env.AUDIO_PATH || join(process.cwd(), 'test-voice-audio.mp3')

const DIALECTS = [
  { code: 'mandarin', name: '普通话', text: '大家好，我是测试音色。今天天气很好，我们来测试一下方言语音合成。' },
  { code: 'cantonese', name: '粤语', text: '大家好，我系粤语测试。今日天气好好，适合出去行街。' },
  { code: 'sichuan', name: '四川话', text: '大家好，我是四川话测试。今天天气巴适得很，安逸得很。' },
  { code: 'dongbei', name: '东北话', text: '哎呀妈呀，今天咋这么冷呢，赶紧整点热乎的。' },
  { code: 'wu', name: '上海话', text: '大家好，我是上海话测试。今朝天气老好了。' },
  { code: 'shaanxi', name: '陕西话', text: '大家好，我是陕西话测试。今儿个天气好得很。' },
  { code: 'minnan', name: '闽南语', text: '大家好，我是闽南语测试。今仔日天气真好。' },
  { code: 'tianjin', name: '天津话', text: '大家好，我是天津话测试。介天儿不错啊。' },
  { code: 'nanjing', name: '南京话', text: '大家好，我是南京话测试。今天天气蛮好的。' },
]

function saveAudio(buffer: Buffer, filename: string) {
  const dir = join(process.cwd(), 'test-output')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const path = join(dir, filename)
  writeFileSync(path, buffer)
  return path
}

function logStep(step: number, title: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📋 Step ${step}: ${title}`)
  console.log('='.repeat(60))
}

async function runE2ETest() {
  console.log('\n🎤 声音克隆 + 方言 TTS 完整端到端测试')
  console.log('='.repeat(60))

  // Step 1: 检查配置
  logStep(1, '检查服务配置')

  const cloneClient = getCosyVoiceCloneClient()
  const cosyClient = getCosyVoiceClient()
  const qwenClient = getQwenTTSClient()

  if (!cloneClient.isConfigured()) {
    console.log('  ❌ CosyVoice Clone API 未配置')
    return false
  }
  console.log('  ✅ CosyVoice Clone API 已配置')

  if (!cosyClient.isConfigured()) {
    console.log('  ❌ CosyVoice TTS API 未配置')
    return false
  }
  console.log('  ✅ CosyVoice TTS API 已配置')

  if (!isOSSConfigured()) {
    console.log('  ❌ OSS 未配置')
    return false
  }
  console.log('  ✅ OSS 已配置')

  if (qwenClient.isConfigured()) {
    console.log('  ✅ Qwen-TTS API 已配置（回退支持）')
  } else {
    console.log('  ℹ️  Qwen-TTS 未配置（天津话、南京话将无法测试）')
  }

  // Step 2: 检查音频文件
  logStep(2, '检查音频文件')

  if (!existsSync(AUDIO_PATH)) {
    console.log(`  ❌ 音频文件不存在: ${AUDIO_PATH}`)
    return false
  }

  const audioBuffer = readFileSync(AUDIO_PATH)
  console.log(`  ✅ 音频已加载: ${AUDIO_PATH}`)
  console.log(`  ℹ️  文件大小: ${(audioBuffer.length / 1024).toFixed(1)} KB`)

  // Step 3: 上传到 OSS（临时禁用代理避免 SSL 问题）
  logStep(3, '上传音频到 OSS')

  // 临时禁用代理
  const originalProxy = process.env.HTTPS_PROXY
  delete process.env.HTTPS_PROXY
  delete process.env.https_proxy
  delete process.env.HTTP_PROXY
  delete process.env.http_proxy
  delete process.env.ALL_PROXY
  delete process.env.all_proxy
  delete process.env.GLOBAL_AGENT_HTTP_PROXY

  console.log('  正在上传（已禁用代理）...')
  const uploadResult = await uploadToOSS(audioBuffer, 'test-voice.mp3', {
    folder: 'voice-cloning-test',
    contentType: 'audio/mpeg',
  })

  // 恢复代理
  if (originalProxy) {
    process.env.HTTPS_PROXY = originalProxy
    process.env.https_proxy = originalProxy
  }

  if (!uploadResult.success || !uploadResult.url) {
    console.log(`  ❌ 上传失败: ${uploadResult.error}`)
    return false
  }

  console.log(`  ✅ 上传成功`)
  console.log(`  ℹ️  URL: ${uploadResult.url.slice(0, 60)}...`)

  // Step 4: 创建克隆音色
  logStep(4, '创建克隆音色')

  const prefix = Date.now().toString(36).slice(-10).padStart(6, '0')
  console.log(`  音色前缀: ${prefix}`)
  console.log('  正在创建...')

  const createResult = await cloneClient.createVoice({
    audioUrl: uploadResult.url,
    prefix,
    targetModel: 'cosyvoice-v3-flash',
    languageHints: ['zh'],
  })

  if (!createResult.success) {
    console.log(`  ❌ 创建失败: ${createResult.error}`)
    return false
  }

  const voiceId = createResult.voiceId!
  console.log(`  ✅ 克隆音色已创建: ${voiceId}`)

  // Step 5: 等待审核
  logStep(5, '等待审核通过')

  console.log('  正在等待审核...（最长 5 分钟）')
  const startTime = Date.now()

  const reviewResult = await cloneClient.waitForVoiceReady(voiceId, 300000, 5000)

  const waitTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`  等待时间: ${waitTime} 秒`)

  if (!reviewResult.ready) {
    console.log(`  ❌ 审核未通过: ${reviewResult.error}`)
    return false
  }

  console.log('  ✅ 审核已通过！')

  // Step 6: 测试所有方言 TTS
  logStep(6, '测试所有方言 TTS')

  const results: { dialect: string; provider: string; status: string; duration?: number }[] = []

  for (const { code, name, text } of DIALECTS) {
    console.log(`\n  --- ${name} ---`)

    try {
      if (isCosyVoiceDialect(code as any)) {
        const instruction = getDialectInstruction(code)
        console.log(`    使用 CosyVoice 克隆音色`)

        const result = await cosyClient.generate({
          text,
          dialect: code as any,
          voiceId,
          instruction,
          format: 'mp3',
          sampleRate: 22050,
        })

        const file = saveAudio(result.audioBuffer, `e2e-${code}-${Date.now()}.mp3`)
        console.log(`    ✅ 成功 | ${result.duration}s | ${file}`)
        results.push({ dialect: name, provider: 'CosyVoice 克隆', status: '✅', duration: result.duration })
      } else if (qwenClient.isConfigured() && hasDialectVoice(code)) {
        console.log(`    使用 Qwen-TTS 回退`)

        const result = await qwenClient.generate({
          text,
          dialect: code as any,
          format: 'mp3',
          sampleRate: 24000,
        })

        const file = saveAudio(result.audioBuffer, `e2e-${code}-${Date.now()}.mp3`)
        console.log(`    ✅ 成功 | ${result.duration}s | ${file}`)
        results.push({ dialect: name, provider: 'Qwen-TTS 回退', status: '✅', duration: result.duration })
      } else {
        console.log(`    ⚠️ 不支持`)
        results.push({ dialect: name, provider: '-', status: '⚠️ 不支持' })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.log(`    ❌ 失败: ${msg}`)
      results.push({ dialect: name, provider: '-', status: `❌ ${msg.slice(0, 40)}` })
    }
  }

  // 汇总
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试结果汇总')
  console.log('='.repeat(60))
  console.log('| 方言 | 服务 | 状态 | 时长 |')
  console.log('|------|------|------|------|')
  for (const r of results) {
    console.log(`| ${r.dialect} | ${r.provider} | ${r.status} | ${r.duration ? r.duration + 's' : '-'} |`)
  }

  const success = results.filter(r => r.status === '✅').length
  console.log(`\n总计: ${success}/${results.length} 通过`)
  console.log(`\nVoice ID: ${voiceId} (可复用)`)
  console.log(`音频文件: test-output/`)

  return success === results.length
}

runE2ETest()
  .then(ok => process.exit(ok ? 0 : 1))
  .catch(e => { console.error(e); process.exit(1) })
