# AI 分析模块 - 快速开始指南

## 1. 环境配置

确保 `.env.local` 中有 Claude API Key:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## 2. 基本使用

### Step 1: 竞品分析

```typescript
// app/api/wizard/competitor/route.ts
import { analyzeCompetitor, XhsNoteData } from '@/lib/anthropic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { noteUrl } = await request.json();

  // 1. 抓取小红书数据（需要实现）
  const noteData: XhsNoteData = await scrapeXiaohongshuNote(noteUrl);

  // 2. AI 分析
  const result = await analyzeCompetitor(noteData);

  // 3. 返回结果
  return NextResponse.json({ success: true, data: result });
}
```

### Step 2: 内容诊断

```typescript
// app/api/wizard/diagnose/route.ts
import { diagnoseContent, XhsNoteData, CompetitorAnalysisResult } from '@/lib/anthropic';

export async function POST(request: NextRequest) {
  const { userNoteUrl, competitorData } = await request.json();

  // 1. 抓取用户笔记数据
  const userNoteData: XhsNoteData = await scrapeXiaohongshuNote(userNoteUrl);

  // 2. AI 诊断（需要竞品分析结果）
  const result = await diagnoseContent(userNoteData, competitorData);

  return NextResponse.json({ success: true, data: result });
}
```

### Step 4: 灵感解读

```typescript
// app/api/wizard/inspiration/route.ts
import { analyzeInspirationBatch, OverseasVideo, DiagnosisResult } from '@/lib/anthropic';

export async function POST(request: NextRequest) {
  const { videos, diagnosisContext } = await request.json();

  // 批量分析 6-10 个视频
  const results = await analyzeInspirationBatch(
    videos as OverseasVideo[],
    diagnosisContext as DiagnosisResult
  );

  return NextResponse.json({ success: true, data: results });
}
```

## 3. 完整流程示例

```typescript
// app/actions/wizard.ts
'use server';

import {
  analyzeCompetitor,
  diagnoseContent,
  analyzeInspirationBatch,
  XhsNoteData,
  OverseasVideo,
} from '@/lib/anthropic';

export async function runWizardAnalysis(
  competitorUrl: string,
  userUrl: string,
  overseasVideos: OverseasVideo[]
) {
  // Step 1: 竞品分析
  const competitorData = await scrapeXiaohongshuNote(competitorUrl);
  const competitorResult = await analyzeCompetitor(competitorData);

  // Step 2: 内容诊断
  const userData = await scrapeXiaohongshuNote(userUrl);
  const diagnosisResult = await diagnoseContent(userData, competitorResult);

  // Step 4: 灵感推荐
  const inspirations = await analyzeInspirationBatch(
    overseasVideos,
    diagnosisResult
  );

  return {
    competitor: competitorResult,
    diagnosis: diagnosisResult,
    inspirations,
  };
}

// 辅助函数（需要实现）
async function scrapeXiaohongshuNote(url: string): Promise<XhsNoteData> {
  // TODO: 实现 Playwright 抓取
  throw new Error('Not implemented');
}
```

## 4. 错误处理

```typescript
import { analyzeCompetitor, AnalyzeError } from '@/lib/anthropic';

try {
  const result = await analyzeCompetitor(noteData);
  return { success: true, data: result };
} catch (error) {
  if (error instanceof AnalyzeError) {
    // 已知的分析错误
    console.error('分析错误:', error.code, error.message);

    if (error.retryable) {
      // 可重试的错误（网络、5xx、429）
      return { success: false, error: '服务暂时不可用，请稍后重试' };
    } else {
      // 不可重试的错误（解析错误、验证错误）
      return { success: false, error: '分析失败，请检查输入数据' };
    }
  }

  // 未知错误
  console.error('Unknown error:', error);
  return { success: false, error: '系统错误' };
}
```

## 5. 自定义配置

```typescript
// 自定义重试次数和延迟
const result = await analyzeCompetitor(noteData, {
  retries: 5,      // 最多重试 5 次
  delay: 2000,     // 初始延迟 2 秒
  backoff: true,   // 使用指数退避
});
```

## 6. 性能优化建议

### 使用缓存

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function analyzeCompetitorWithCache(noteData: XhsNoteData) {
  const cacheKey = `analysis:${noteData.noteId}`;

  // 检查缓存
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 执行分析
  const result = await analyzeCompetitor(noteData);

  // 缓存结果（1小时）
  await redis.setex(cacheKey, 3600, JSON.stringify(result));

  return result;
}
```

### 并发控制

```typescript
import { analyzeInspiration } from '@/lib/anthropic';

// 并行分析（使用内置的 analyzeInspirationBatch）
const results = await analyzeInspirationBatch(videos, diagnosisContext);

// 或手动控制并发数
import pLimit from 'p-limit';

const limit = pLimit(3); // 最多同时 3 个请求

const results = await Promise.all(
  videos.map(video =>
    limit(() => analyzeInspiration(video, diagnosisContext))
  )
);
```

## 7. 测试

```bash
# 设置测试 API Key
export ANTHROPIC_API_KEY=sk-ant-your-key

# 运行测试
npx ts-node src/lib/anthropic/test.ts
```

## 8. 常见问题

### Q: API 调用很慢怎么办？
A:
- Claude API 响应时间通常在 2-5 秒
- 前端需要显示 loading 状态
- 可以使用流式响应（需要额外实现）

### Q: 如何减少 API 成本？
A:
- 使用缓存避免重复分析
- 灵感解读使用 Haiku（成本最低）
- 只在必要时使用 Sonnet

### Q: 如何处理 Rate Limit？
A:
- 模块内置了重试机制
- 使用 Redis 实现用户级别的速率限制
- 参考 `lib/utils/rate-limit.ts`

### Q: 可以使用其他 AI 模型吗？
A:
- 可以修改 `client.ts` 中的 `MODELS` 配置
- 需要调整 Prompt 以适应不同模型的特性
- 建议保持 Sonnet/Haiku 的分级策略

## 9. 下一步

1. 实现小红书数据抓取（Playwright）
2. 创建 API Routes（`app/api/wizard/*/route.ts`）
3. 实现前端界面
4. 添加缓存机制
5. 实现用户会话管理

## 10. 参考资源

- [Claude API 文档](https://docs.anthropic.com)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [技术架构文档](../../docs/plans/2026-03-16-technical-architecture.md)
- [用户流程文档](../../docs/USER_FLOW.md)
