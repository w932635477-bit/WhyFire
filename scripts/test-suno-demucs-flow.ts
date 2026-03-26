/**
 * 测试 Suno + Demucs 完整流程
 *
 * 流程:
 * 1. Suno 生成 Rap
 * 2. Demucs 分离人声和伴奏
 * 3. 保存所有输出
 *
 * 运行: npx tsx scripts/test-suno-demucs-flow.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { getSunoClient } from '../src/lib/music/suno-client.js'
import { ProxyAgent } from 'undici'
import fs from 'fs'
import path from 'path'

const DEMUCS_API_URL = process.env.DEMUCS_API_URL || 'http://localhost:8002'

// 获取代理 Agent
function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                   process.env.HTTP_PROXY || process.env.http_proxy ||
                   process.env.ALL_PROXY || process.env.all_proxy
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl)
  }
  return undefined
}

const proxyAgent = getProxyAgent()

async function testSunoDemucsFlow() {
  console.log('='.repeat(60))
  console.log('Suno + Demucs 完整流程测试')
  console.log('='.repeat(60))

  // 检查 Demucs 服务
  console.log('\n1. 检查服务状态...')
  try {
    const healthRes = await fetch(`${DEMUCS_API_URL}/health`)
    const health = await healthRes.json()
    console.log('   ✓ Demucs 服务:', health.service)
  } catch {
    console.error('   ✗ Demucs 服务未启动!')
    console.error('   请运行: cd services/demucs && python3 api_server.py')
    process.exit(1)
  }

  // 检查 Suno 配置
  const sunoClient = getSunoClient()
  if (!sunoClient.isConfigured()) {
    console.error('   ✗ SUNO_API_KEY 未配置')
    process.exit(1)
  }
  console.log('   ✓ Suno API 已配置')

  // 生成 Rap
  console.log('\n2. Suno 生成 Rap...')
  const startTime = Date.now()

  let sunoResult
  try {
    sunoResult = await sunoClient.generate({
      lyrics: `[Verse 1]
用普通话唱出我的style
节奏跳动 feeling so high
今天天气真的很不错
心情愉悦想要去唱歌

[Chorus]
方言Rap就是这么帅
自己的声音独一无二
让世界听到我的声音
这就是我的说唱宣言

[Bridge]
来吧来吧一起唱
让音乐带我们飞翔`,
      dialect: 'original', // 普通话
      style: 'rap',
      title: 'Demucs测试Rap',
    })

    const genTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`   ✓ 生成完成 (${genTime}s)`)
    console.log('   Audio URL:', sunoResult.audioUrl)
    console.log('   Duration:', sunoResult.duration, 's')
  } catch (e) {
    console.error('   ✗ Suno 生成失败:', e)
    process.exit(1)
  }

  if (!sunoResult.audioUrl) {
    console.error('   ✗ 没有返回音频 URL')
    process.exit(1)
  }

  // 下载 Suno 生成的音频
  console.log('\n3. 下载 Suno 音频...')
  const audioRes = await fetch(sunoResult.audioUrl, {
    dispatcher: proxyAgent
  })
  const audioBuffer = await audioRes.arrayBuffer()
  const sunoOutputPath = 'temp/suno-rap.mp3'
  fs.writeFileSync(sunoOutputPath, Buffer.from(audioBuffer))
  console.log(`   ✓ 已保存: ${sunoOutputPath} (${(audioBuffer.byteLength / 1024).toFixed(1)} KB)`)

  // Demucs 人声分离
  console.log('\n4. Demucs 人声分离...')
  const sepStartTime = Date.now()

  const formData = new FormData()
  formData.append('audio_file', new Blob([audioBuffer]), 'suno-rap.mp3')
  formData.append('model', 'htdemucs')

  const sepRes = await fetch(`${DEMUCS_API_URL}/api/v1/separate`, {
    method: 'POST',
    body: formData,
  })

  const sepResult = await sepRes.json()
  const sepTime = ((Date.now() - sepStartTime) / 1000).toFixed(1)

  if (sepResult.status !== 'completed') {
    console.error('   ✗ 分离失败:', sepResult.error)
    process.exit(1)
  }

  console.log(`   ✓ 分离完成 (${sepTime}s)`)
  console.log('   Task ID:', sepResult.task_id)
  console.log('   Duration:', sepResult.duration?.toFixed(1), 's')

  // 下载人声
  console.log('\n5. 下载分离结果...')
  if (sepResult.vocals) {
    const vocalsRes = await fetch(`${DEMUCS_API_URL}${sepResult.vocals}`)
    const vocalsBuffer = await vocalsRes.arrayBuffer()
    const vocalsPath = 'temp/suno-demucs-vocals.wav'
    fs.writeFileSync(vocalsPath, Buffer.from(vocalsBuffer))
    console.log(`   ✓ 人声: ${vocalsPath} (${(vocalsBuffer.byteLength / 1024).toFixed(1)} KB)`)
  }

  // 下载伴奏
  if (sepResult.accompaniment) {
    const bgmRes = await fetch(`${DEMUCS_API_URL}${sepResult.accompaniment}`)
    const bgmBuffer = await bgmRes.arrayBuffer()
    const bgmPath = 'temp/suno-demucs-bgm.wav'
    fs.writeFileSync(bgmPath, Buffer.from(bgmBuffer))
    console.log(`   ✓ 伴奏: ${bgmPath} (${(bgmBuffer.byteLength / 1024).toFixed(1)} KB)`)
  }

  // 总结
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n' + '='.repeat(60))
  console.log('✓ 完整流程测试成功!')
  console.log('='.repeat(60))
  console.log(`总耗时: ${totalTime}s`)
  console.log('\n输出文件:')
  console.log(`  - 原始 Rap: ${sunoOutputPath}`)
  console.log(`  - 人声: temp/suno-demucs-vocals.wav`)
  console.log(`  - 伴奏: temp/suno-demucs-bgm.wav`)
}

testSunoDemucsFlow().catch(console.error)
