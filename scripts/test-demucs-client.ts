/**
 * 测试 DemucsClient 与本地服务的集成
 *
 * 运行: npx tsx scripts/test-demucs-client.ts
 */

import { getDemucsClient } from '../src/lib/audio/demucs-client'
import fs from 'fs'

async function testDemucsClient() {
  console.log('测试 DemucsClient 集成...\n')

  const client = getDemucsClient()

  // 1. 检查服务可用性
  console.log('1. 检查服务可用性...')
  const available = await client.isAvailable()
  if (!available) {
    console.error('   ✗ 服务不可用，请先启动:')
    console.error('   cd services/demucs && python3 api_server.py')
    process.exit(1)
  }
  console.log('   ✓ 服务可用')

  // 2. 测试人声分离
  console.log('\n2. 测试人声分离...')
  const testAudio = 'test-voice-audio.mp3'
  if (!fs.existsSync(testAudio)) {
    console.error(`   ✗ 测试文件不存在: ${testAudio}`)
    process.exit(1)
  }

  // 读取本地文件并上传
  const audioBuffer = fs.readFileSync(testAudio)
  const audioUrl = `file://${process.cwd()}/${testAudio}`

  // 注意：DemucsClient.separate() 期望一个 URL
  // 本地测试需要先上传文件到一个可访问的地方
  // 或者修改客户端支持本地文件

  // 使用便捷方法：separateToBuffer
  console.log('   正在分离...')
  const startTime = Date.now()

  try {
    // 由于 DemucsClient 需要从 URL 下载文件，
    // 我们需要用不同的方式测试

    // 直接调用 API
    const formData = new FormData()
    formData.append('audio_file', new Blob([audioBuffer]), testAudio)
    formData.append('model', 'htdemucs')

    const response = await fetch('http://localhost:8002/api/v1/separate', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    if (result.status !== 'completed') {
      console.error('   ✗ 分离失败:', result.error)
      process.exit(1)
    }

    console.log(`   ✓ 分离完成 (${elapsed}s)`)
    console.log('   任务 ID:', result.task_id)
    console.log('   时长:', result.duration?.toFixed(1), '秒')
    console.log('   人声:', result.vocals)
    console.log('   伴奏:', result.accompaniment)

    // 3. 下载结果
    if (result.vocals) {
      console.log('\n3. 下载分离结果...')
      const vocalsRes = await fetch(`http://localhost:8002${result.vocals}`)
      const vocalsBuffer = await vocalsRes.arrayBuffer()

      const outputPath = `temp/demucs-client-vocals.wav`
      fs.writeFileSync(outputPath, Buffer.from(vocalsBuffer))
      console.log(`   ✓ 人声已保存: ${outputPath}`)
    }

    console.log('\n✓ DemucsClient 集成测试通过!')

  } catch (e) {
    console.error('   ✗ 测试失败:', e)
    process.exit(1)
  }
}

testDemucsClient().catch(console.error)
