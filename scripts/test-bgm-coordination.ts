// scripts/test-bgm-coordination.ts

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { getRapGenerator } from '../src/lib/services/rap-generator-suno-rvc.js'
import type { GenerationProgress } from '../src/lib/services/rap-generator-suno-rvc.js'
import { listAllBGM } from '../src/lib/music/bgm-library.js'

async function testBGCoordination() {
  console.log('BGM 协调方案端到端测试')
  console.log('='.repeat(60))

  const generator = getRapGenerator()

  // 检查服务状态
  console.log('\n1. 检查服务状态...')
  const services = await generator.checkServices()
  console.log('   Suno:', services.suno ? '✓' : '✗')
  console.log('   Demucs:', services.demucs ? '✓' : '✗')
  console.log('   RVC:', services.rvc ? '✓' : '✗')
  console.log('   FFmpeg:', services.ffmpeg ? '✓' : '✗')

  if (!services.suno || !services.demucs || !services.rvc || !services.ffmpeg) {
    console.error('\n❌ 部分服务未启动，请先启动所有服务')
    console.log('\n启动服务:')
    console.log('  Demucs: cd services/demucs && python3 api_server.py')
    console.log('  RVC: cd services/rvc && python3 api_server.py')
    process.exit(1)
  }

  // 检查 BGM 库
  console.log('\n2. 检查 BGM 库...')
  const bgmList = listAllBGM()
  console.log(`   可用 BGM: ${bgmList.length} 首`)

  if (bgmList.length === 0) {
    console.error('\n❌ BGM 库为空，请先添加至少一首 BGM')
    console.log('\n添加 BGM 步骤:')
    console.log('  1. 准备 BGM 文件（MP3/WAV，44100Hz，2-5分钟）')
    console.log('  2. 使用 tunebat.com 检测 BPM')
    console.log('  3. 上传到 OSS，获取 URL')
    console.log('  4. 在 src/lib/music/bgm-library.ts 中添加 BGM 元数据')
    process.exit(1)
  }

  bgmList.forEach(bgm => {
    console.log(`   - ${bgm.id}: ${bgm.bpm} BPM, ${bgm.styleTags}`)
  })

  // 进度回调
  const onProgress = (progress: GenerationProgress) => {
    const icon = progress.progress === 100 ? '✓' : '...'
    console.log(`   [${progress.stepName}] ${icon} ${progress.message || ''}`)
  }

  // 测试生成（使用默认 BGM）
  console.log('\n3. 测试 Rap 生成（使用默认 BGM）...')
  try {
    const result = await generator.generate(
      {
        userId: 'test-bgm-coordination',
        userDescription: '测试 BGM 协调功能',
        dialect: 'original',
        voiceModelId: 'test-model',
        // 不指定 bgmId，使用默认 BGM
        lyrics: `[Verse 1]
这是测试
节奏协调
BGM 匹配
效果如何

[Chorus]
测试成功
继续前进`,
      },
      onProgress
    )

    console.log('\n' + '='.repeat(60))
    console.log('✓ 测试完成!')
    console.log('='.repeat(60))
    console.log('Audio URL:', result.audioUrl)
    console.log('Duration:', result.duration, 's')
    console.log('Dialect:', result.dialect)
    console.log('Task ID:', result.taskId)

    console.log('\n验证步骤:')
    console.log('1. 播放音频，检查 Rap 节奏是否与 BGM 协调')
    console.log('2. 使用 bpmdetector.com 检测 Rap 的实际 BPM')
    console.log('3. 对比 Rap BPM 与 BGM BPM 的偏差')
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    process.exit(1)
  }
}

testBGCoordination().catch(console.error)
