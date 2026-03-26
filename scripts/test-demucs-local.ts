/**
 * 测试本地 Demucs 人声分离服务
 *
 * 运行方法:
 * 1. 先启动服务: cd services/demucs && python3 api_server.py
 * 2. 运行测试: npx tsx scripts/test-demucs-local.ts
 */

import fs from 'fs'
import path from 'path'

const DEMUCS_API_URL = process.env.DEMUCS_API_URL || 'http://localhost:8002'

async function testDemucsService() {
  console.log('='.repeat(60))
  console.log('测试本地 Demucs 人声分离服务')
  console.log('='.repeat(60))
  console.log(`API URL: ${DEMUCS_API_URL}\n`)

  // 1. 健康检查
  console.log('1. 健康检查...')
  try {
    const healthRes = await fetch(`${DEMUCS_API_URL}/health`)
    const health = await healthRes.json()
    console.log('   ✓ 服务运行中:', health)
  } catch (e) {
    console.error('   ✗ 服务未启动！')
    console.error('   请先运行: cd services/demucs && python3 api_server.py')
    process.exit(1)
  }

  // 2. 查找测试音频
  console.log('\n2. 查找测试音频...')
  const testAudioPaths = [
    'test-voice-audio.mp3',
    'test-video.MP4',
    'temp/test-audio.mp3',
  ]

  let testAudioPath: string | null = null
  for (const p of testAudioPaths) {
    if (fs.existsSync(p)) {
      testAudioPath = p
      break
    }
  }

  if (!testAudioPath) {
    // 使用 Suno 生成的音频（如果有的话）
    const sunoOutput = 'temp/suno-output.mp3'
    if (fs.existsSync(sunoOutput)) {
      testAudioPath = sunoOutput
    }
  }

  if (!testAudioPath) {
    console.log('   ⚠ 未找到测试音频文件')
    console.log('   请提供一个测试音频文件，或使用 Suno 生成一个')
    return
  }

  console.log(`   ✓ 找到测试音频: ${testAudioPath}`)

  // 3. 上传并分离
  console.log('\n3. 上传音频并分离...')
  const audioBuffer = fs.readFileSync(testAudioPath)
  const formData = new FormData()
  formData.append('audio_file', new Blob([audioBuffer]), path.basename(testAudioPath))
  formData.append('model', 'htdemucs')

  const startTime = Date.now()

  try {
    const separateRes = await fetch(`${DEMUCS_API_URL}/api/v1/separate`, {
      method: 'POST',
      body: formData,
    })

    if (!separateRes.ok) {
      throw new Error(`HTTP ${separateRes.status}: ${await separateRes.text()}`)
    }

    const result = await separateRes.json()
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`   ✓ 分离完成 (${elapsed}s)`)
    console.log('   任务 ID:', result.task_id)
    console.log('   时长:', result.duration, '秒')
    console.log('   人声 URL:', result.vocals)
    console.log('   伴奏 URL:', result.accompaniment)

    // 4. 下载人声
    if (result.vocals) {
      console.log('\n4. 下载分离后的人声...')
      const vocalsRes = await fetch(`${DEMUCS_API_URL}${result.vocals}`)
      if (vocalsRes.ok) {
        const vocalsBuffer = await vocalsRes.arrayBuffer()
        const outputPath = `temp/demucs-vocals-${Date.now()}.wav`
        fs.writeFileSync(outputPath, Buffer.from(vocalsBuffer))
        console.log(`   ✓ 人声已保存: ${outputPath} (${(vocalsBuffer.byteLength / 1024).toFixed(1)} KB)`)
      } else {
        console.log('   ✗ 下载人声失败')
      }
    }

    // 5. 下载伴奏
    if (result.accompaniment) {
      console.log('\n5. 下载分离后的伴奏...')
      const bgmRes = await fetch(`${DEMUCS_API_URL}${result.accompaniment}`)
      if (bgmRes.ok) {
        const bgmBuffer = await bgmRes.arrayBuffer()
        const outputPath = `temp/demucs-bgm-${Date.now()}.wav`
        fs.writeFileSync(outputPath, Buffer.from(bgmBuffer))
        console.log(`   ✓ 伴奏已保存: ${outputPath} (${(bgmBuffer.byteLength / 1024).toFixed(1)} KB)`)
      } else {
        console.log('   ✗ 下载伴奏失败')
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✓ 测试完成！')
    console.log('='.repeat(60))

  } catch (e) {
    console.error('   ✗ 分离失败:', e)
  }
}

testDemucsService().catch(console.error)
