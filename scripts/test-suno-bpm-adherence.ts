// scripts/test-suno-bpm-adherence.ts
/**
 * Suno BPM Adherence Test
 *
 * 目的：验证 Suno API 是否遵循 style 参数中的 BPM 指令
 *
 * 使用方法：
 *   npx tsx scripts/test-suno-bpm-adherence.ts
 *
 * 测试后：
 *   1. 访问 https://bpmdetector.com
 *   2. 上传生成的音频文件
 *   3. 记录实际 BPM
 *   4. 计算偏差 = |actual - expected| / expected * 100%
 *
 * 通过标准：所有偏差 < 10%
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const TEST_CASES = [
  { bpm: 90, label: 'slow' },
  { bpm: 140, label: 'medium' },
  { bpm: 170, label: 'fast' },
]

const TEST_LYRICS = `
[Verse 1]
Testing one two three
This is a BPM test
Check the rhythm check the flow
`

async function testBPMAdherence() {
  const apiKey = process.env.SUNO_API_KEY
  const baseUrl = process.env.SUNO_API_URL || 'https://api.evolink.ai'

  if (!apiKey) {
    console.error('Error: SUNO_API_KEY not set in .env.local')
    process.exit(1)
  }

  console.log('Suno BPM Adherence Test')
  console.log('='.repeat(50))

  for (const testCase of TEST_CASES) {
    console.log(`\nTest: ${testCase.bpm} BPM (${testCase.label})`)

    try {
      // 创建任务
      const createResponse = await fetch(`${baseUrl}/v1/audios/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'suno-v4.5-beta',
          custom_mode: true,
          instrumental: false,
          prompt: TEST_LYRICS,
          style: `rap, ${testCase.bpm} BPM, hip-hop, trap`, // 关键：包含 BPM 指令
          negative_tags: 'singing, melody, ballad, pop song',
          title: `BPM Test ${testCase.bpm}`,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!createResponse.ok) {
        const error = await createResponse.json()
        throw new Error(`API error: ${createResponse.status} - ${JSON.stringify(error)}`)
      }

      const task = await createResponse.json()
      const taskId = task.id
      console.log(`  Task ID: ${taskId}`)

      // 轮询等待结果（最多等待 3 分钟）
      const startTime = Date.now()
      const timeout = 180000
      let result: any

      while (Date.now() - startTime < timeout) {
        const statusResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(10000),
        })

        if (!statusResponse.ok) {
          throw new Error(`Failed to get task status`)
        }

        const status = await statusResponse.json()
        console.log(`  Progress: ${status.progress}%`)

        if (status.status === 'completed') {
          if (status.result_data && status.result_data.length > 0) {
            result = status.result_data[0]
            break
          }
          throw new Error('Task completed but no results')
        }

        if (status.status === 'failed') {
          throw new Error(`Task failed: ${status.error?.message || 'Unknown error'}`)
        }

        // 等待 3 秒后继续轮询
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      if (!result) {
        throw new Error('Task timeout - took longer than 3 minutes')
      }

      console.log(`  Generated: ${result.audio_url}`)
      console.log(`  Expected BPM: ${testCase.bpm}`)
      console.log(`  Duration: ${result.duration}s`)
      console.log(`  Style tags: ${result.tags}`)
      console.log(`  -> 请使用 bpmdetector.com 检测实际 BPM`)
      console.log(`  -> 计算偏差: |actual - ${testCase.bpm}| / ${testCase.bpm} * 100%`)
    } catch (error) {
      console.error(`  Error: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('测试完成！')
  console.log('\n下一步：')
  console.log('1. 使用 bpmdetector.com 检测每个音频的实际 BPM')
  console.log('2. 计算偏差百分比')
  console.log('3. 如果所有偏差 < 10%，则 Suno BPM 可靠')
  console.log('4. 如果偏差 >= 10%，需要考虑 BGM 协调方案替代策略')
}

testBPMAdherence().catch(console.error)
