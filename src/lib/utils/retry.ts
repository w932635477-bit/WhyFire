/**
 * 重试机制工具函数
 */

export interface RetryOptions {
  retries: number; // 最大重试次数
  delay: number; // 初始延迟（毫秒）
  backoff?: boolean; // 是否使用指数退避
}

/**
 * 带重试的异步函数执行器
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 函数执行结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, delay, backoff = true } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 如果还有重试机会，等待后继续
      if (attempt < retries) {
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        console.warn(
          `Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // 所有重试都失败了，抛出最后一个错误
  throw lastError;
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // 网络错误
  if (error.message.includes('ECONNRESET')) return true;
  if (error.message.includes('ETIMEDOUT')) return true;
  if (error.message.includes('ENOTFOUND')) return true;

  // HTTP 5xx 错误
  if (error.message.includes('500')) return true;
  if (error.message.includes('502')) return true;
  if (error.message.includes('503')) return true;
  if (error.message.includes('504')) return true;

  // Rate limit (429)
  if (error.message.includes('429')) return true;

  return false;
}
