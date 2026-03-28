/**
 * Modal Serverless GPU 客户端
 *
 * 用于调用 Modal 平台上的 GPU 函数
 * 文档: https://modal.com/docs
 *
 * 调用方式：
 * - Modal 使用 Web Endpoints 暴露 HTTP API
 * - 通过 @modal.fastapi_endpoint() 或 @modal.web_endpoint() 装饰器创建
 * - 外部通过完整的 Web Endpoint URL 调用
 */

/**
 * Modal API 配置
 */
interface ModalConfig {
  /** Web Endpoint 基础 URL (例如: https://xxx--seed-vc-convert.modal.run) */
  baseUrl: string
  /** API Token (可选，用于认证) */
  apiToken?: string
  /** 默认超时时间（毫秒） */
  timeout: number
  /** 最大重试次数 */
  maxRetries: number
  /** 重试延迟（毫秒） */
  retryDelay: number
}

/**
 * Modal 函数调用参数
 */
export interface ModalInvokeOptions {
  /** 函数名称 (用于日志) */
  functionName: string
  /** 函数参数 */
  args: Record<string, unknown>
  /** 超时时间（毫秒），默认 3 分钟 */
  timeout?: number
}

/**
 * Modal 任务状态
 */
export interface ModalTaskStatus {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: unknown
  error?: string
}

/**
 * Modal Serverless GPU 客户端
 */
export class ModalClient {
  private config: ModalConfig

  constructor() {
    this.config = {
      baseUrl: process.env.MODAL_WEB_ENDPOINT_URL || '',
      apiToken: process.env.MODAL_API_TOKEN || undefined,
      timeout: 180000, // 3 分钟
      maxRetries: 3, // 最大重试 3 次
      retryDelay: 1000, // 重试延迟 1 秒
    }
  }

  /**
   * 调用 Modal Web Endpoint（带重试机制）
   *
   * @param options 调用选项
   * @returns 函数返回结果
   */
  async invoke(options: ModalInvokeOptions): Promise<unknown> {
    const { functionName, args, timeout } = options

    if (!this.isConfigured()) {
      throw new Error('Modal client not configured. Please set MODAL_WEB_ENDPOINT_URL.')
    }

    // 构建完整的 Web Endpoint URL
    const url = `${this.config.baseUrl}/${functionName}`

    console.log(`[Modal] Invoking function: ${functionName}`)

    let lastError: Error | null = null

    // 重试循环
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiToken ? { 'Authorization': `Bearer ${this.config.apiToken}` } : {}),
          },
          body: JSON.stringify(args),
          signal: AbortSignal.timeout(timeout || this.config.timeout),
        })

        if (!response.ok) {
          const errorText = await response.text()

          // 5xx 错误重试，4xx 错误不重试
          if (response.status >= 500 && attempt < this.config.maxRetries) {
            console.warn(`[Modal] Attempt ${attempt} failed with ${response.status}, retrying...`)
            await this.delay(this.config.retryDelay * attempt) // 指数退避
            continue
          }

          throw new Error(`Modal API error: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        console.log(`[Modal] Function ${functionName} completed (attempt ${attempt})`)

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // 网络错误或超时重试
        const isNetworkError =
          lastError.message.includes('fetch') ||
          lastError.message.includes('network') ||
          lastError.message.includes('timeout') ||
          lastError.message.includes('ECONNREFUSED') ||
          lastError.message.includes('ETIMEDOUT')

        if (isNetworkError && attempt < this.config.maxRetries) {
          console.warn(`[Modal] Network error on attempt ${attempt}, retrying...`)
          await this.delay(this.config.retryDelay * attempt) // 指数退避
          continue
        }

        console.error(`[Modal] Function ${functionName} failed after ${attempt} attempts:`, error)
        throw error
      }
    }

    throw lastError || new Error('Modal invoke failed after all retries')
  }

  /**
   * 异步调用 Modal 函数（返回任务 ID）
   *
   * @param options 调用选项
   * @returns 任务 ID
   */
  async invokeAsync(options: ModalInvokeOptions): Promise<string> {
    const { functionName, args } = options

    if (!this.isConfigured()) {
      throw new Error('Modal client not configured. Please set MODAL_WEB_ENDPOINT_URL.')
    }

    const url = `${this.config.baseUrl}/${functionName}/async`

    console.log(`[Modal] Invoking function async: ${functionName}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiToken ? { 'Authorization': `Bearer ${this.config.apiToken}` } : {}),
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(30000), // 30 秒超时用于提交任务
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Modal API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    return result.taskId
  }

  /**
   * 获取任务状态
   *
   * @param taskId 任务 ID
   * @returns 任务状态
   */
  async getStatus(taskId: string): Promise<ModalTaskStatus> {
    if (!this.isConfigured()) {
      throw new Error('Modal client not configured.')
    }

    const url = `${this.config.baseUrl}/status/${taskId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(this.config.apiToken ? { 'Authorization': `Bearer ${this.config.apiToken}` } : {}),
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`Modal API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 轮询等待任务完成
   *
   * @param taskId 任务 ID
   * @param maxAttempts 最大尝试次数
   * @param delayMs 每次尝试间隔（毫秒）
   * @returns 任务结果
   */
  async pollForResult(
    taskId: string,
    maxAttempts: number = 60,
    delayMs: number = 3000
  ): Promise<ModalTaskStatus> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getStatus(taskId)

      if (status.status === 'completed') {
        return status
      }

      if (status.status === 'failed') {
        throw new Error(`Modal task failed: ${status.error}`)
      }

      // 等待后重试
      await this.delay(delayMs)
    }

    throw new Error(`Modal task timeout after ${maxAttempts} attempts`)
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!this.config.baseUrl
  }

  /**
   * 获取配置信息（不包含敏感信息）
   */
  getConfig(): { configured: boolean; baseUrl: string } {
    return {
      configured: this.isConfigured(),
      baseUrl: this.config.baseUrl ? '(configured)' : '(not configured)',
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let modalClientInstance: ModalClient | null = null

/**
 * 获取 Modal 客户端实例
 */
export function getModalClient(): ModalClient {
  if (!modalClientInstance) {
    modalClientInstance = new ModalClient()
  }
  return modalClientInstance
}
