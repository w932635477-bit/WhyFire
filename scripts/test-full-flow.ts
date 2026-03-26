/**
 * 测试 RapGeneratorSunoRvc 完整流程（包含 RVC Mock）
 *
 * 运行: npx tsx scripts/test-full-flow.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { RapGeneratorSunoRvc, type GenerationProgress } from '../src/lib/services/rap-generator-suno-rvc.js'
import fs from 'fs'

async function testFullFlow() {
  console.log('='.repeat(60))
  console.log('RapGeneratorSunoRvc 完整流程测试（含 RVC Mock）')
  console.log('='.repeat(60))

  const generator = new RapGeneratorSunoRvc()

  // 1. 检查所有服务状态
  console.log('\n1. 检查服务状态...')
  const services = await generator.checkServices()
  console.log('   Suno:', services.suno ? '✓' : '✗')
  console.log('   Demucs:', services.demucs ? '✓' : '✗')
  console.log('   RVC:', services.rvc ? '✓' : '✗')
  console.log('   FFmpeg:', services.ffmpeg ? '✓' : '✗')

  if (!services.suno || !services.demucs || !services.rvc) {
    console.error('\n❌ 必需服务未启动')
    if (!services.demucs) {
      console.error('   启动 Demucs: cd services/demucs && python3 api_server.py')
    }
    if (!services.rvc) {
      console.error('   启动 RVC: cd services/rvc && python3 api_server.py')
    }
    process.exit(1)
  }

  // 2. 完整 5 步流程
  console.log('\n2. 执行完整 5 步流程...')

  const startTime = Date.now()

  const progressCallback = (progress: GenerationProgress) => {
    const icon = progress.progress === 100 ? '✓' : '...'
    console.log(`   [${progress.stepName}] ${icon} ${progress.message || ''}`)
  }

  try {
    const result = await generator.generate(
      {
        userId: 'test-user',
        userDescription: '我是一名程序员，喜欢写代码和喝咖啡',
        dialect: 'original',
        voiceModelId: 'test-model',
        bgmUrl: '', // 将使用分离出的伴奏
        lyrics: `[Verse 1]
程序员的生活很简单
代码敲到深夜两点半
Bug 修完又来一个
咖啡续命继续干活

[Chorus]
编程使我快乐
代码是我的选择
虽然有时候会出错
但解决问题最酷`,
      },
      progressCallback
    )

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('✓ 完整 5 步流程测试通过!')
    console.log('='.repeat(60))
    console.log(`总耗时: ${totalTime}s`)
    console.log('Audio URL:', result.audioUrl)
    console.log('Duration:', result.duration, 's')
    console.log('Dialect:', result.dialect)
    console.log('Task ID:', result.taskId)

    // 下载最终音频
    if (result.audioUrl) {
      console.log('\n3. 下载最终音频...')
      const audioRes = await fetch(result.audioUrl.replace('file://', 'http://localhost:8001'))
      if (audioRes.ok) {
        const buffer = await audioRes.arrayBuffer()
        const outputPath = `temp/final-rap-${Date.now()}.mp3`
        fs.writeFileSync(outputPath, Buffer.from(buffer))
        console.log(`   ✓ 已保存: ${outputPath} (${(buffer.byteLength / 1024).toFixed(1)} KB)`)
      }
    }

  } catch (error) {
    console.error('\n❌ 生成失败:', error)
    process.exit(1)
  }
}

testFullFlow().catch(console.error)
