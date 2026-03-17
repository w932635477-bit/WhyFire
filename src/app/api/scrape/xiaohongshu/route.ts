/**
 * 小红书笔记抓取 API
 *
 * POST /api/scrape/xiaohongshu
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, ENDPOINT_LIMITS, checkRateLimitForEndpoint, rateLimitResponse } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  // 应用速率限制
  const rateLimit = applyRateLimit(request);
  if (rateLimit) return rateLimit;

  // TODO: 实现小红书抓取逻辑
  // 需要安装 playwright: npm install playwright
  return NextResponse.json({
    success: false,
    error: 'Playwright not installed. Please run: npm install playwright',
  }, { status: 503 });
}

export async function GET(request: NextRequest) {
  // 健康检查端点不受速率限制
  return NextResponse.json({
    service: 'xiaohongshu-scraper',
    status: 'disabled',
    message: 'Playwright not installed',
  });
}
