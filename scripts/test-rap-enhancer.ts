/**
 * Rap 增强器完整测试脚本
 *
 * 测试 RapEnhancer 的完整处理流程
 *
 * 运行方式：
 *   bun run scripts/test-rap-enhancer.ts
 */

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { getRapEnhancer, RapPreset, RAP_PRESETS } from '../src/lib/audio/rap-enhancer'
import type { BeatAnalysisResult } from '../src/lib/audio/types'

// ============================================================================
// 配置
// ============================================================================

const TEST_AUDIO_PATH = join(process.cwd(), 'test-voice-audio.mp3')
const OUTPUT_DIR = join(process.cwd(), 'test-output', 'rap-enhancer')

// 测试的预设配置
const TEST_PRESETS: RapPreset[] = ['subtle', 'balanced', 'energetic', 'aggressive', 'melodic']

// 模拟节拍信息
const MOCK_BEAT_INFO: BeatAnalysisResult = {
  bpm: 90,
  offset: 0.1,
  beatInterval: 666.67, // 60000 / 90
  confidence: 0.85,
  beats: generateMockBeats(90, 0.1, 60), // 60秒的节拍
  duration: 60,
}

/**
 * 生成模拟节拍时间点
 */
function generateMockBeats(bpm: number, offset: number, duration: number): number[] {
  const beats: number[] = []
  const interval = 60 / bpm // 秒
  for (let t = offset; t < duration; t += interval) {
    beats.push(t)
  }
  return beats
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log('========================================')
  console.log('Rap 增强器完整测试')
  console.log('========================================\n')

  // 1. 加载测试音频
  let testAudio: Buffer
  try {
    testAudio = await readFile(TEST_AUDIO_PATH)
    console.log(`✓ 加载测试音频: ${TEST_AUDIO_PATH}`)
    console.log(`  大小: ${(testAudio.length / 1024).toFixed(1)} KB\n`)
  } catch {
    console.log(`✗ 测试音频不存在: ${TEST_AUDIO_PATH}`)
    process.exit(1)
  }

  // 2. 创建 Rap 增强器
  const enhancer = getRapEnhancer({ debug: true })
  console.log('✓ Rap 增强器已初始化\n')

  // 3. 创建输出目录
  try {
    const { mkdir } = await import('fs/promises')
    await mkdir(OUTPUT_DIR, { recursive: true })
  } catch {
    // 忽略
  }

  // 4. 保存原始音频
  await writeFile(join(OUTPUT_DIR, '00-original.mp3'), testAudio)
  console.log('✓ 保存原始音频: 00-original.mp3\n')

  // 5. 测试所有预设
  console.log('--- 测试预设配置 ---\n')

  const results: Array<{ preset: string; success: boolean; duration: number; error?: string }> = []

  for (const preset of TEST_PRESETS) {
    console.log(`测试预设: ${preset}`)
    console.log(`  配置: ${JSON.stringify(RAP_PRESETS[preset].pitch)}, ${JSON.stringify(RAP_PRESETS[preset].energy)}`)

    try {
      const result = await enhancer.enhanceWithPreset(testAudio, preset, MOCK_BEAT_INFO)

      if (result.success && result.audioBuffer) {
        const outputPath = join(OUTPUT_DIR, `${preset}.mp3`)
        await writeFile(outputPath, result.audioBuffer)
        console.log(`  ✓ 成功: ${outputPath}`)
        console.log(`    处理时间: ${result.duration}ms`)
        if (result.details?.f0) {
          console.log(`    F0 有效比例: ${(result.details.f0.validRatio * 100).toFixed(1)}%`)
        }
        results.push({ preset, success: true, duration: result.duration })
      } else {
        console.log(`  ✗ 失败: ${result.error}`)
        results.push({ preset, success: false, duration: result.duration, error: result.error })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.log(`  ✗ 异常: ${errorMsg}`)
      results.push({ preset, success: false, duration: 0, error: errorMsg })
    }

    console.log()
  }

  // 6. 测试完整 Rap 处理流程（带 BGM 混音）
  console.log('--- 测试完整 Rap 处理流程 ---\n')

  // 检查是否有 BGM 文件
  const bgmPath = join(process.cwd(), 'test-output', 'viral-video-audio.mp3')
  let bgmBuffer: Buffer | undefined

  try {
    bgmBuffer = await readFile(bgmPath)
    console.log(`✓ 加载 BGM: ${bgmPath}`)
  } catch {
    console.log(`  跳过 BGM 混音测试（无 BGM 文件）`)
  }

  if (bgmBuffer) {
    console.log('\n处理中...')
    const fullResult = await enhancer.processRap(
      testAudio,
      MOCK_BEAT_INFO,
      '这是测试歌词',
      bgmBuffer
    )

    if (fullResult.success && fullResult.audioBuffer) {
      const outputPath = join(OUTPUT_DIR, 'full-rap-with-bgm.mp3')
      await writeFile(outputPath, fullResult.audioBuffer)
      console.log(`✓ 完整 Rap 处理成功: ${outputPath}`)
      console.log(`  处理时间: ${fullResult.duration}ms`)
      if (fullResult.stageDurations) {
        console.log(`  阶段耗时: F0=${fullResult.stageDurations.f0}ms, Energy=${fullResult.stageDurations.energy}ms, Effects=${fullResult.stageDurations.effects}ms`)
      }
    } else {
      console.log(`✗ 完整处理失败: ${fullResult.error}`)
    }
  } else {
    // 没有 BGM 时，只做增强处理
    console.log('\n处理中（无 BGM）...')
    const fullResult = await enhancer.enhance(testAudio, {
      pitch: { semitoneShift: 2.5, dynamicRange: 0.25, pattern: 'wave' },
      energy: { enabled: true, dynamicRange: 18, strongBeatGain: 4 },
      beatInfo: MOCK_BEAT_INFO,
      effects: {
        compressor: { enabled: true, threshold: -15, ratio: 4 },
        normalize: true,
      },
    })

    if (fullResult.success && fullResult.audioBuffer) {
      const outputPath = join(OUTPUT_DIR, 'full-rap-enhanced.mp3')
      await writeFile(outputPath, fullResult.audioBuffer)
      console.log(`✓ 完整增强处理成功: ${outputPath}`)
      console.log(`  处理时间: ${fullResult.duration}ms`)
    } else {
      console.log(`✗ 完整处理失败: ${fullResult.error}`)
    }
  }

  // 7. 输出测试结果摘要
  console.log('\n========================================')
  console.log('测试结果摘要')
  console.log('========================================\n')

  const successCount = results.filter((r) => r.success).length
  console.log(`成功: ${successCount}/${results.length}\n`)

  console.log('输出文件:')
  console.log(`  ${OUTPUT_DIR}/`)
  console.log(`  ├── 00-original.mp3      # 原始音频`)
  for (const result of results) {
    if (result.success) {
      console.log(`  ├── ${result.preset}.mp3            # ${result.preset} 预设 (${result.duration}ms)`)
    }
  }
  if (bgmBuffer) {
    console.log(`  └── full-rap-with-bgm.mp3 # 完整处理 + BGM 混音`)
  }
  console.log()

  // 8. 听感测试指引
  console.log('========================================')
  console.log('听感测试指引')
  console.log('========================================\n')

  console.log('请播放以下文件进行对比:')
  console.log('1. 原始音频: test-output/rap-enhancer/00-original.mp3')
  console.log('2. balanced 预设: test-output/rap-enhancer/balanced.mp3')
  console.log('3. energetic 预设: test-output/rap-enhancer/energetic.mp3\n')

  console.log('评估标准:')
  console.log('  - 哪个更像"在唱"？')
  console.log('  - 哪个更有"节奏感"？')
  console.log('  - 哪个更接近 Rap 的感觉？\n')

  console.log('快速播放命令:')
  console.log('  # macOS')
  console.log('  afplay test-output/rap-enhancer/00-original.mp3')
  console.log('  afplay test-output/rap-enhancer/balanced.mp3')
  console.log('  afplay test-output/rap-enhancer/energetic.mp3\n')

  // 返回退出码
  process.exit(successCount === results.length ? 0 : 1)
}

// 运行
main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})
