#!/usr/bin/env npx tsx
/**
 * 端到端测试：声音克隆 → TTS 完整流程
 *
 * 测试流程：
 * 1. 检查 CosyVoice 声音复刻服务状态
 * 2. 检查 Qwen-TTS 服务状态
 * 3. 测试方言指令映射
 * 4. 测试 TTS 提供商选择逻辑
 * 5. 测试 TTS 生成（需要真实 API）
 * 6. 测试复刻音色 + instruction 流程
 *
 * 运行方式：
 *   npx tsx scripts/test-voice-cloning-e2e.ts
 */

// 加载环境变量
import { config } from 'dotenv'
config({ path: '.env.local' })

import { getCosyVoiceCloneClient, getDialectInstruction } from '../src/lib/tts/cosyvoice-clone-client'
import { getCosyVoiceClient, isCosyVoiceDialect } from '../src/lib/tts/cosyvoice-client'
import { getQwenTTSClient, hasDialectVoice } from '../src/lib/tts/qwen-tts-client'
import { getVoiceCloningClient, hasDialectVoiceId, getDialectVoiceId } from '../src/lib/tts/voice-cloning-client'
import { selectTTSProvider, generateDialectSpeech, getDialectSupportInfo } from '../src/lib/tts/tts-router'
import { DIALECT_CONFIGS } from '../src/types/dialect'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// 测试结果类型
interface TestResult {
  name: string
  passed: boolean
  message: string
  duration?: number
}

const results: TestResult[] = []

// 测试辅助函数
function test(name: string, fn: () => Promise<boolean> | boolean) {
  return async () => {
    const startTime = Date.now()
    try {
      const passed = await fn()
      const duration = Date.now() - startTime
      results.push({
        name,
        passed,
        message: passed ? '✅ 通过' : '❌ 失败',
        duration,
      })
      console.log(`  ${passed ? '✅' : '❌'} ${name} (${duration}ms)`)
      return passed
    } catch (error) {
      const duration = Date.now() - startTime
      results.push({
        name,
        passed: false,
        message: `❌ 异常: ${error instanceof Error ? error.message : error}`,
        duration,
      })
      console.log(`  ❌ ${name} - 异常: ${error instanceof Error ? error.message : error}`)
      return false
    }
  }
}

// 保存音频文件
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

