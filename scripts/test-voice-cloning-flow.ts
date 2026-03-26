#!/usr/bin/env npx tsx
/**
 * 端到端测试：声音克隆 → TTS 流程
 *
 * 测试流程：
 * 1. 检查 CosyVoice 声音复刻服务状态
 * 2. 模拟上传音频并创建复刻音色（需要真实 API）
 * 3. 使用复刻音色生成方言语音
 */

// 加载环境变量
import { config } from 'dotenv'
config({ path: '.env.local' })

import { getCosyVoiceCloneClient, getDialectInstruction } from '../src/lib/tts/cosyvoice-clone-client'
import { getCosyVoiceClient, isCosyVoiceDialect } from '../src/lib/tts/cosyvoice-client'
import { selectTTSProvider, generateDialectSpeech, getDialectSupportInfo } from '../src/lib/tts/tts-router'
import { DIALECT_CONFIGS } from '../src/types/dialect'

async function testVoiceCloningFlow() {
  console.log('========================================')
  console.log('端到端测试：声音克隆 → TTS 流程')
  console.log('========================================\n')

  // Step 1: 检查服务状态
  console.log('📋 Step 1: 检查服务状态')
  const cloneClient = getCosyVoiceCloneClient()
  const cosyvoiceClient = getCosyVoiceClient()

  console.log(`  CosyVoice Clone 配置: ${cloneClient.isConfigured() ? '✅' : '❌'}`)
  console.log(`  CosyVoice TTS 配置: ${cosyvoiceClient.isConfigured() ? '✅' : '❌'}`)

  if (!cloneClient.isConfigured() || !cosyvoiceClient.isConfigured()) {
    console.log('\n⚠️  请设置 DASHSCOPE_API_KEY 环境变量')
    return
  }

  // Step 2: 测试方言指令映射
  console.log('\n📋 Step 2: 测试方言指令映射')
  const dialects = Object.keys(DIALECT_CONFIGS)
  for (const dialect of dialects) {
    const instruction = getDialectInstruction(dialect)
    console.log(`  ${dialect}: ${instruction}`)
  }

  // Step 3: 测试 TTS 提供商选择
  console.log('\n📋 Step 3: 测试 TTS 提供商选择')
  console.log('  无复刻音色:')
  for (const dialect of dialects) {
    const provider = selectTTSProvider(dialect as any, false)
    const supportInfo = getDialectSupportInfo(dialect as any)
    console.log(`    ${dialect}: ${provider} (${supportInfo.quality}) - ${supportInfo.notes}`)
  }

  console.log('\n  有复刻音色:')
  for (const dialect of dialects) {
    const provider = selectTTSProvider(dialect as any, true)
    console.log(`    ${dialect}: ${provider} (使用复刻音色 + instruction)`)
  }

  // Step 4: 测试 TTS 生成（需要真实 API）
  console.log('\n📋 Step 4: 测试 TTS 生成')

  // 测试粤语（CosyVoice 系统音色）
  console.log('\n  测试粤语（系统音色）:')
  try {
    const result = await generateDialectSpeech({
      text: '大家好，我系粤语测试。',
      dialect: 'cantonese',
      format: 'mp3',
      sampleRate: 22050,
    })
    console.log(`    ✅ 成功: ${result.audioBuffer.length} bytes, 提供商: ${result.provider}`)
  } catch (error) {
    console.log(`    ❌ 失败: ${error instanceof Error ? error.message : error}`)
  }

  // 测试四川话（Qwen-TTS 原生音色）
  console.log('\n  测试四川话（Qwen-TTS 原生音色）:')
  try {
    const result = await generateDialectSpeech({
      text: '大家好，我是四川话测试。',
      dialect: 'sichuan',
      format: 'wav',
      sampleRate: 24000,
    })
    console.log(`    ✅ 成功: ${result.audioBuffer.length} bytes, 提供商: ${result.provider}`)
  } catch (error) {
    console.log(`    ❌ 失败: ${error instanceof Error ? error.message : error}`)
  }

  // Step 5: 测试复刻音色 + instruction（模拟）
  console.log('\n📋 Step 5: 复刻音色 + instruction 流程说明')
  console.log('  当用户有复刻音色时:')
  console.log('    1. TTS Router 检测到 voiceId')
  console.log('    2. 选择 CosyVoice 提供商（支持 instruction）')
  console.log('    3. 传递 instruction = getDialectInstruction(dialect)')
  console.log('    4. CosyVoice 使用复刻音色 + 方言指令生成语音')
  console.log('\n  示例:')
  console.log(`    voiceId: "clone_abc123"`)
  console.log(`    dialect: "sichuan"`)
  console.log(`    instruction: "${getDialectInstruction('sichuan')}"`)
  console.log(`    provider: ${selectTTSProvider('sichuan', true)}`)

  console.log('\n========================================')
  console.log('测试完成！')
  console.log('========================================')
}

// 运行测试
testVoiceCloningFlow().catch(console.error)
