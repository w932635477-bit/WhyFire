/**
 * D-Lite Rap 完整端到端测试
 * 视频 → 声音克隆 → 方言 Rap
 *
 * 使用方法:
 * npx tsx scripts/test-full-e2e-d-lite-rap.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') })
config()

import { getCosyVoiceCloneClient } from '../src/lib/tts/cosyvoice-clone-client'
import { RapGenerator } from '../src/lib/services/rap-generator'
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs'
import { execSync } from 'child_process'
import { tmpdir } from 'os'

const VIDEO_PATH = '/Users/weilei/Desktop/v0300fg10000csaud1fog65rrl686cjg.MP4'

async function main() {
  console.log('='.repeat(70))
  console.log('🎤 D-Lite Rap 完整端到端测试')
  console.log('   (视频 → 声音克隆 → 方言 Rap)')
  console.log('='.repeat(70))
  console.log()

  // 检查环境变量
  if (!process.env.DASHSCOPE_API_KEY) {
    console.error('❌ DASHSCOPE_API_KEY 未设置')
    process.exit(1)
  }
  console.log('✅ DASHSCOPE_API_KEY 已设置')

  // 检查视频文件
  if (!existsSync(VIDEO_PATH)) {
    console.error(`❌ 视频文件不存在: ${VIDEO_PATH}`)
    process.exit(1)
  }
  console.log(`✅ 视频文件存在: ${VIDEO_PATH}`)

  // ========================================
  // Step 1: 从视频提取音频
  // ========================================
  console.log('\n' + '='.repeat(70))
  console.log('📹 Step 1: 从视频提取音频')
  console.log('='.repeat(70))

  const extractedAudioPath = `${tmpdir()}/extracted-${Date.now()}.wav`

  try {
    // 提取音频并转换为 16k 采样率单声道
    execSync(
      `ffmpeg -y -i "${VIDEO_PATH}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${extractedAudioPath}"`,
      { stdio: 'pipe' }
    )

    const audioStats = execSync(`stat -f%z "${extractedAudioPath}"`).toString().trim()
    const sizeMB = (parseInt(audioStats) / 1024 / 1024).toFixed(2)
    console.log(`✅ 音频提取完成: ${sizeMB} MB`)

    // 获取音频时长
    const durationOutput = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${extractedAudioPath}"`,
      { encoding: 'utf-8' }
    ).trim()
    console.log(`   音频时长: ${parseFloat(durationOutput).toFixed(1)} 秒`)
  } catch (error) {
    console.error('❌ 音频提取失败:', error)
    process.exit(1)
  }

  // ========================================
  // Step 2: 声音克隆
  // ========================================
  console.log('\n' + '='.repeat(70))
  console.log('🎙️ Step 2: 声音克隆 (CosyVoice)')
  console.log('='.repeat(70))

  const cloneClient = getCosyVoiceCloneClient()

  if (!cloneClient.isConfigured()) {
    console.error('❌ CosyVoice Clone 未配置')
    process.exit(1)
  }

  // 读取音频数据
  const audioData = readFileSync(extractedAudioPath).toString('base64')

  // 生成唯一的音色前缀（最多10位）
  const prefix = `t${Date.now().toString(36).slice(-8)}`
  console.log(`   创建复刻音色，前缀: ${prefix}`)

  const createResult = await cloneClient.createVoice({
    audioData,
    prefix,
    targetModel: 'cosyvoice-v3-flash',
    languageHints: ['zh'],
  })

  if (!createResult.success) {
    console.error(`❌ 音色创建失败: ${createResult.error}`)
    process.exit(1)
  }

  const voiceId = createResult.voiceId!
  console.log(`✅ 音色创建成功: ${voiceId}`)

  // 等待音色审核通过
  console.log('\n   等待音色审核...')
  const waitResult = await cloneClient.waitForVoiceReady(voiceId, 120000, 3000)

  if (!waitResult.ready) {
    console.error(`❌ 音色审核失败: ${waitResult.error}`)
    process.exit(1)
  }

  console.log(`✅ 音色审核通过，状态: ${waitResult.status}`)

  // ========================================
  // Step 3: 测试歌词
  // ========================================
  console.log('\n' + '='.repeat(70))
  console.log('📝 Step 3: 歌词')
  console.log('='.repeat(70))

  const testLyrics = `今天天气真好阳光明媚
我想唱一首方言说唱
生活就是要开心快乐
让我们的节奏一起摇摆
用我的声音唱出心声
方言的魅力无法阻挡
这就是我独特的风格
一起来感受这份热情`

  console.log(`   歌词:\n${testLyrics.split('\n').map(l => '   ' + l).join('\n')}`)

  // ========================================
  // Step 4: D-Lite Rap 生成 (使用克隆音色)
  // ========================================
  console.log('\n' + '='.repeat(70))
  console.log('🎵 Step 4: D-Lite Rap 生成 (使用克隆音色)')
  console.log('='.repeat(70))

  const generator = new RapGenerator({
    onProgress: (progress) => {
      console.log(`   [${progress.step}] ${progress.progress}% - ${progress.message}`)
    },
  })

  const startTime = Date.now()

  const result = await generator.generate({
    lyrics: testLyrics,
    dialect: 'original', // 使用原声（保留用户声音本色）
    bgmId: 'beat-1', // 八方来财 130 BPM
    voiceId, // 使用克隆的音色
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n' + '='.repeat(70))
  console.log('📊 生成结果')
  console.log('='.repeat(70))
  console.log(`   任务 ID: ${result.taskId}`)
  console.log(`   状态: ${result.status}`)
  console.log(`   耗时: ${elapsed} 秒`)

  if (result.status === 'completed') {
    console.log(`   ✅ 生成成功!`)
    console.log(`   时长: ${result.duration?.toFixed(1)} 秒`)
    console.log(`   BGM: ${result.bgmName} (${result.bpm} BPM)`)
    console.log(`   Tempo 调整: ${result.tempoAdjustment?.toFixed(3)}x`)
    console.log(`   使用音色: ${voiceId}`)

    // 保存音频文件
    if (result.audioUrl) {
      const audioBuffer = Buffer.from(result.audioUrl.split(',')[1], 'base64')
      const outputPath = `/tmp/d-lite-full-e2e-rap-${Date.now()}.mp3`
      writeFileSync(outputPath, audioBuffer)
      console.log(`   💾 已保存到: ${outputPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)`)

      // 播放音频 (macOS)
      console.log('\n🎵 播放生成的 Rap...')
      try {
        execSync(`afplay "${outputPath}"`, { stdio: 'inherit' })
      } catch {
        console.log('   (播放结束或被中断)')
      }
    }
  } else {
    console.log(`   ❌ 生成失败: ${result.error}`)
  }

  // ========================================
  // 清理
  // ========================================
  console.log('\n' + '='.repeat(70))
  console.log('🧹 清理测试资源')
  console.log('='.repeat(70))

  // 删除创建的音色
  try {
    await cloneClient.deleteVoice(voiceId)
    console.log(`✅ 已删除测试音色: ${voiceId}`)
  } catch (error) {
    console.log(`⚠️ 删除音色失败: ${error}`)
  }

  // 删除临时音频
  try {
    unlinkSync(extractedAudioPath)
    console.log('✅ 已删除临时音频文件')
  } catch {
    // 忽略
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ D-Lite Rap 完整端到端测试完成!')
  console.log('='.repeat(70))
}

main().catch(console.error)
