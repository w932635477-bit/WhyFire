/**
 * 测试 Seed-VC base64 传输
 *
 * 验证 base64 传输链路是否正常工作
 *
 * 运行: npx tsx scripts/test-seedvc-base64.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import * as childProcess from 'child_process'

const MODAL_URL = process.env.MODAL_WEB_ENDPOINT_URL!

// 短音频用于测试
const TEST_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
const REF_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'

function downloadWithCurl(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = childProcess.execSync(
      `curl -s -L -o "${dest}" --max-time 30 "${url}"`,
      { timeout: 35000 }
    )
    resolve()
  })
}

async function main() {
  console.log('=== Seed-VC Base64 传输测试 ===\n')
  console.log(`Modal endpoint: ${MODAL_URL}`)

  const tmpDir = '/tmp/seedvc-test'
  fs.mkdirSync(tmpDir, { recursive: true })

  const sourceFile = path.join(tmpDir, 'source.mp3')
  const refFile = path.join(tmpDir, 'reference.mp3')

  // 1. 用 curl 下载（走系统代理）
  console.log('\n[1/4] 下载测试音频...')
  downloadWithCurl(TEST_AUDIO_URL, sourceFile)
  console.log(`  源音频: ${fs.statSync(sourceFile).size} bytes`)
  downloadWithCurl(REF_AUDIO_URL, refFile)
  console.log(`  参考音频: ${fs.statSync(refFile).size} bytes`)

  // 2. 编码为 base64
  console.log('\n[2/4] 编码为 base64...')
  const sourceBuffer = fs.readFileSync(sourceFile)
  const refBuffer = fs.readFileSync(refFile)
  const sourceBase64 = `data:audio/wav;base64,${sourceBuffer.toString('base64')}`
  const refBase64 = `data:audio/wav;base64,${refBuffer.toString('base64')}`
  console.log(`  源 base64: ${(sourceBase64.length / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  参考base64: ${(refBase64.length / 1024 / 1024).toFixed(2)} MB`)

  // 3. 用 curl 发送请求（不走代理，因为大请求体可能被代理截断）
  console.log('\n[3/4] 发送到 Modal GPU 推理...')
  const requestBody = JSON.stringify({
    source_audio_base64: sourceBase64,
    reference_audio_base64: refBase64,
    f0_condition: true,
    fp16: true,
    diffusion_steps: 25,
    length_adjust: 1.0,
    inference_cfg_rate: 0.7,
  })

  const requestBodyFile = path.join(tmpDir, 'request.json')
  fs.writeFileSync(requestBodyFile, requestBody)
  const responseBodyFile = path.join(tmpDir, 'response.json')

  console.log(`  请求体大小: ${(fs.statSync(requestBodyFile).size / 1024 / 1024).toFixed(2)} MB`)
  console.log('  发送中（可能需要 1-5 分钟）...')

  const startTime = Date.now()

  try {
    // --noproxy '*' 强制不走代理直连 Modal
    childProcess.execSync(
      `curl -s --noproxy '*' -X POST -H 'Content-Type: application/json' -d @"${requestBodyFile}" -o "${responseBodyFile}" --max-time 540 "${MODAL_URL}"`,
      { timeout: 600000 }
    )
  } catch (e: any) {
    if (fs.existsSync(responseBodyFile) && fs.statSync(responseBodyFile).size > 0) {
      // curl 可能返回非 0 但有响应体
      console.log('  curl 非零退出码，但有响应体，继续处理...')
    } else {
      throw new Error(`Modal 请求失败: ${e.message}`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`  响应耗时: ${elapsed}s`)

  // 4. 解析响应
  console.log('\n[4/4] 解析响应...')
  const responseData = JSON.parse(fs.readFileSync(responseBodyFile, 'utf-8'))
  console.log(`\n--- Modal 响应 ---`)
  console.log(`  status: ${responseData.status}`)
  console.log(`  task_id: ${responseData.task_id}`)
  console.log(`  duration: ${responseData.duration}s`)
  console.log(`  processing_time: ${responseData.processing_time}s`)
  console.log(`  error: ${responseData.error || '无'}`)

  if (responseData.output_audio) {
    const outputLen = responseData.output_audio.length
    console.log(`  output_audio: ${(outputLen / 1024 / 1024 * 0.75).toFixed(2)} MB`)

    // 验证格式
    if (responseData.output_audio.startsWith('data:audio/wav;base64,')) {
      console.log(`  格式: OK (data:audio/wav;base64,...)`)
    } else {
      console.log(`  格式: 未知 - ${responseData.output_audio.substring(0, 50)}`)
    }

    // 解码验证
    const base64Data = responseData.output_audio.split(',')[1]
    const decoded = Buffer.from(base64Data, 'base64')
    console.log(`  解码后大小: ${(decoded.length / 1024).toFixed(1)} KB`)

    const header = decoded.toString('ascii', 0, 4)
    console.log(`  WAV 头: ${header} ${header === 'RIFF' ? 'OK' : '非 WAV'}`)
  }

  // 最终结论
  if (responseData.status === 'completed' && responseData.output_audio) {
    console.log('\n=== 测试通过! base64 传输链路正常工作 ===')
  } else if (responseData.status === 'failed') {
    console.log('\n=== base64 传输成功，但推理失败 ===')
    console.log(`  错误: ${responseData.error}`)
    console.log('  传输本身已正常，问题在 Seed-VC 模型推理')
  } else {
    console.log('\n=== 未知状态 ===')
    console.log(JSON.stringify(responseData, null, 2))
  }

  // 清理
  fs.rmSync(tmpDir, { recursive: true, force: true })
}

main().catch((err) => {
  console.error('\n测试异常:', err)
  process.exit(1)
})
