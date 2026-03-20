/**
 * Claude API 客户端封装
 * 使用 EvoLink 国内代理访问 Claude API (OpenAI 兼容格式)
 */

const EVOLINK_BASE_URL = 'https://api.evolink.ai/v1'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/**
 * 调用 Claude API 生成文本 (通过 EvoLink OpenAI 兼容接口)
 */
export async function generateWithClaude(prompt: string, options?: {
  maxTokens?: number
  temperature?: number
  model?: string
}): Promise<string> {
  const apiKey = process.env.EVOLINK_API_KEY
  if (!apiKey) {
    throw new Error('EVOLINK_API_KEY 环境变量未配置')
  }

  const {
    maxTokens = 1024,
    temperature = 0.8,
    model = DEFAULT_MODEL
  } = options || {}

  const response = await fetch(`${EVOLINK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API 调用失败: ${response.status} - ${errorText}`)
  }

  const data: ChatCompletionResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * 获取 Claude API 客户端配置
 */
export function getClaudeConfig() {
  return {
    baseURL: EVOLINK_BASE_URL,
    model: DEFAULT_MODEL,
    hasApiKey: !!process.env.EVOLINK_API_KEY,
  }
}

export default { generateWithClaude, getClaudeConfig }
