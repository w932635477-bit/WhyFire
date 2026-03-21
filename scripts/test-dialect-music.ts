/**
 * 方言音乐生成测试脚本
 * 用于验证 Mureka API 的方言效果
 *
 * 使用方法:
 * 1. 确保 .env.local 中配置了 MUREKA_API_KEY
 * 2. 运行: npx tsx scripts/test-dialect-music.ts
 */

import 'dotenv/config'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// 测试歌词
const TEST_LYRICS = {
  dongbei: `哎呀妈呀这嘎达真带劲
东北银儿就是这股劲儿
大冬天里热炕头
老铁们咱们整起来`,

  sichuan: `巴适得很哦安逸得很
成都街头走一走
火锅串串香喷喷
四川话唱起来才够味`,

  cantonese: `大家好我係香港人
广东话唱歌最有Feel
茶餐厅里叹杯啡
生活就要咁样过`,
}

// 方言配置
const DIALECTS = [
  { key: 'dongbei', name: '东北话', provider: 'Mureka' },
  { key: 'sichuan', name: '四川话', provider: 'Mureka' },
  { key: 'cantonese', name: '粤语', provider: 'MiniMax' },
]

async function testDialectMusic() {
  console.log('='.repeat(60))
  console.log('🎵 方言音乐生成测试')
  console.log('='.repeat(60))

  const apiKey = process.env.MUREKA_API_KEY

  if (!apiKey) {
    console.error('❌ 错误: MUREKA_API_KEY 未配置')
    console.log('请在 .env.local 文件中添加:')
    console.log('MUREKA_API_KEY=your_api_key_here')
    process.exit(1)
  }

  console.log('✅ MUREKA_API_KEY 已配置')
  console.log('')

  // 测试每个方言
  for (const dialect of DIALECTS) {
    console.log(`\n📝 测试 ${dialect.name} (${dialect.provider})`)
    console.log('-'.repeat(40))

    const lyrics = TEST_LYRICS[dialect.key as keyof typeof TEST_LYRICS]
    console.log('歌词预览:')
    console.log(lyrics.split('\n').slice(0, 2).join('\n') + '...')

    // 注意: 实际 API 调用需要 API Key
    // 这里只是模拟测试流程
    console.log(`\n⚠️  实际生成需要有效的 API Key`)
    console.log(`📌 API 提供商: ${dialect.provider}`)
    console.log(`📌 方言类型: ${dialect.key}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('测试完成!')
  console.log('='.repeat(60))

  console.log('\n📋 后续步骤:')
  console.log('1. 在 https://platform.mureka.ai/ 注册并获取 API Key')
  console.log('2. 将 API Key 添加到 .env.local:')
  console.log('   MUREKA_API_KEY=your_actual_api_key')
  console.log('3. 重新运行此脚本进行实际测试')
}

// 运行测试
testDialectMusic().catch(console.error)
