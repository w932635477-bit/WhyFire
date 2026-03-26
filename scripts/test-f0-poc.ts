/**
 * F0 轮廓操控 POC 测试脚本
 *
 * 目标：验证 F0 提取和变换是否能产生"演唱感"
 *
 * 测试步骤：
 * 1. 加载测试音频
 * 2. 提取 F0 轮廓
 * 3. 应用变换（升高 2-5 半音）
 * 4. 保存输出音频
 * 5. 人工听感测试
 *
 * 运行方式：
 *   bun run scripts/test-f0-poc.ts
 *
 * 成功标准：
 *   5 人中至少 3 人认为变换后的音频"更像在唱"
 */

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { F0Transformer, getF0Transformer } from '../src/lib/audio/f0-transformer'

// ============================================================================
// 配置
// ============================================================================

const TEST_AUDIO_PATH = join(process.cwd(), 'test-voice-audio.mp3')
const OUTPUT_DIR = join(process.cwd(), 'test-output')

// 测试配置
const TEST_CONFIGS = [
  { name: 'rise-2semitones', semitoneShift: 2, pattern: 'rise' as const },
  { name: 'rise-4semitones', semitoneShift: 4, pattern: 'rise' as const },
  { name: 'wave-2semitones', semitoneShift: 2, pattern: 'wave' as const },
  { name: 'wave-4semitones', semitoneShift: 4, pattern: 'wave' as const },
  { name: 'dynamic-enhanced', semitoneShift: 2, dynamicRange: 0.3 },
]

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log('========================================')
  console.log('F0 轮廓操控 POC 测试')
  console.log('========================================\n')

  // 1. 检查测试音频是否存在
  let testAudio: Buffer
  try {
    testAudio = await readFile(TEST_AUDIO_PATH)
    console.log(`✓ 加载测试音频: ${TEST_AUDIO_PATH}`)
    console.log(`  大小: ${(testAudio.length / 1024).toFixed(1)} KB\n`)
  } catch {
    console.log(`✗ 测试音频不存在: ${TEST_AUDIO_PATH}`)
    console.log('\n请提供一个测试音频文件，或修改脚本中的 TEST_AUDIO_PATH')
    console.log('\n示例命令:')
    console.log('  # 从视频提取音频')
    console.log('  ffmpeg -i your-video.mp4 -vn -acodec libmp3lame test-voice-audio.mp3')
    console.log('\n  # 或使用现有音频')
    console.log('  cp /path/to/your/audio.mp3 test-voice-audio.mp3')
    process.exit(1)
  }

  // 2. 创建 F0 变换器
  const transformer = getF0Transformer({ debug: true })
  console.log('✓ F0 变换器已初始化\n')

  // 3. 提取原始 F0
  console.log('--- 步骤 1: 提取 F0 轮廓 ---')
  const f0Result = await transformer.extractF0FromBuffer(testAudio)

  if (!f0Result.f0 || f0Result.f0.length === 0) {
    console.log('✗ F0 提取失败')
    process.exit(1)
  }

  // 统计 F0 信息
  const validF0 = f0Result.f0.filter((p) => p > 0)
  const avgF0 = validF0.reduce((a, b) => a + b, 0) / validF0.length
  const minF0 = Math.min(...validF0)
  const maxF0 = Math.max(...validF0)

  console.log(`✓ F0 提取成功`)
  console.log(`  总帧数: ${f0Result.f0.length}`)
  console.log(`  有效帧: ${validF0.length} (${((validF0.length / f0Result.f0.length) * 100).toFixed(1)}%)`)
  console.log(`  平均 F0: ${avgF0.toFixed(1)} Hz`)
  console.log(`  F0 范围: ${minF0.toFixed(1)} - ${maxF0.toFixed(1)} Hz`)
  console.log(`  时长: ${(f0Result.timestamps[f0Result.timestamps.length - 1]).toFixed(2)} 秒\n`)

  // 4. 测试各种变换配置
  console.log('--- 步骤 2: 测试 F0 变换 ---\n')

  // 创建输出目录
  try {
    const { mkdir } = await import('fs/promises')
    await mkdir(OUTPUT_DIR, { recursive: true })
  } catch {
    // 忽略
  }

  // 保存原始音频作为参考
  await writeFile(join(OUTPUT_DIR, '00-original.mp3'), testAudio)
  console.log('✓ 保存原始音频: 00-original.mp3\n')

  const results: Array<{ name: string; success: boolean; error?: string }> = []

  for (const config of TEST_CONFIGS) {
    console.log(`测试配置: ${config.name}`)
    console.log(`  参数: semitoneShift=${config.semitoneShift}, pattern=${config.pattern || 'none'}, dynamicRange=${config.dynamicRange || 0}`)

    try {
      const result = await transformer.process(testAudio, config)

      if (result.success && result.audioBuffer) {
        const outputPath = join(OUTPUT_DIR, `${config.name}.mp3`)
        await writeFile(outputPath, result.audioBuffer)
        console.log(`  ✓ 输出: ${outputPath}`)
        results.push({ name: config.name, success: true })
      } else {
        console.log(`  ✗ 失败: ${result.error} - ${result.errorMessage}`)
        results.push({ name: config.name, success: false, error: result.errorMessage })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.log(`  ✗ 异常: ${errorMsg}`)
      results.push({ name: config.name, success: false, error: errorMsg })
    }

    console.log()
  }

  // 5. 生成 F0 可视化数据
  console.log('--- 步骤 3: 生成 F0 可视化 ---')
  const f0Data = {
    timestamps: f0Result.timestamps.slice(0, 100), // 只取前 100 个点
    f0: f0Result.f0.slice(0, 100),
    avgF0,
    minF0,
    maxF0,
  }
  await writeFile(join(OUTPUT_DIR, 'f0-data.json'), JSON.stringify(f0Data, null, 2))
  console.log('✓ 保存 F0 数据: f0-data.json\n')

  // 6. 输出测试结果摘要
  console.log('========================================')
  console.log('测试结果摘要')
  console.log('========================================\n')

  const successCount = results.filter((r) => r.success).length
  console.log(`成功: ${successCount}/${results.length}\n`)

  console.log('输出文件:')
  console.log(`  ${OUTPUT_DIR}/`)
  console.log(`  ├── 00-original.mp3      # 原始音频`)
  for (const result of results) {
    if (result.success) {
      console.log(`  ├── ${result.name}.mp3          # ${result.name}`)
    }
  }
  console.log(`  └── f0-data.json         # F0 数据\n`)

  // 7. 听感测试指引
  console.log('========================================')
  console.log('听感测试指引')
  console.log('========================================\n')

  console.log('请播放以下文件进行对比:')
  console.log('1. 原始音频: test-output/00-original.mp3')
  console.log('2. 变换后音频: test-output/rise-4semitones.mp3 (推荐)\n')

  console.log('评估标准:')
  console.log('  - 哪个更像"在唱"？')
  console.log('  - 哪个更有"韵律感"？')
  console.log('  - 哪个更接近 Rap 的感觉？\n')

  console.log('成功标准: 5 人中至少 3 人认为变换后的音频"更像在唱"\n')

  console.log('快速播放命令:')
  console.log('  # macOS')
  console.log('  afplay test-output/00-original.mp3')
  console.log('  afplay test-output/rise-4semitones.mp3\n')
  console.log('  # Linux')
  console.log('  mpv test-output/00-original.mp3')
  console.log('  mpv test-output/rise-4semitones.mp3\n')

  // 返回退出码
  process.exit(successCount === results.length ? 0 : 1)
}

// 运行
main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})
