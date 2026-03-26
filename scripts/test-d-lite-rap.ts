/**
 * D-Lite Rap 生成测试脚本
 * 测试完整的 Rap 生成流程
 *
 * 使用方法:
 * npx tsx scripts/test-d-lite-rap.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') })
config() // 也尝试加载 .env

import { RapGenerator, getAvailableBGMs, getBGMInfo } from '../src/lib/services/rap-generator'
import type { DialectCode } from '../src/types/dialect'

async function main() {
  console.log('='.repeat(60))
  console.log('D-Lite Rap 生成测试')
  console.log('='.repeat(60))

  // 检查环境变量
  if (!process.env.DASHSCOPE_API_KEY) {
    console.error('❌ DASHSCOPE_API_KEY 未设置')
    console.log('当前环境变量:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')).slice(0, 5))
    console.log('请设置环境变量: export DASHSCOPE_API_KEY=your_key')
    process.exit(1)
  }

  console.log('✅ DASHSCOPE_API_KEY 已设置')

  // 显示可用的 BGM
  console.log('\n📋 可用的 BGM:')
  const bgms = getAvailableBGMs()
  bgms.forEach(bgm => {
    console.log(`   - ${bgm.id}: ${bgm.name} (${bgm.bpm} BPM)`)
  })

  // 测试参数
  const testParams = {
    lyrics: `今天天气真好阳光明媚
我想唱一首方言说唱
生活就是要开心快乐
让我们的节奏一起摇摆`,
    dialect: 'mandarin' as DialectCode,
    bgmId: 'beat-1', // 八方来财 130 BPM
  }

  console.log('\n🎤 测试参数:')
  console.log(`   歌词: "${testParams.lyrics.substring(0, 30)}..."`)
  console.log(`   方言: ${testParams.dialect}`)
  console.log(`   BGM: ${testParams.bgmId}`)

  // 获取 BGM 信息
  const bgmInfo = getBGMInfo(testParams.bgmId)
  if (bgmInfo) {
    console.log(`   BGM 详情: ${bgmInfo.name}, ${bgmInfo.bpm} BPM`)
  }

  // 创建生成器
  const generator = new RapGenerator({
    onProgress: (progress) => {
      console.log(`   [${progress.step}] ${progress.progress}% - ${progress.message}`)
    },
  })

  console.log('\n🚀 开始生成...\n')

  try {
    const startTime = Date.now()
    const result = await generator.generate(testParams)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('📊 生成结果:')
    console.log('='.repeat(60))
    console.log(`   任务 ID: ${result.taskId}`)
    console.log(`   状态: ${result.status}`)
    console.log(`   耗时: ${elapsed} 秒`)

    if (result.status === 'completed') {
      console.log(`   ✅ 生成成功!`)
      console.log(`   时长: ${result.duration?.toFixed(1)} 秒`)
      console.log(`   BGM: ${result.bgmName} (${result.bpm} BPM)`)
      console.log(`   Tempo 调整: ${result.tempoAdjustment?.toFixed(3)}x`)
      console.log(`   音频大小: ${(result.audioUrl?.length || 0) / 1024} KB (Base64)`)

      // 保存音频文件
      if (result.audioUrl) {
        const fs = await import('fs')
        const audioBuffer = Buffer.from(result.audioUrl.split(',')[1], 'base64')
        const outputPath = `/tmp/d-lite-rap-${Date.now()}.mp3`
        fs.writeFileSync(outputPath, audioBuffer)
        console.log(`   💾 已保存到: ${outputPath}`)
      }
    } else {
      console.log(`   ❌ 生成失败: ${result.error}`)
    }
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
  }
}

main().catch(console.error)
