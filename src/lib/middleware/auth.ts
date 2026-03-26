/**
 * API 认证中间件
 *
 * 支持两种认证方式：
 * 1. API Key (X-API-Key header)
 * 2. Bearer Token (Authorization header)
 *
 * 安全特性：
 * - 常量时间字符串比较（防止时序攻击）
 * - 请求来源验证
 * - 速率限制支持
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'

// ============================================================================
// 类型定义
// ============================================================================

export interface AuthOptions {
  /** 是否允许 API Key 认证 */
  allowApiKey?: boolean
  /** 是否允许 Bearer Token 认证 */
  allowBearer?: boolean
  /** 是否检查来源域名 */
  checkOrigin?: boolean
  /** 允许的来源域名列表 */
  allowedOrigins?: string[]
  /** 是否记录认证日志 */
  logAttempts?: boolean
}

export interface AuthResult {
  success: boolean
  error?: string
  userId?: string
  authType?: 'api-key' | 'bearer'
}

// ============================================================================
// 配置
// ============================================================================

// 有效的 API Keys（从环境变量加载）
const VALID_API_KEYS = new Set(
  (process.env.API_KEYS || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
)

// 有效的 Bearer Tokens（从环境变量加载）
const VALID_BEARER_TOKENS = new Set(
  (process.env.BEARER_TOKENS || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
)

// 默认允许的来源域名
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[]

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 常量时间字符串比较（防止时序攻击）
 */
function safeCompare(a: string, b: string): boolean {
  try {
    // 如果长度不同，填充到相同长度再比较
    const maxLen = Math.max(a.length, b.length)
    const aPadded = a.padEnd(maxLen, '\0')
    const bPadded = b.padEnd(maxLen, '\0')

    const aBuffer = Buffer.from(aPadded, 'utf8')
    const bBuffer = Buffer.from(bPadded, 'utf8')

    return timingSafeEqual(aBuffer, bBuffer)
  } catch {
    return false
  }
}

/**
 * 验证 API Key
 */
function validateApiKey(apiKey: string): boolean {
  if (!apiKey || VALID_API_KEYS.size === 0) {
    return false
  }

  for (const validKey of VALID_API_KEYS) {
    if (safeCompare(apiKey, validKey)) {
      return true
    }
  }

  return false
}

/**
 * 验证 Bearer Token
 */
function validateBearerToken(token: string): boolean {
  if (!token || VALID_BEARER_TOKENS.size === 0) {
    return false
  }

  for (const validToken of VALID_BEARER_TOKENS) {
    if (safeCompare(token, validToken)) {
      return true
    }
  }

  return false
}

/**
 * 检查请求来源
 */
function checkOrigin(
  request: NextRequest,
  allowedOrigins: string[]
): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // 如果没有 origin 和 referer，允许通过（可能是服务器端调用）
  if (!origin && !referer) {
    return true
  }

  // 检查 origin
  if (origin) {
    return allowedOrigins.some(allowed => origin.startsWith(allowed))
  }

  // 检查 referer
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = refererUrl.origin
      return allowedOrigins.some(allowed => refererOrigin.startsWith(allowed))
    } catch {
      return false
    }
  }

  return false
}

/**
 * 生成请求 ID（用于日志追踪）
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 记录认证日志
 */
function logAuthAttempt(
  request: NextRequest,
  result: AuthResult,
  requestId: string
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    success: result.success,
    authType: result.authType || 'none',
    error: result.error,
    ip: request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }

  if (result.success) {
    console.log(`[Auth] ✓ ${JSON.stringify(logData)}`)
  } else {
    console.warn(`[Auth] ✗ ${JSON.stringify(logData)}`)
  }
}

// ============================================================================
// 主认证函数
// ============================================================================

/**
 * 验证请求认证
 */
