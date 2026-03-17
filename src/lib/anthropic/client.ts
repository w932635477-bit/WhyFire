/**
 * Claude API 客户端
 * 使用 @anthropic-ai/sdk 封装 Claude API 调用
 */

import Anthropic from '@anthropic-ai/sdk';
import { withRetry, isRetryableError } from '../utils/retry';
import { AnalyzeError } from './types';

// 模型配置
export const MODELS = {
  SONNET: 'claude-sonnet-4-20250514', // 深度分析（竞品分析、内容诊断）
  HAIKU: 'claude-haiku-3-5-20241022', // 低成本（灵感解读）
} as const;

// Token 配置
export const MAX_TOKENS = {
  SONNET: 2000,
  HAIKU: 1024,
} as const;

// 重试配置
const DEFAULT_RETRIES = 3;
const DEFAULT_DELAY = 1000;

// 安全配置
const MAX_RESPONSE_LENGTH = 100 * 1024; // 100KB 最大响应长度
const MAX_JSON_DEPTH = 10; // 最大JSON嵌套深度

/**
 * Claude 客户端类
 */
class ClaudeClient {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    // 支持自定义 baseURL（用于国内代理如 evolink.ai）
    const baseURL = process.env.ANTHROPIC_BASE_URL || undefined;

    this.client = new Anthropic({
      apiKey,
      baseURL,
    });
  }

  /**
   * 调用 Claude API（带重试）
   */
  async call(
    model: string,
    prompt: string,
    maxTokens: number,
    retries = DEFAULT_RETRIES
  ): Promise<string> {
    return withRetry(
      async () => {
        try {
          const message = await this.client.messages.create({
            model,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }],
          });

          const content = message.content[0];

          if (content.type !== 'text') {
            throw new AnalyzeError(
              'AI returned non-text response',
              'INVALID_RESPONSE',
              false
            );
          }

          // 验证响应长度
          if (content.text.length > MAX_RESPONSE_LENGTH) {
            throw new AnalyzeError(
              `Response exceeds maximum length (${content.text.length} > ${MAX_RESPONSE_LENGTH})`,
              'RESPONSE_TOO_LARGE',
              false
            );
          }

          return content.text;
        } catch (error) {
          // 转换为 AnalyzeError
          if (error instanceof AnalyzeError) {
            throw error;
          }

          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const isRetryable = isRetryableError(error);

          throw new AnalyzeError(
            errorMessage,
            'API_ERROR',
            isRetryable
          );
        }
      },
      {
        retries,
        delay: DEFAULT_DELAY,
        backoff: true,
      }
    );
  }

  /**
   * 解析 JSON 响应（带安全验证）
   */
  parseJSON<T>(response: string): T {
    try {
      // 验证响应长度
      if (response.length > MAX_RESPONSE_LENGTH) {
        throw new AnalyzeError(
          `Response exceeds maximum length (${response.length} > ${MAX_RESPONSE_LENGTH})`,
          'RESPONSE_TOO_LARGE',
          false
        );
      }

      // 尝试提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new AnalyzeError(
          'No JSON found in response',
          'PARSE_ERROR',
          false
        );
      }

      const jsonString = jsonMatch[0];

      // 验证JSON深度（防止深度嵌套攻击）
      let depth = 0;
      let maxDepth = 0;
      for (const char of jsonString) {
        if (char === '{' || char === '[') {
          depth++;
          maxDepth = Math.max(maxDepth, depth);
        } else if (char === '}' || char === ']') {
          depth--;
        }
      }
      if (maxDepth > MAX_JSON_DEPTH) {
        throw new AnalyzeError(
          `JSON nesting too deep (${maxDepth} > ${MAX_JSON_DEPTH})`,
          'JSON_TOO_DEEP',
          false
        );
      }

      return JSON.parse(jsonString) as T;
    } catch (error) {
      if (error instanceof AnalyzeError) {
        throw error;
      }
      throw new AnalyzeError(
        'Failed to parse JSON response',
        'PARSE_ERROR',
        false
      );
    }
  }

  /**
   * 调用 Claude 并返回 JSON（带重试）
   */
  async callJSON<T>(
    model: string,
    prompt: string,
    maxTokens: number,
    retries = DEFAULT_RETRIES
  ): Promise<T> {
    const response = await this.call(model, prompt, maxTokens, retries);
    return this.parseJSON<T>(response);
  }
}

// 单例模式
let clientInstance: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!clientInstance) {
    clientInstance = new ClaudeClient();
  }
  return clientInstance;
}

// 便捷导出
export const claude = getClaudeClient();
