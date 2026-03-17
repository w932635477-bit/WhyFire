/**
 * API 速率限制中间件
 * 防止 API 滥用和资源耗尽
 */

import { NextRequest, NextResponse } from 'next/server';

// 速率限制配置
export const RATE_LIMIT_CONFIG = {
  // 每个IP在时间窗口内最大请求数
  MAX_REQUESTS: 10,
  // 时间窗口（毫秒）
  WINDOW_MS: 60 * 1000, // 1分钟
  // 白名单路径（不受限制）
  WHITELIST_PATHS: ['/_next', '/favicon.ico', '/api/health'],
} as const;

// 内存存储（MVP阶段使用，生产环境应使用Redis）
interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * 获取客户端标识符
 * 优先使用 X-Forwarded-For（反向代理），否则使用 IP
 */
function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // 取第一个IP（原始客户端）
    return forwardedFor.split(',')[0].trim();
  }
  // Next.js 15 获取IP的方式
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * 检查路径是否在白名单中
 */
function isWhitelisted(pathname: string): boolean {
  return RATE_LIMIT_CONFIG.WHITELIST_PATHS.some(path => pathname.startsWith(path));
}

/**
 * 清理过期的限制记录
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 速率限制检查结果
 */
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * 检查速率限制
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  cleanupExpiredRecords();

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // 创建新记录
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS,
    });
    return {
      success: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS,
    };
  }

  if (record.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS) {
    // 超出限制
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  // 增加计数
  record.count++;
  return {
    success: true,
    remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * 速率限制响应
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: '请求过于频繁，请稍后再试',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.MAX_REQUESTS),
        'X-RateLimit-Reset': String(Date.now() + retryAfter * 1000),
      },
    }
  );
}

/**
 * API 路由速率限制中间件
 * 在API路由开头调用
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimit = applyRateLimit(request);
 *   if (rateLimit) return rateLimit; // 返回429响应
 *   // ... 正常处理逻辑
 * }
 * ```
 */
export function applyRateLimit(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  // 白名单路径不受限制
  if (isWhitelisted(pathname)) {
    return null;
  }

  const identifier = getClientIdentifier(request);
  const result = checkRateLimit(identifier);

  if (!result.success && result.retryAfter) {
    return rateLimitResponse(result.retryAfter);
  }

  return null;
}

/**
 * 带速率限制的API处理器包装器
 *
 * @example
 * ```typescript
 * export const POST = withRateLimit(async (request: NextRequest) => {
 *   // ... 处理逻辑
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}

/**
 * 不同API端点的自定义限制配置
 */
export const ENDPOINT_LIMITS = {
  // 抓取API - 更严格限制（消耗资源多）
  scrape: { maxRequests: 5, windowMs: 60 * 1000 },
  // 分析API - 中等限制（消耗AI配额）
  analyze: { maxRequests: 10, windowMs: 60 * 1000 },
  // 搜索API - 宽松限制
  search: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;

/**
 * 带自定义限制的速率检查
 */
export function checkRateLimitForEndpoint(
  identifier: string,
  endpoint: keyof typeof ENDPOINT_LIMITS
): RateLimitResult {
  const config = ENDPOINT_LIMITS[endpoint];
  // 使用端点特定配置创建临时存储key
  const storeKey = `${identifier}:${endpoint}`;

  const now = Date.now();
  const record = rateLimitStore.get(storeKey);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(storeKey, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count++;
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}
