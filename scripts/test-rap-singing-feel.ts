/**
 * Rap "演唱感" 端到端测试脚本
 *
 * 验证 Rap 增强系统是否能让 TTS 输出真正"唱"起来
 *
 * 测试流程：
 * 1. 使用真实 TTS 生成多种方言的语音
 * 2. 运行所有预设的 Rap 增强
 * 3. 生成对比音频供人工评估
 *
 * 运行方式：
 *   bun run scripts/test-rap-singing-feel.ts
 */

import { writeFile, mkdir, rm } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

// 测试配置
const TEST_CONFIG = {
  // 测试歌词 - 短句用于快速测试
  lyrics: [
    { text: '老子今天不上班，爽翻巴适得板', dialect: 'sichuan', name: 'sichuan' },
    { text: '做人如果没有梦想，同条咸鱼有咩分别', dialect: 'cantonese', name: 'cantonese' },
    { text: '今天天气真不错，心情好得不得了', dialect: 'mandarin', name: 'mandarin' },
  ],
  // 预设
  presets: ['subtle', 'balanced', 'energetic', 'aggressive', 'melodic'] as const,
  // BPM
  bpm: 90,
}

// 模拟节拍信息
function createMockBeatInfo(bpm: number, duration: number) {
  const interval = 60 / bpm
  const beats: number[] = []
  for (let t = 0; t < duration; t += interval) {
    beats.push(t)
  }
  return {
    bpm,
    offset: 0,
    beatInterval: 60000 / bpm,
    confidence: 0.85,
    beats,
    duration,
  }
}

