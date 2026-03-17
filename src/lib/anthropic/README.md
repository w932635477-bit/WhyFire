# AI 分析模块

WhyFire 的核心 AI 分析功能,使用 Claude API 实现竞品分析、内容诊断和灵感解读。

## 功能特性

- **竞品分析** (Step 1): 使用 Claude Sonnet 深度分析爆款笔记的成功要素
- **内容诊断** (Step 2): 使用 Claude Sonnet 对比分析用户内容与竞品的差距
- **灵感解读** (Step 4): 使用 Claude Haiku 分析海外爆款并给出本土化建议

## 模型选择

| 功能 | 模型 | 原因 | Token 限制 |
|------|------|------|-----------|
| 竞品分析 | Claude Sonnet 4 | 需要深度分析 | 2000 |
| 内容诊断 | Claude Sonnet 4 | 需要深度分析 | 2000 |
| 灵感解读 | Claude Haiku 3.5 | 成本敏感 | 1024 |

## 目录结构

```
src/lib/anthropic/
├── index.ts              # 主入口,导出所有功能
├── types.ts              # 类型定义
├── client.ts             # Claude API 客户端
├── analyze.ts            # 主分析函数
├── prompts/              # Prompt 构建
│   ├── competitor.ts     # 竞品分析 Prompt
│   ├── diagnose.ts       # 内容诊断 Prompt
│   └── inspiration.ts    # 灵感解读 Prompt
├── examples.ts           # 使用示例
├── test.ts               # 测试脚本
└── README.md             # 本文档
```

## 快速开始

### 1. 配置环境变量

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 2. 基础使用

```typescript
import {
  analyzeCompetitor,
  diagnoseContent,
  analyzeInspiration,
} from '@/lib/anthropic';

// 竞品分析
const competitorResult = await analyzeCompetitor(noteData);

// 内容诊断（需要竞品分析结果）
const diagnosisResult = await diagnoseContent(userNoteData, competitorResult);

// 灵感解读
const inspirationResult = await analyzeInspiration(video, diagnosisResult);
```

## API 参考

### analyzeCompetitor()

分析竞品爆款笔记的成功要素。

```typescript
const result = await analyzeCompetitor(noteData, options?);
```

**参数:**
- `noteData: XhsNoteData` - 竞品笔记数据
- `options?: AnalyzeOptions` - 分析选项（可选）
  - `retries: number` - 重试次数（默认: 3）
  - `delay: number` - 初始延迟毫秒数（默认: 1000）
  - `backoff: boolean` - 是否指数退避（默认: true）

**返回:**
```typescript
{
  hookScore: number;          // 钩子强度 1-10
  contentScore: number;       // 内容价值 1-10
  visualScore: number;        // 视觉吸引力 1-10
  viralPotential: string;     // 爆款潜力分析
  keyInsights: string[];      // 关键洞察
  contentCategory: string;    // 内容类别
  targetAudience: string;     // 目标受众
  emotionalHooks: string[];   // 情感钩子
  valueProposition: string;   // 价值主张
}
```

### diagnoseContent()

诊断用户笔记内容,对比竞品找出差距。

```typescript
const result = await diagnoseContent(userNoteData, competitorData, options?);
```

**参数:**
- `userNoteData: XhsNoteData` - 用户笔记数据
- `competitorData: CompetitorAnalysisResult` - 竞品分析结果
- `options?: AnalyzeOptions` - 分析选项（可选）

**返回:**
```typescript
{
  overallScore: number;  // 综合评分 1-10
  hookGap: number;       // 钩子强度差距
  contentGap: number;    // 内容价值差距
  visualGap: number;     // 视觉吸引力差距
  improvements: {        // 改进建议
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    issue: string;
    suggestion: string;
  }[];
  strengths: string[];   // 优势
  weaknesses: string[];  // 劣势
}
```

### analyzeInspiration()

分析海外爆款视频,给出本土化建议。

```typescript
const result = await analyzeInspiration(video, diagnosisContext?, options?);
```

**参数:**
- `video: OverseasVideo` - 海外视频数据
- `diagnosisContext?: DiagnosisResult` - 诊断上下文（可选,提高相关性）
- `options?: AnalyzeOptions` - 分析选项（可选）

**返回:**
```typescript
{
  creativeInsight: string;      // 创意要点
  keyElements: string[];        // 可借鉴元素
  emotionalTone: string;        // 情绪风格
  localizationAdvice: string;   // 本土化建议
  suggestedTitles: string[];    // 标题建议
  suggestedTags: string[];      // 标签建议
  relevanceScore: number;       // 相关度评分 1-10
}
```

### analyzeInspirationBatch()

批量分析多个海外视频。

```typescript
const results = await analyzeInspirationBatch(videos, diagnosisContext?, options?);
```

**参数:**
- `videos: OverseasVideo[]` - 视频列表（6-10个）
- `diagnosisContext?: DiagnosisResult` - 诊断上下文（可选）
- `options?: AnalyzeOptions` - 分析选项（可选）

**返回:**
- `InspirationAnalysis[]` - 按相关度排序的分析结果数组

## 重试机制

所有分析函数都内置了重试机制:

- 默认重试 3 次
- 使用指数退避（1s, 2s, 4s）
- 自动识别可重试错误（网络错误、5xx、429）
- 重试失败后返回默认结果（优雅降级）

```typescript
// 自定义重试配置
const result = await analyzeCompetitor(noteData, {
  retries: 5,      // 最多重试 5 次
  delay: 2000,     // 初始延迟 2 秒
  backoff: false,  // 不使用指数退避
});
```

## 错误处理

```typescript
import { AnalyzeError } from '@/lib/anthropic';

try {
  const result = await analyzeCompetitor(noteData);
} catch (error) {
  if (error instanceof AnalyzeError) {
    console.error('错误代码:', error.code);
    console.error('是否可重试:', error.retryable);
  }
}
```

## 测试

```bash
# 运行测试脚本
npx ts-node src/lib/anthropic/test.ts
```

## 注意事项

1. **API Key 安全**: 确保 `ANTHROPIC_API_KEY` 不会被提交到 Git
2. **成本控制**:
   - 竞品分析使用 Sonnet（成本较高）
   - 灵感解读使用 Haiku（成本低）
   - 建议实现缓存机制,避免重复分析
3. **超时处理**: API 调用可能较慢,建议前端显示 loading 状态
4. **并发限制**: 避免同时发送大量请求,使用 `analyzeInspirationBatch` 并行分析

## 在 API Route 中使用

```typescript
// app/api/wizard/competitor/route.ts
import { analyzeCompetitor } from '@/lib/anthropic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { noteData } = await request.json();

    const result = await analyzeCompetitor(noteData);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

## 在 Server Action 中使用

```typescript
// app/actions/analyze.ts
'use server';

import { analyzeCompetitor } from '@/lib/anthropic';

export async function analyzeCompetitorAction(noteData: any) {
  try {
    const result = await analyzeCompetitor(noteData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Analysis failed' };
  }
}
```

## License

MIT