async function main() {
  console.log('========================================')
  console.log('端到端测试：声音克隆 → TTS 完整流程')
  console.log('========================================\n')

  // ===========================================
  // Step 1: 检查服务状态
  // ===========================================
  console.log('📋 Step 1: 检查服务状态')

  const cosyvoiceCloneClient = getCosyVoiceCloneClient()
  const cosyvoiceClient = getCosyVoiceClient()
  const qwenTTSClient = getQwenTTSClient()
  const voiceCloningClient = getVoiceCloningClient()

  const services = {
    'CosyVoice Clone': cosyvoiceCloneClient.isConfigured(),
    'CosyVoice TTS': cosyvoiceClient.isConfigured(),
    'Qwen-TTS': qwenTTSClient.isConfigured(),
    'Voice Cloning (qwen-tts-vc)': voiceCloningClient.isConfigured(),
  }

  for (const [name, configured] of Object.entries(services)) {
    console.log(`  ${configured ? '✅' : '❌'} ${name}`)
  }

  const allConfigured = Object.values(services).every(Boolean)
  if (!allConfigured) {
    console.log('\n⚠️  部分服务未配置，请设置 DASHSCOPE_API_KEY 环境变量')
    console.log('   将跳过需要 API 调用的测试\n')
  }

  // ===========================================
  // Step 2: 测试方言指令映射
  // ===========================================
  console.log('\n📋 Step 2: 测试方言指令映射')

  await test('方言指令映射完整性', () => {
    const dialects = Object.keys(DIALECT_CONFIGS)
    for (const dialect of dialects) {
      const instruction = getDialectInstruction(dialect)
      if (!instruction || !instruction.includes('请用')) {
        console.log(`      ⚠️ ${dialect}: ${instruction}`)
        return false
      }
    }
    return true
  })()

  // 打印所有方言指令
  console.log('\n  方言指令列表:')
  for (const [dialect, config] of Object.entries(DIALECT_CONFIGS)) {
    const instruction = getDialectInstruction(dialect)
    console.log(`    ${config.name}: ${instruction}`)
  }

  // ===========================================
  // Step 3: 测试 TTS 提供商选择
  // ===========================================
  console.log('\n📋 Step 3: 测试 TTS 提供商选择逻辑')

  await test('CosyVoice 优先方言选择', () => {
    const cosyvoiceDialects = ['cantonese', 'dongbei']
    for (const dialect of cosyvoiceDialects) {
      const provider = selectTTSProvider(dialect as any, false)
      if (provider !== 'cosyvoice') {
        console.log(`      ❌ ${dialect} 应选择 cosyvoice，实际: ${provider}`)
        return false
      }
    }
    return true
  })()

  await test('Qwen-TTS 优先方言选择', () => {
    const qwenDialects = ['mandarin', 'sichuan', 'wu', 'shaanxi', 'minnan', 'tianjin', 'nanjing']
    for (const dialect of qwenDialects) {
      const provider = selectTTSProvider(dialect as any, false)
      if (provider !== 'qwen-tts') {
        console.log(`      ❌ ${dialect} 应选择 qwen-tts，实际: ${provider}`)
        return false
      }
    }
    return true
  })()

  await test('复刻音色优先 CosyVoice', () => {
    // 有复刻音色时，所有方言都应该使用 CosyVoice
    const testDialects = ['sichuan', 'mandarin', 'shaanxi']
    for (const dialect of testDialects) {
      const provider = selectTTSProvider(dialect as any, true)
      if (provider !== 'cosyvoice') {
        console.log(`      ❌ ${dialect} 有复刻音色时应选择 cosyvoice，实际: ${provider}`)
        return false
      }
    }
    return true
  })()

  // 打印提供商选择矩阵
  console.log('\n  提供商选择矩阵:')
  console.log('  ┌────────────┬───────────┬──────────────────────────────────────────────┐')
  console.log('  │ 方言       │ 提供商    │ 说明                                         │')
  console.log('  ├────────────┼───────────┼──────────────────────────────────────────────┤')

  for (const [dialect, config] of Object.entries(DIALECT_CONFIGS)) {
    const provider = selectTTSProvider(dialect as any, false)
    const info = getDialectSupportInfo(dialect as any)
    const providerName = provider === 'cosyvoice' ? 'CosyVoice' :
                         provider === 'qwen-tts' ? 'Qwen-TTS' : 'Unknown'
    console.log(`  │ ${config.name.padEnd(10)} │ ${providerName.padEnd(9)} │ ${info.notes.substring(0, 42).padEnd(42)} │`)
  }

  console.log('  └────────────┴───────────┴──────────────────────────────────────────────┘')

  // ===========================================
  // Step 4: 测试方言支持信息
  // ===========================================
  console.log('\n📋 Step 4: 测试方言支持信息')

  await test('9种原生方言都有原生音色', () => {
    const nativeDialects = ['mandarin', 'cantonese', 'sichuan', 'dongbei',
                            'wu', 'shaanxi', 'minnan', 'tianjin', 'nanjing']
    for (const dialect of nativeDialects) {
      const info = getDialectSupportInfo(dialect as any)
      if (info.quality !== 'native') {
        console.log(`      ❌ ${dialect} 应为 native，实际: ${info.quality}`)
        return false
      }
    }
    return true
  })()

  await test('未知方言回退到 approximation', () => {
    const info = getDialectSupportInfo('unknown' as any)
    return info.quality === 'approximation' && info.provider === 'qwen-tts'
  })()

  // ===========================================
  // Step 5: 测试 TTS 生成（需要真实 API）
  // ===========================================
  if (allConfigured) {
    console.log('\n📋 Step 5: 测试 TTS 生成（真实 API）')

    // 测试 CosyVoice 粤语
    await test('CosyVoice 粤语生成', async () => {
      try {
        const result = await generateDialectSpeech({
          text: '大家好，我系粤语测试。今日天气好好，适合出去行街。',
          dialect: 'cantonese',
          format: 'mp3',
          sampleRate: 22050,
        })

        if (result.audioBuffer.length === 0) {
          console.log('      ❌ 音频数据为空')
          return false
        }

        saveAudioFile(result.audioBuffer, `test-cantonese-${Date.now()}.mp3`)
        console.log(`      提供商: ${result.provider}, 大小: ${result.audioBuffer.length} bytes`)
        return result.provider === 'cosyvoice'
      } catch (error) {
        console.log(`      ❌ 错误: ${error instanceof Error ? error.message : error}`)
        return false
      }
    })()

    // 测试 Qwen-TTS 四川话
    await test('Qwen-TTS 四川话生成', async () => {
      try {
        const result = await generateDialectSpeech({
          text: '大家好，我是四川话测试。今天天气巴适得很。',
          dialect: 'sichuan',
          format: 'wav',
          sampleRate: 24000,
        })

        if (result.audioBuffer.length === 0) {
          console.log('      ❌ 音频数据为空')
          return false
        }

        saveAudioFile(result.audioBuffer, `test-sichuan-${Date.now()}.wav`)
        console.log(`      提供商: ${result.provider}, 大小: ${result.audioBuffer.length} bytes`)
        return result.provider === 'qwen-tts'
      } catch (error) {
        console.log(`      ❌ 错误: ${error instanceof Error ? error.message : error}`)
        return false
      }
    })

    // 测试东北话
    await test('CosyVoice 东北话生成', async () => {
      try {
        const result = await generateDialectSpeech({
          text: '哎呀妈呀，今天咋这么冷呢，赶紧整点热乎的。',
          dialect: 'dongbei',
          format: 'mp3',
        })

        if (result.audioBuffer.length === 0) {
          console.log('      ❌ 音频数据为空')
          return false
        }

        saveAudioFile(result.audioBuffer, `test-dongbei-${Date.now()}.mp3`)
        console.log(`      提供商: ${result.provider}, 大小: ${result.audioBuffer.length} bytes`)
        return result.provider === 'cosyvoice'
      } catch (error) {
        console.log(`      ❌ 错误: ${error instanceof Error ? error.message : error}`)
        return false
      }
    })
  } else {
    console.log('\n📋 Step 5: 跳过 TTS 生成测试（API 未配置）')
  }

  // ===========================================
  // Step 6: 测试声音克隆流程（模拟）
  // ===========================================
  console.log('\n📋 Step 6: 声音克隆流程说明')

  console.log(`
  声音克隆完整流程:
  ┌──────────────────────────────────────────────────────────────────────┐
  │ 1. 用户上传音频 (10秒-5分钟)                                          │
  │    ↓                                                                 │
  │ 2. 前端调用 POST /api/voice/clone                                    │
  │    ↓                                                                 │
  │ 3. CosyVoice 创建复刻音色 → 返回 voice_id                            │
  │    ↓                                                                 │
  │ 4. 等待审核通过 (状态: pending → ok)                                  │
  │    ↓                                                                 │
  │ 5. 前端保存 voice_id 到 Context                                      │
  │    ↓                                                                 │
  │ 6. 后续 TTS 使用 voice_id + instruction 生成方言语音                  │
  │    ↓                                                                 │
  │ 7. 示例调用:                                                         │
  │    generateDialectSpeech({                                           │
  │      text: '歌词内容',                                                │
  │      dialect: 'sichuan',                                             │
  │      voiceId: 'clone_abc123',  // 复刻音色 ID                        │
  │    })                                                                │
  │    → 自动选择 CosyVoice + instruction: '请用四川话表达。'            │
  └──────────────────────────────────────────────────────────────────────┘
  `)

  // ===========================================
  // 测试总结
  // ===========================================
  console.log('\n========================================')
  console.log('测试总结')
  console.log('========================================')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)

  console.log(`\n总计: ${results.length} 个测试`)
  console.log(`  ✅ 通过: ${passed}`)
  console.log(`  ❌ 失败: ${failed}`)
  console.log(`  ⏱️  耗时: ${totalDuration}ms`)

  if (failed > 0) {
    console.log('\n失败的测试:')
    for (const result of results.filter(r => !r.passed)) {
      console.log(`  ❌ ${result.name}: ${result.message}`)
    }
    process.exit(1)
  } else {
    console.log('\n🎉 所有测试通过！')
    process.exit(0)
  }
}

// 运行测试
main().catch((error) => {
  console.error('测试执行失败:', error)
  process.exit(1)
})