async function main() {
  console.log('========================================')
  console.log('Rap "演唱感" 端到端测试')
  console.log('========================================\n')

  const outputDir = join(projectRoot, 'test-output', 'rap-singing-feel')

  // 清理并创建输出目录
  if (existsSync(outputDir)) {
    await rm(outputDir, { recursive: true, force: true })
  }
  await mkdir(outputDir, { recursive: true })

  // 动态导入模块
  const { generateDialectSpeech } = await import('../src/lib/tts/tts-router')
  const { getRapEnhancer, RAP_PRESETS } = await import('../src/lib/audio/rap-enhancer')

  const enhancer = getRapEnhancer({ debug: true })

  // 测试结果
  const results: Array<{
    dialect: string
    preset: string
    success: boolean
    f0ValidRatio: number
    duration: number
    outputPath: string
  }> = []

  // 为每个歌词和预设生成测试
  for (const lyric of TEST_CONFIG.lyrics) {
    console.log(`\n--- 处理歌词: "${lyric.text}" (${lyric.dialect}) ---\n`)

    // 创建方言输出目录
    const dialectDir = join(outputDir, lyric.name)
    await mkdir(dialectDir, { recursive: true })

    // 1. 生成原始 TTS 音频
    console.log('生成原始 TTS 音频...')
    let ttsResult
    try {
      ttsResult = await generateDialectSpeech({
        text: lyric.text,
        dialect: lyric.dialect as any,
        format: 'mp3',
        sampleRate: 24000,
      })
      console.log(`  ✓ TTS 生成成功: ${ttsResult.duration.toFixed(2)}s`)
    } catch (error) {
      console.log(`  ✗ TTS 生成失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.log('  使用备用纯音测试...\n')

      // 如果 TTS 失败，使用 FFmpeg 生成测试音频
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)

      const tempPath = join(projectRoot, 'test-output', 'temp-tts.mp3')
      await execAsync(
        `ffmpeg -y -f lavfi -i "sine=frequency=300:duration=3" -ar 24000 -ac 1 -c:a libmp3lame -q:a 2 "${tempPath}"`,
        { timeout: 30000 }
      )

      const { readFile } = await import('fs/promises')
      const audioBuffer = await readFile(tempPath)
      ttsResult = {
        audioBuffer,
        duration: 3,
        dialect: lyric.dialect as any,
        provider: 'fallback' as any,
        characters: lyric.text.length,
      }

      await rm(tempPath, { force: true })
    }

    // 保存原始音频
    const originalPath = join(dialectDir, '00-original.mp3')
    await writeFile(originalPath, ttsResult.audioBuffer)
    console.log(`  ✓ 保存原始音频: ${originalPath}\n`)

    // 创建节拍信息
    const beatInfo = createMockBeatInfo(TEST_CONFIG.bpm, ttsResult.duration)

    // 2. 为每个预设生成增强音频
    for (const preset of TEST_CONFIG.presets) {
      console.log(`处理预设: ${preset}`)

      const presetConfig = RAP_PRESETS[preset]
      console.log(`  配置: semitoneShift=${presetConfig.pitch?.semitoneShift}, dynamicRange=${presetConfig.pitch?.dynamicRange}`)

      try {
        const result = await enhancer.enhance(ttsResult.audioBuffer, {
          ...presetConfig,
          beatInfo,
          lyrics: lyric.text,
          targetDuration: ttsResult.duration * 1000,
          debug: false,
        })

        if (result.success && result.audioBuffer) {
          const outputPath = join(dialectDir, `${preset}.mp3`)
          await writeFile(outputPath, result.audioBuffer)

          const f0ValidRatio = result.details?.f0?.validRatio || 0
          console.log(`  ✓ 生成成功: ${preset}.mp3`)
          console.log(`    处理时间: ${result.duration}ms`)
          console.log(`    F0 有效比例: ${(f0ValidRatio * 100).toFixed(1)}%`)

          results.push({
            dialect: lyric.name,
            preset,
            success: true,
            f0ValidRatio,
            duration: result.duration,
            outputPath,
          })
        } else {
          console.log(`  ✗ 失败: ${result.error}`)
          results.push({
            dialect: lyric.name,
            preset,
            success: false,
            f0ValidRatio: 0,
            duration: 0,
            outputPath: '',
          })
        }
      } catch (error) {
        console.log(`  ✗ 异常: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.push({
          dialect: lyric.name,
          preset,
          success: false,
          f0ValidRatio: 0,
          duration: 0,
          outputPath: '',
        })
      }
    }
  }

  // 3. 生成测试报告
  console.log('\n========================================')
  console.log('测试结果摘要')
  console.log('========================================\n')

  // 按方言统计
  for (const lyric of TEST_CONFIG.lyrics) {
    const dialectResults = results.filter((r) => r.dialect === lyric.name)
    const successCount = dialectResults.filter((r) => r.success).length

    console.log(`【${lyric.name}】(${lyric.dialect})`)
    console.log(`  歌词: "${lyric.text}"`)
    console.log(`  成功: ${successCount}/${dialectResults.length}`)

    // 显示 F0 有效比例
    for (const r of dialectResults) {
      if (r.success) {
        console.log(`    - ${r.preset}: F0=${(r.f0ValidRatio * 100).toFixed(1)}% (${r.duration}ms)`)
      }
    }
    console.log()
  }

  // 整体统计
  const totalSuccess = results.filter((r) => r.success).length
  const avgF0ValidRatio = results.filter((r) => r.success).reduce((sum, r) => sum + r.f0ValidRatio, 0) / totalSuccess || 0

  console.log('【整体统计】')
  console.log(`  总成功: ${totalSuccess}/${results.length}`)
  console.log(`  平均 F0 有效比例: ${(avgF0ValidRatio * 100).toFixed(1)}%`)
  console.log()

  // 4. 输出文件结构
  console.log('========================================')
  console.log('输出文件结构')
  console.log('========================================\n')

  console.log(`${outputDir}/`)
  for (const lyric of TEST_CONFIG.lyrics) {
    console.log(`├── ${lyric.name}/`)
    console.log(`│   ├── 00-original.mp3      # 原始 TTS`)
    for (const preset of TEST_CONFIG.presets) {
      console.log(`│   ├── ${preset}.mp3             # ${preset} 预设`)
    }
  }
  console.log()

  // 5. 听感测试指引
  console.log('========================================')
  console.log('听感测试指引')
  console.log('========================================\n')

  console.log('【关键问题】音频是否听起来像"在唱"而不是"在读"？\n')

  console.log('评估维度 (1-5 分):')
  console.log('  1. 音调变化 - 是否有明显的音调起伏？')
  console.log('  2. 旋律感 - 听起来是否像在"唱"？')
  console.log('  3. 节奏贴合 - 是否与节拍同步？')
  console.log('  4. 自然度 - 声音是否自然？')
  console.log('  5. 清晰度 - 歌词是否清晰可辨？')
  console.log('  6. 动态感 - 强弱变化是否明显？')
  console.log()

  console.log('快速播放命令 (macOS):')
  console.log(`  # 四川话`)
  console.log(`  afplay "${join(outputDir, 'sichuan', '00-original.mp3')}"`)
  console.log(`  afplay "${join(outputDir, 'sichuan', 'balanced.mp3')}"`)
  console.log(`  afplay "${join(outputDir, 'sichuan', 'energetic.mp3')}"`)
  console.log()
  console.log(`  # 粤语`)
  console.log(`  afplay "${join(outputDir, 'cantonese', '00-original.mp3')}"`)
  console.log(`  afplay "${join(outputDir, 'cantonese', 'balanced.mp3')}"`)
  console.log()

  console.log('对比播放:')
  console.log(`  open "${outputDir}"`)
  console.log()

  // 6. 技术诊断
  console.log('========================================')
  console.log('技术诊断')
  console.log('========================================\n')

  if (avgF0ValidRatio < 0.3) {
    console.log('⚠️  F0 有效检测率较低 (<30%)')
    console.log('   可能原因:')
    console.log('   1. 音频质量不佳')
    console.log('   2. 声音过于低沉或高频')
    console.log('   3. YIN 算法对当前音频不敏感')
    console.log('   建议: 使用更高质量的人声录音进行测试')
  } else if (avgF0ValidRatio < 0.5) {
    console.log('⚡ F0 有效检测率中等 (30-50%)')
    console.log('   音调变换效果可能有限')
  } else {
    console.log('✓ F0 有效检测率良好 (>50%)')
    console.log('  音调变换应该有明显效果')
  }
  console.log()

  // 7. 返回退出码
  const allSuccess = results.every((r) => r.success)
  process.exit(allSuccess ? 0 : 1)
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})