export function authenticateRequest(
  request: NextRequest,
  options: AuthOptions = {}
): AuthResult {
  const {
    allowApiKey = true,
    allowBearer = true,
    checkOrigin: shouldCheckOrigin = false,
    allowedOrigins = DEFAULT_ALLOWED_ORIGINS,
    logAttempts = true,
  } = options

  const requestId = generateRequestId()

  // 1. 检查来源（可选）
  if (shouldCheckOrigin && !checkOrigin(request, allowedOrigins)) {
    const result: AuthResult = {
      success: false,
      error: 'Origin not allowed',
    }
    if (logAttempts) logAuthAttempt(request, result, requestId)
    return result
  }

  // 2. 检查 API Key
  if (allowApiKey) {
    const apiKey = request.headers.get('x-api-key')

    if (apiKey) {
      if (validateApiKey(apiKey)) {
        const result: AuthResult = {
          success: true,
          authType: 'api-key',
          userId: 'api-user',
        }
        if (logAttempts) logAuthAttempt(request, result, requestId)
        return result
      } else {
        const result: AuthResult = {
          success: false,
          error: 'Invalid API key',
        }
        if (logAttempts) logAuthAttempt(request, result, requestId)
        return result
      }
    }
  }

  // 3. 检查 Bearer Token
  if (allowBearer) {
    const authHeader = request.headers.get('authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)

      if (validateBearerToken(token)) {
        const result: AuthResult = {
          success: true,
          authType: 'bearer',
          userId: 'bearer-user',
        }
        if (logAttempts) logAuthAttempt(request, result, requestId)
        return result
      } else {
        const result: AuthResult = {
          success: false,
          error: 'Invalid bearer token',
        }
        if (logAttempts) logAuthAttempt(request, result, requestId)
        return result
      }
    }
  }

  // 4. 没有提供认证信息
  const result: AuthResult = {
    success: false,
    error: 'Authentication required',
  }
  if (logAttempts) logAuthAttempt(request, result, requestId)
  return result
}

// ============================================================================
// 中间件包装器
// ============================================================================

/**
 * API 认证中间件包装器
 *
 * 用法示例：
 * ```typescript
 * // src/app/api/protected/route.ts
 * import { withAuth } from '@/lib/middleware/auth'
 *
 * export const POST = withAuth(async (request: NextRequest) => {
 *   // 处理已认证的请求
 *   return NextResponse.json({ message: 'Success' })
 * })
 * ```
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: AuthOptions = {}
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = authenticateRequest(request, options)

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error || 'Unauthorized',
          code: 'AUTH_FAILED',
        },
        { status: 401 }
      )
    }

    // 认证成功，调用原始处理器
    return handler(request, ...args)
  }
}

/**
 * 条件认证中间件
 *
 * 在开发环境跳过认证，生产环境强制认证
 */
export function withOptionalAuth<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: AuthOptions = {}
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // 开发环境跳过认证
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth] Skipping auth in development mode')
      return handler(request, ...args)
    }

    // 生产环境强制认证
    return withAuth(handler, options)(request, ...args)
  }
}

// ============================================================================
// 速率限制支持（可选）
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * 简单的速率限制检查
 *
 * 注意：这是内存存储，仅适用于单实例部署
 * 多实例部署应使用 Redis
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // 清理过期条目
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(identifier)
  }

  const currentEntry = rateLimitStore.get(identifier)

  if (!currentEntry) {
    // 首次请求
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    }
  }

  if (currentEntry.count >= maxRequests) {
    // 超过限制
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentEntry.resetTime,
    }
  }

  // 增加计数
  currentEntry.count++
  return {
    allowed: true,
    remaining: maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime,
  }
}

/**
 * 带速率限制的认证中间件
 */
export function withAuthAndRateLimit<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: AuthOptions & { maxRequests?: number; windowMs?: number } = {}
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  const { maxRequests = 100, windowMs = 60000, ...authOptions } = options

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // 获取客户端标识（IP 或 API Key）
    const identifier =
      request.headers.get('x-api-key') ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    // 检查速率限制
    const rateLimit = checkRateLimit(identifier, maxRequests, windowMs)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetTime),
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        }
      )
    }

    // 认证
    const authResult = authenticateRequest(request, authOptions)

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error || 'Unauthorized',
          code: 'AUTH_FAILED',
        },
        { status: 401 }
      )
    }

    // 执行处理器
    const response = await handler(request, ...args)

    // 添加速率限制头
    response.headers.set('X-RateLimit-Limit', String(maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
    response.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime))

    return response
  }
}
