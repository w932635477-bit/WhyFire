/**
 * Claude API 客户端封装
 * 用于生成 Rap 歌词
 */

import Anthropic from '@anthropic-ai/sdk'

// Claude 客户端单例
let anthropicClient: Anthropic | null = null

/**
 * 获取 Claude API 客户端
 */
export function getClaudeClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 环境变量未配置')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

/**
 * 调用 Claude API 生成文本
 */
export async function generateWithClaude(prompt: string, options?: {
  maxTokens?: number
  temperature?: number
  model?: string
}): Promise<string> {
  const client = getClaudeClient()

  const {
    maxTokens = 1024,
    temperature = 0.8,
    model = 'claude-sonnet-4-20250514'
  } = options || {}

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Claude 返回了非文本内容')
  }

  return content.text
}

/**
 * 默认导出客户端
 */
export default getClaudeClient
