#!/usr/bin/env npx tsx
/**
 * 完整方言 TTS 端到端测试 - 覆盖所有 9 种方言
 *
 * 使用方式:
 *   TEST_VOICE_ID=xxx npx tsx scripts/test-all-dialects-e2e.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { getCosyVoiceClient, isCosyVoiceDialect } from '../src/lib/tts/cosyvoice-client'
import { getQwenTTSClient, hasDialectVoice } from '../src/lib/tts/qwen-tts-client'
import { getDialectInstruction } from '../src/lib/tts/cosyvoice-clone-client'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const voiceId = process.env.TEST_VOICE_ID

if (!voiceId) {
  console.error('❌ 请设置 TEST_VOICE_ID 环境变量')
  process.exit(1)
}

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

async function testAllDialects() {
  console.log('\n🎯 完整方言 TTS 端到端测试')
  console.log('='.repeat(60))
  console.log(`Voice ID: ${voiceId}`)
  console.log('='.repeat(60))

  const cosyClient = getCosyVoiceClient()
  const qwenClient = getQwenTTSClient()

  const results: { dialect: string; provider: string; status: string; duration?: number }[] = []

  for (const { code, name, text } of DIALECTS) {
    console.log(`\n--- ${name} (${code}) ---`)

    try {
      if (isCosyVoiceDialect(code as any)) {
        // CosyVoice 支持的方言（7种）
        const instruction = getDialectInstruction(code)
        console.log(`  使用 CosyVoice 克隆音色 + instruction`)

        const result = await cosyClient.generate({
          text,
          dialect: code as any,
          voiceId,
          instruction,
          format: 'mp3',
          sampleRate: 22050,
        })

        const file = saveAudio(result.audioBuffer, `e2e-${code}-${Date.now()}.mp3`)
        console.log(`  ✅ 成功 | 时长: ${result.duration}s | 文件: ${file}`)
        results.push({ dialect: name, provider: 'CosyVoice 克隆', status: '✅', duration: result.duration })
      } else if (qwenClient.isConfigured() && hasDialectVoice(code)) {
        // Qwen-TTS 回退（天津话、南京话）
        console.log(`  使用 Qwen-TTS 原生方言音色（回退）`)

        const result = await qwenClient.generate({
          text,
          dialect: code as any,
          format: 'mp3',
          sampleRate: 24000,
        })

        const file = saveAudio(result.audioBuffer, `e2e-${code}-${Date.now()}.mp3`)
        console.log(`  ✅ 成功 | 时长: ${result.duration}s | 文件: ${file}`)
        results.push({ dialect: name, provider: 'Qwen-TTS 回退', status: '✅', duration: result.duration })
      } else {
        console.log(`  ⚠️ 不支持`)
        results.push({ dialect: name, provider: '-', status: '⚠️ 不支持' })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.log(`  ❌ 失败: ${msg}`)
      results.push({ dialect: name, provider: '-', status: `❌ ${msg.slice(0, 50)}` })
    }
  }

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

  return success === results.length
}

testAllDialects()
  .then(ok => process.exit(ok ? 0 : 1))
  .catch(e => { console.error(e); process.exit(1) })
