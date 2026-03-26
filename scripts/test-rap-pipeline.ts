/**
 * 方言 Rap 生成测试脚本
 * 用于验证 8 种方言的生成效果
 *
 * 使用方法:
 * npx tsx scripts/test-rap-pipeline.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载 .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { generateDialectSpeech, getDialectSupportInfo } from '../src/lib/tts'
import type { DialectCode } from '../src/types/dialect'
import { getFFmpegProcessor } from '../src/lib/audio/ffmpeg-processor'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// ============================================================================
// 配置
// ============================================================================

const OUTPUT_DIR = join(process.cwd(), 'test-output', 'dialect-rap')

const DIALECTS: { code: DialectCode; name: string; sampleText: string }[] = [
  { code: 'mandarin', name: '普通话', sampleText: '今天天气真好，阳光明媚，微风轻拂，心情特别舒畅。' },
  { code: 'cantonese', name: '粤语', sampleText: '今日天气好好，阳光普照，微风阵阵，心情特别舒畅。' },
  { code: 'sichuan', name: '四川话', sampleText: '今天天气巴适得很，太阳晒起好安逸，心情硬是舒畅。' },
  { code: 'dongbei', name: '东北话', sampleText: '今天天气贼拉好，阳光明媚，心情老带劲了。' },
  { code: 'shandong', name: '山东话', sampleText: '今天天气真好，大日头晒得暖洋洋的，心里特别舒坦。' },
  { code: 'wu', name: '上海话', sampleText: '今朝天气老好额，阳光明媚，心情特别舒畅。' },
  { code: 'henan', name: '河南话', sampleText: '今儿个天气可好，日头晒得暖烘烘的，心里可得劲。' },
  { code: 'xiang', name: '湖南话', sampleText: '今天天气蛮好咯，阳光蛮亮堂，心情特别舒畅。' },
]

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('方言 Rap 生成测试')
  console.log('='.repeat(60))

  // 检查环境
  if (!process.env.DASHSCOPE_API_KEY) {
    console.error('❌ 错误: 未设置 DASHSCOPE_API_KEY 环境变量')
    console.log('\n请在 .env.local 文件中添加:')
    console.log('DASHSCOPE_API_KEY=your_api_key')
    process.exit(1)
  }

  // 创建输出目录
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  console.log(`\n📁 输出目录: ${OUTPUT_DIR}`)

  // 初始化 FFmpeg 处理器
  const ffmpegProcessor = getFFmpegProcessor()

  // 检查 FFmpeg
  const ffmpegStatus = await ffmpegProcessor.checkAvailability()
  if (!ffmpegStatus.available) {
    console.error('❌ FFmpeg 不可用:', ffmpegStatus.error)
    process.exit(1)
  }
  console.log(`✅ FFmpeg 版本: ${ffmpegStatus.version}`)

  // 测试每种方言
  const results: { dialect: string; provider: string; status: string; duration?: number; error?: string }[] = []

  for (const dialect of DIALECTS) {
    console.log(`\n${'─'.repeat(40)}`)
    console.log(`🎤 测试方言: ${dialect.name} (${dialect.code})`)
    console.log(`📝 文本: ${dialect.sampleText}`)

    // 显示方言支持信息
    const supportInfo = getDialectSupportInfo(dialect.code)
    console.log(`📊 提供商: ${supportInfo.provider}, 质量: ${supportInfo.quality}`)
    console.log(`📋 ${supportInfo.notes}`)

    try {
      const startTime = Date.now()

      // Step 1: TTS Router 自动选择最佳提供商
      console.log('  Step 1: 生成方言语音...')
      const ttsResult = await generateDialectSpeech({
        text: dialect.sampleText,
        dialect: dialect.code,
        format: 'mp3',
        sampleRate: 24000,
      })
      console.log(`  ✅ TTS 完成，提供商: ${ttsResult.provider}，原始时长: ${ttsResult.duration}秒`)

      // Step 2: FFmpeg 时间拉伸测试
      console.log('  Step 2: 测试时间拉伸...')
      const stretchResult = await ffmpegProcessor.timeStretch(ttsResult.audioBuffer, 1.1)
      console.log(`  ✅ 拉伸完成，新时长: ${stretchResult.processedDuration.toFixed(2)}秒`)

      // Step 3: 保存音频
      const outputPath = join(OUTPUT_DIR, `${dialect.code}-test.mp3`)
      writeFileSync(outputPath, stretchResult.audioBuffer)
      console.log(`  💾 已保存: ${outputPath}`)

      const elapsed = Date.now() - startTime
      console.log(`  ⏱️  总耗时: ${(elapsed / 1000).toFixed(1)}秒`)

      results.push({
        dialect: dialect.name,
        provider: ttsResult.provider,
        status: '✅ 成功',
        duration: stretchResult.processedDuration,
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`  ❌ 失败: ${errorMsg}`)

      results.push({
        dialect: dialect.name,
        provider: supportInfo.provider,
        status: '❌ 失败',
        error: errorMsg,
      })
    }
  }

  // 打印结果汇总
  console.log('\n' + '='.repeat(60))
  console.log('测试结果汇总')
  console.log('='.repeat(60))

  console.log('\n| 方言 | 提供商 | 状态 | 时长 |')
  console.log('|------|--------|------|------|')
  for (const result of results) {
    const duration = result.duration ? `${result.duration.toFixed(2)}秒` : '-'
    console.log(`| ${result.dialect} | ${result.provider} | ${result.status} | ${duration} |`)
  }

  const successCount = results.filter(r => r.status === '✅ 成功').length
  console.log(`\n总计: ${successCount}/${results.length} 成功`)

  console.log(`\n📁 音频文件保存在: ${OUTPUT_DIR}`)
  console.log('🎧 请人工播放检查音质和方言效果')
}

// 运行
main().catch(console.error)
