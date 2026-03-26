/**
 * GLM-5 客户端测试脚本
 * 运行: npx tsx scripts/test-glm5.ts
 */

import 'dotenv/config'
import {
  generateWithGLM5,
  streamWithGLM5,
  generateText,
  generateWithSystem,
  getGLM5Config,
} from '../src/lib/ai/glm5-client'

async function main() {
  console.log('=== GLM-5 客户端测试 ===\n')

  // 检查配置
  const config = getGLM5Config()
  console.log('配置状态:', config)
  console.log('')

  if (!config.hasApiKey) {
    console.error('❌ 错误: ZHIPU_API_KEY 环境变量未配置')
    console.log('请在 .env 文件中设置: ZHIPU_API_KEY=your_api_key')
    process.exit(1)
  }

  try {
    // 测试1: 基础调用
    console.log('📝 测试1: 基础调用')
    const response1 = await generateWithGLM5(
      [{ role: 'user', content: '用一句话介绍你自己' }],
      { maxTokens: 100 }
    )
    console.log('回复:', response1.content)
    console.log('')

    // 测试2: 带 System Prompt
    console.log('📝 测试2: 带 System Prompt')
    const response2 = await generateWithSystem(
      '你是一个说唱歌手，说话要押韵',
      '介绍一下北京',
      { maxTokens: 200 }
    )
    console.log('回复:', response2.content)
    console.log('')

    // 测试3: Thinking 模式 (GLM-5 特色)
    console.log('📝 测试3: Thinking 模式')
    const response3 = await generateWithGLM5(
      [{ role: 'user', content: '解释一下什么是 Agent，用简单的语言' }],
      {
        maxTokens: 500,
        thinking: { type: 'enabled' },
      }
    )
    if (response3.reasoningContent) {
      console.log('💭 思考过程:')
      console.log(response3.reasoningContent.substring(0, 200) + '...')
    }
    console.log('📝 回复:', response3.content)
    console.log('')

    // 测试4: 流式输出
    console.log('📝 测试4: 流式输出')
    process.stdout.write('回复: ')
    await streamWithGLM5(
      [{ role: 'user', content: '给我讲一个关于编程的短笑话' }],
      (chunk) => {
        if (chunk.content) {
          // 思考内容用灰色显示
          if (chunk.isThinking) {
            process.stdout.write(`\x1b[90m${chunk.content}\x1b[0m`)
          } else {
            process.stdout.write(chunk.content)
          }
        }
        if (chunk.done) {
          process.stdout.write('\n')
        }
      },
      { maxTokens: 200 }
    )
    console.log('')

    // 测试5: 简单文本生成
    console.log('📝 测试5: 简单文本生成')
    const response5 = await generateText('说出三个水果的名称', { maxTokens: 50 })
    console.log('回复:', response5)
    console.log('')

    console.log('✅ 所有测试完成!')
  } catch (error) {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

main()
