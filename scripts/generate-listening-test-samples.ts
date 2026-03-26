/**
 * 听感测试样本生成脚本
 *
 * 用于生成 Rap 增强前后的对比音频，供人工听感测试使用
 *
 * 运行方式：
 *   bun run scripts/generate-listening-test-samples.ts
 */

import { readFile, writeFile, mkdir, rm } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

// 导入 RapEnhancer
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const libPath = join(projectRoot, 'src', 'lib', 'audio')

async function main() {
  console.log('========================================')
  console.log('Rap 增强系统 - 听感测试样本生成')
  console.log('========================================\n')

  const outputDir = join(projectRoot, 'test-output', 'listening-test')
  const tempDir = join(projectRoot, 'test-output', 'temp')

  // 创建输出目录
  await mkdir(outputDir, { recursive: true })
  await mkdir(tempDir, { recursive: true })

  // 动态导入 RapEnhancer
  const { RapEnhancer, RAP_PRESETS } = await import(join(libPath, 'rap-enhancer.ts'))

  // 测试音频路径（使用现有的测试音频）
  const testAudioPath = join(projectRoot, 'test-voice-audio.mp3')

  if (!existsSync(testAudioPath)) {
    console.log('✗ 测试音频不存在，正在生成...')
    await execAsync(
      `ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" -ar 44100 -ac 1 -c:a libmp3lame -q:a 2 "${testAudioPath}"`,
      { timeout: 30000 }
    )
  }

  console.log(`✓ 使用测试音频: ${testAudioPath}\n`)

  // 读取测试音频
  const originalAudio = await readFile(testAudioPath)
  console.log(`  原始音频大小: ${(originalAudio.length / 1024).toFixed(1)} KB\n`)

  // 创建增强器
  const enhancer = new RapEnhancer({ debug: false })

  // 预设列表
  const presets = ['subtle', 'balanced', 'energetic', 'aggressive', 'melodic'] as const

  console.log('--- 生成增强音频样本 ---\n')

  // 保存原始音频
  await writeFile(join(outputDir, '00-original.mp3'), originalAudio)
  console.log('✓ 00-original.mp3 (原始音频)')

  // 为每个预设生成增强音频
  for (const preset of presets) {
    const presetConfig = RAP_PRESETS[preset]
    console.log(`\n处理预设: ${preset}`)
    console.log(`  配置: semitoneShift=${presetConfig.pitch?.semitoneShift}, dynamicRange=${presetConfig.pitch?.dynamicRange}`)

    try {
      const result = await enhancer.enhance(originalAudio, {
        ...presetConfig,
        debug: false,
      })

      if (result.success && result.audioBuffer) {
        const outputPath = join(outputDir, `${preset}.mp3`)
        await writeFile(outputPath, result.audioBuffer)
        console.log(`  ✓ 生成: ${preset}.mp3`)
        console.log(`    处理时间: ${result.duration}ms`)
        if (result.details?.f0) {
          console.log(`    F0 有效比例: ${(result.details.f0.validRatio * 100).toFixed(1)}%`)
        }
      } else {
        console.log(`  ✗ 失败: ${result.error}`)
      }
    } catch (error) {
      console.log(`  ✗ 异常: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 生成对比报告
  console.log('\n========================================')
  console.log('样本生成完成')
  console.log('========================================\n')

  console.log('输出文件:')
  console.log(`  ${outputDir}/`)
  console.log(`  ├── 00-original.mp3      # 原始音频`)
  for (const preset of presets) {
    console.log(`  ├── ${preset}.mp3           # ${preset} 预设`)
  }
  console.log()

  console.log('快速播放命令 (macOS):')
  console.log(`  afplay "${join(outputDir, '00-original.mp3')}"`)
  console.log(`  afplay "${join(outputDir, 'balanced.mp3')}"`)
  console.log(`  afplay "${join(outputDir, 'energetic.mp3')}"`)
  console.log()

  console.log('评估维度:')
  console.log('  1. 音调变化 - 是否有明显的音调起伏？')
  console.log('  2. 旋律感 - 听起来是否像在"唱"？')
  console.log('  3. 节奏贴合 - 是否与 BGM 节拍同步？')
  console.log('  4. 自然度 - 声音是否自然？')
  console.log('  5. 清晰度 - 歌词是否清晰可辨？')
  console.log('  6. 动态感 - 强弱变化是否明显？')
  console.log()

  console.log('评分标准: 1-5 分 (1=很差, 3=一般, 5=很好)')
  console.log()

  // 清理临时目录
  try {
    await rm(tempDir, { recursive: true, force: true })
  } catch {
    // 忽略
  }
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})
