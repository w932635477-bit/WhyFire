/**
 * Suno API 测试脚本
 * 运行: npx tsx scripts/test-suno.ts
 *
 * 确保 .env.local 文件中有 SUNO_API_KEY
 */

// 手动加载 .env.local
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { getSunoClient } from '../src/lib/music/suno-client'

async function testSuno() {
  console.log('=== Suno API 测试 ===\n')

  const client = getSunoClient()

  // 检查配置
  if (!client.isConfigured()) {
    console.error('❌ SUNO_API_KEY 未配置')
    return
  }

  console.log('✅ SUNO_API_KEY 已配置')

  // 测试四川话 Rap
  console.log('\n📝 测试生成一段四川话 Rap...\n')

  try {
    const result = await client.generate({
      lyrics: `[Verse 1]
今天天气巴适得很
出来耍一耍心情嫩个好
看嘛这天蓝得很安逸
兄弟伙些一起搞起来

[Chorus]
四川人的热情像火锅
大口吃肉大口喝酒嘛
麻婆豆腐回锅肉好香
这种日子硬是安逸得很

[Bridge]
巴适得板 巴适得板
四川话说出来
雄起 雄起
快乐就是这样来`,
      dialect: 'sichuan',
      style: 'rap',
      title: '四川Rap测试',
    })

    console.log('✅ 生成成功!')
    console.log('Task ID:', result.taskId)
    console.log('Audio URL:', result.audioUrl)
    console.log('Duration:', result.duration, 's')
    console.log('Title:', result.title)
    console.log('Style:', result.style)

    if (result.audioUrl) {
      console.log('\n🎵 音频链接 (72小时内有效):')
      console.log(result.audioUrl)
    }
  } catch (error) {
    console.error('❌ 生成失败:', error)
  }
}

testSuno().catch(console.error)
