/**
 * GLM-5 API 客户端封装
 * 智谱AI新一代旗舰基座模型，面向 Agentic Engineering 打造
 * 文档: https://docs.bigmodel.cn/
 *
 * 代理配置: 由 src/lib/proxy.ts 统一管理
 */

const GLM5_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
const DEFAULT_MODEL = 'glm-5'

export interface GLM5ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface GLM5ThinkingOptions {
  type: 'enabled' | 'disabled'
  budget_tokens?: number // 思考预算（可选）
}

export interface GLM5Options {
  maxTokens?: number
  temperature?: number
  model?: string
  thinking?: GLM5ThinkingOptions
  stream?: boolean
  topP?: number
  stop?: string[]
}

export interface GLM5Response {
  content: string
  reasoningContent?: string // 思考过程
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface GLM5StreamChunk {
  content?: string
  reasoningContent?: string
  isThinking: boolean
  done: boolean
}

/**
 * 调用 GLM-5 API 生成文本
 */
export async function generateWithGLM5(
  messages: GLM5ChatMessage[],
  options?: GLM5Options
): Promise<GLM5Response> {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY 环境变量未配置')
  }

  const {
    maxTokens = 4096,
    temperature = 1.0,
    model = DEFAULT_MODEL,
    thinking,
    topP,
    stop,
  } = options || {}

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  }

  // GLM-5 默认启用 thinking 模式，需要显式禁用
  // 除非用户明确启用，否则默认禁用以获得直接回复
  requestBody.thinking = thinking || { type: 'disabled' }

  if (topP !== undefined) {
    requestBody.top_p = topP
  }

  if (stop) {
    requestBody.stop = stop
  }

  const response = await fetch(`${GLM5_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GLM-5 API 调用失败: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.choices[0]?.message?.content || '',
    reasoningContent: data.choices[0]?.message?.reasoning_content,
    usage: data.usage,
  }
}

/**
 * 流式调用 GLM-5 API
 * @param onChunk 每个chunk的回调
 */
export async function streamWithGLM5(
  messages: GLM5ChatMessage[],
  onChunk: (chunk: GLM5StreamChunk) => void,
  options?: GLM5Options
): Promise<GLM5Response> {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY 环境变量未配置')
  }

  const {
    maxTokens = 4096,
    temperature = 1.0,
    model = DEFAULT_MODEL,
    thinking,
    topP,
    stop,
  } = options || {}

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
  }

  // GLM-5 默认启用 thinking 模式，需要显式禁用
  requestBody.thinking = thinking || { type: 'disabled' }

  if (topP !== undefined) {
    requestBody.top_p = topP
  }

  if (stop) {
    requestBody.stop = stop
  }

  const response = await fetch(`${GLM5_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GLM-5 API 调用失败: ${response.status} - ${errorText}`)
  }

  if (!response.body) {
    throw new Error('Response body is null')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let fullContent = ''
  let fullReasoning = ''
  let usage: GLM5Response['usage']

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onChunk({ done: true, isThinking: false })
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta
            const chunkUsage = parsed.usage

            if (chunkUsage) {
              usage = chunkUsage
            }

            if (delta) {
              // 思考内容
              if (delta.reasoning_content) {
                fullReasoning += delta.reasoning_content
                onChunk({
                  content: delta.reasoning_content,
                  reasoningContent: delta.reasoning_content,
                  isThinking: true,
                  done: false,
                })
              }

              // 正常内容
              if (delta.content) {
                fullContent += delta.content
                onChunk({
                  content: delta.content,
                  isThinking: false,
                  done: false,
                })
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return {
    content: fullContent,
    reasoningContent: fullReasoning,
    usage,
  }
}

/**
 * 简单文本生成（兼容现有代码风格）
 */
export async function generateText(prompt: string, options?: Omit<GLM5Options, 'stream'>): Promise<string> {
  const response = await generateWithGLM5(
    [{ role: 'user', content: prompt }],
    options
  )
  return response.content
}

/**
 * 带 System Prompt 的文本生成
 */
export async function generateWithSystem(
  systemPrompt: string,
  userMessage: string,
  options?: Omit<GLM5Options, 'stream'>
): Promise<GLM5Response> {
  return generateWithGLM5(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    options
  )
}

/**
 * 获取 GLM-5 客户端配置状态
 */
export function getGLM5Config() {
  return {
    baseURL: GLM5_BASE_URL,
    model: DEFAULT_MODEL,
    hasApiKey: !!process.env.ZHIPU_API_KEY,
  }
}

export default {
  generateWithGLM5,
  streamWithGLM5,
  generateText,
  generateWithSystem,
  getGLM5Config,
}
