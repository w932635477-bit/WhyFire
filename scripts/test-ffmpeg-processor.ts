/**
 * FFmpeg 处理流程本地测试
 * 使用合成音频测试 FFmpeg 时间拉伸和混音功能
 *
 * 使用方法:
 * npx tsx scripts/test-ffmpeg-processor.ts
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { getFFmpegProcessor } from '../src/lib/audio/ffmpeg-processor'

const execAsync = promisify(exec)

// ============================================================================
// 配置
// ============================================================================

const OUTPUT_DIR = join(process.cwd(), 'test-output', 'ffmpeg-test')

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 使用 FFmpeg 生成测试音频
 */
async function generateTestAudio(
  outputPath: string,
  frequency: number,
  duration: number
): Promise<Buffer> {
  const command = `ffmpeg -y -f lavfi -i "sine=frequency=${frequency}:duration=${duration}" -c:a libmp3lame -q:a 2 "${outputPath}"`

  await execAsync(command, { timeout: 10000 })
  return readFileSync(outputPath)
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('FFmpeg 处理流程测试')
  console.log('='.repeat(60))

  // 创建输出目录
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  console.log(`\n📁 输出目录: ${OUTPUT_DIR}`)

  // 初始化处理器
  const processor = getFFmpegProcessor()

  // 检查 FFmpeg 可用性
  const availability = await processor.checkAvailability()
  if (!availability.available) {
    console.error('❌ FFmpeg 不可用:', availability.error)
    process.exit(1)
  }
  console.log(`✅ FFmpeg 版本: ${availability.version}`)

  // ===========================================
  // Test 1: 时间拉伸
  // ===========================================
  console.log('\n' + '─'.repeat(40))
  console.log('Test 1: 时间拉伸')

  // 生成 2 秒测试音频
  const testAudio1Path = join(OUTPUT_DIR, 'test-input-1.mp3')
  const testAudio1 = await generateTestAudio(testAudio1Path, 440, 2)
  console.log(`  📥 输入: 440Hz 正弦波, 2 秒`)

  // 拉伸 1.5 倍
  const stretchResult = await processor.timeStretch(testAudio1, 1.5)
  const stretchedPath = join(OUTPUT_DIR, 'stretched-1.5x.mp3')
  writeFileSync(stretchedPath, stretchResult.audioBuffer)
  console.log(`  ✅ 拉伸 1.5x: ${stretchResult.originalDuration.toFixed(2)}s → ${stretchResult.processedDuration.toFixed(2)}s`)
  console.log(`  💾 已保存: ${stretchedPath}`)

  // 压缩 0.8 倍
  const compressResult = await processor.timeStretch(testAudio1, 0.8)
  const compressedPath = join(OUTPUT_DIR, 'compressed-0.8x.mp3')
  writeFileSync(compressedPath, compressResult.audioBuffer)
  console.log(`  ✅ 压缩 0.8x: ${compressResult.originalDuration.toFixed(2)}s → ${compressResult.processedDuration.toFixed(2)}s`)
  console.log(`  💾 已保存: ${compressedPath}`)

  // ===========================================
  // Test 2: 混音
  // ===========================================
  console.log('\n' + '─'.repeat(40))
  console.log('Test 2: 混音合成')

  // 生成人声和 BGM
  const vocalPath = join(OUTPUT_DIR, 'vocal.mp3')
  const bgmPath = join(OUTPUT_DIR, 'bgm.mp3')

  const vocalAudio = await generateTestAudio(vocalPath, 523, 3) // C5, 3秒
  const bgmAudio = await generateTestAudio(bgmPath, 262, 5) // C4, 5秒

  console.log(`  📥 人声: 523Hz (C5), 3 秒`)
  console.log(`  📥 BGM:  262Hz (C4), 5 秒`)

  // 混音
  const mixResult = await processor.mixTracks(vocalAudio, bgmAudio, {
    vocalVolume: 1.0,
    bgmVolume: 0.4,
    loopBgm: false,
  })
  const mixedPath = join(OUTPUT_DIR, 'mixed.mp3')
  writeFileSync(mixedPath, mixResult.audioBuffer)
  console.log(`  ✅ 混音完成: ${mixResult.processedDuration.toFixed(2)}秒`)
  console.log(`  💾 已保存: ${mixedPath}`)

  // ===========================================
  // Test 3: BGM 循环混音
  // ===========================================
  console.log('\n' + '─'.repeat(40))
  console.log('Test 3: BGM 循环混音')

  // 短 BGM + 长人声
  const shortBgm = await generateTestAudio(join(OUTPUT_DIR, 'short-bgm.mp3'), 330, 1) // E4, 1秒
  const longVocal = await generateTestAudio(join(OUTPUT_DIR, 'long-vocal.mp3'), 660, 3) // E5, 3秒

  console.log(`  📥 人声: 660Hz (E5), 3 秒`)
  console.log(`  📥 BGM:  330Hz (E4), 1 秒`)

  const loopMixResult = await processor.mixTracks(longVocal, shortBgm, {
    vocalVolume: 1.0,
    bgmVolume: 0.3,
    loopBgm: true,
  })
  const loopMixedPath = join(OUTPUT_DIR, 'loop-mixed.mp3')
  writeFileSync(loopMixedPath, loopMixResult.audioBuffer)
  console.log(`  ✅ 循环混音完成: ${loopMixResult.processedDuration.toFixed(2)}秒`)
  console.log(`  💾 已保存: ${loopMixedPath}`)

  // ===========================================
  // Test 4: 综合处理
  // ===========================================
  console.log('\n' + '─'.repeat(40))
  console.log('Test 4: 综合处理流程')

  const processResult = await processor.process(testAudio1, {
    timeStretchFactor: 1.2,
    effects: {
      normalize: true,
    },
  })
  const processedPath = join(OUTPUT_DIR, 'processed.mp3')
  writeFileSync(processedPath, processResult.audioBuffer)
  console.log(`  ✅ 综合处理完成: ${processResult.originalDuration.toFixed(2)}s → ${processResult.processedDuration.toFixed(2)}s`)
  console.log(`  💾 已保存: ${processedPath}`)

  // ===========================================
  // 测试结果汇总
  // ===========================================
  console.log('\n' + '='.repeat(60))
  console.log('测试结果汇总')
  console.log('='.repeat(60))

  console.log('\n| 测试项 | 原始时长 | 处理后时长 | 状态 |')
  console.log('|--------|----------|------------|------|')
  console.log(`| 拉伸 1.5x | 2.00s | ${stretchResult.processedDuration.toFixed(2)}s | ✅ |`)
  console.log(`| 压缩 0.8x | 2.00s | ${compressResult.processedDuration.toFixed(2)}s | ✅ |`)
  console.log(`| 混音合成 | 3.00s | ${mixResult.processedDuration.toFixed(2)}s | ✅ |`)
  console.log(`| 循环混音 | 3.00s | ${loopMixResult.processedDuration.toFixed(2)}s | ✅ |`)
  console.log(`| 综合处理 | 2.00s | ${processResult.processedDuration.toFixed(2)}s | ✅ |`)

  console.log(`\n📁 所有测试文件保存在: ${OUTPUT_DIR}`)
  console.log('🎧 请使用音频播放器检查生成的文件')
}

// 运行
main().catch(console.error)
