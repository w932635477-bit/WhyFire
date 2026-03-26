/**
 * AI 模型路由器
 * 统一管理多个 LLM 提供商的调用
 */

import { generateWithGLM5, streamWithGLM5, type GLM5ChatMessage, type GLM5Options, type GLM5Response, type GLM5StreamChunk } from './glm5-client'

export type AIProvider = 'glm5' | 'claude'

export interface AIRouterOptions {
  provider?: AIProvider
  maxTokens?: number
  temperature?: number
  thinking?: { type: 'enabled' | 'disabled' }
}

/**
 * 获取可用的 AI 提供商
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = []

  if (process.env.ZHIPU_API_KEY) {
    providers.push('glm5')
  }

  if (process.env.EVOLINK_API_KEY) {
    providers.push('claude')
  }

  return providers
}

/**
 * 获取默认提供商
 */
export function getDefaultProvider(): AIProvider {
  const providers = getAvailableProviders()

  // 优先使用 GLM-5
  if (providers.includes('glm5')) {
    return 'glm5'
  }

  if (providers.includes('claude')) {
    return 'claude'
  }

  throw new Error('没有可用的 AI 提供商，请配置 ZHIPU_API_KEY 或 EVOLINK_API_KEY')
}

/**
 * 统一的聊天接口
 */
export async function chat(
  messages: GLM5ChatMessage[],
  options?: AIRouterOptions
): Promise<GLM5Response> {
  const provider = options?.provider || getDefaultProvider()

  switch (provider) {
    case 'glm5':
      return generateWithGLM5(messages, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        thinking: options?.thinking,
      })

    case 'claude':
      // Claude 通过 EvoLink (OpenAI 兼容格式)
      const { generateWithClaude } = await import('./claude-client')
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n')
      const content = await generateWithClaude(prompt, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      })
      return { content }

    default:
      throw new Error(`不支持的 AI 提供商: ${provider}`)
  }
}

/**
 * 统一的流式聊天接口
 */
export async function streamChat(
  messages: GLM5ChatMessage[],
  onChunk: (chunk: GLM5StreamChunk) => void,
  options?: AIRouterOptions
): Promise<GLM5Response> {
  const provider = options?.provider || getDefaultProvider()

  switch (provider) {
    case 'glm5':
      return streamWithGLM5(messages, onChunk, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        thinking: options?.thinking,
      })

    case 'claude':
      // Claude 暂不支持流式（EvoLink 代理限制）
      const { generateWithClaude } = await import('./claude-client')
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n')
      const content = await generateWithClaude(prompt, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      })
      // 模拟流式输出
      onChunk({ content, isThinking: false, done: false })
      onChunk({ done: true, isThinking: false })
      return { content }

    default:
      throw new Error(`不支持的 AI 提供商: ${provider}`)
  }
}

/**
 * 简单文本生成
 */
export async function generateText(
  prompt: string,
  options?: AIRouterOptions
): Promise<string> {
  const response = await chat([{ role: 'user', content: prompt }], options)
  return response.content
}

export {
  generateWithGLM5,
  streamWithGLM5,
  generateText as generateGLM5Text,
  generateWithSystem as generateGLM5WithSystem,
  getGLM5Config,
} from './glm5-client'

export { generateWithClaude, getClaudeConfig } from './claude-client'
