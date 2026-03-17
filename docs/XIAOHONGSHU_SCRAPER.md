# 小红书数据抓取模块使用指南

## 概述

本模块用于抓取小红书公开页面的笔记数据，采用 Playwright 浏览器自动化技术，遵守合规边界，只获取公开可见的信息。

## 文件结构

```
src/lib/platforms/
├── types.ts                    # 平台通用类型定义
├── base.ts                     # 基础接口和抽象类
├── index.ts                    # 统一导出
└── xiaohongshu/
    ├── types.ts                # 小红书特定类型定义
    ├── scraper.ts              # 抓取逻辑实现
    ├── test.ts                 # 测试脚本
    └── index.ts                # 小红书模块导出
```

## 安装依赖

```bash
# 安装 Playwright
npm install

# 安装 Chromium 浏览器（首次使用必须）
npx playwright install chromium
```

## 基本使用

### 1. 在 API 路由中使用

```typescript
// app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { XiaohongshuScraper } from '@/lib/platforms/xiaohongshu';

export async function POST(request: NextRequest) {
  const scraper = new XiaohongshuScraper();

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const result = await scraper.scrapeNote(url);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await scraper.close();
  }
}
```

### 2. 在向导流程中使用（Step 1: 竞品分析）

```typescript
// app/(wizard)/step1-competitor/page.tsx
import { XiaohongshuScraper } from '@/lib/platforms/xiaohongshu';

async function analyzeCompetitor(noteUrl: string) {
  const scraper = new XiaohongshuScraper();

  try {
    // 1. 抓取笔记数据
    const result = await scraper.scrapeNote(noteUrl);

    if (!result.success || !result.data) {
      throw new Error(result.error || '抓取失败');
    }

    const noteData = result.data;

    // 2. 发送给 AI 分析
    const analysis = await analyzeWithClaude(noteData);

    // 3. 保存到 session
    // ...

    return { noteData, analysis };
  } finally {
    await scraper.close();
  }
}
```

### 3. 配置选项

```typescript
const scraper = new XiaohongshuScraper({
  headless: true,          // 是否无头模式（生产环境建议 true）
  timeout: 30000,          // 超时时间（毫秒）
  maxRetries: 3,           // 最大重试次数
  retryDelay: 2000,        // 重试延迟（毫秒）
  randomDelay: {           // 随机延迟（反爬）
    min: 1000,
    max: 3000,
  },
});
```

## 数据结构

### XhsNoteData

```typescript
interface XhsNoteData {
  platform: 'xiaohongshu';
  noteId: string;
  noteUrl: string;
  scrapedAt: Date;

  // 笔记内容
  title: string;
  description: string;
  noteType: 'normal' | 'video';
  coverImage: string;
  images?: string[];
  videoUrl?: string;
  hashtags: string[];

  // 作者信息
  author: {
    authorId: string;
    authorName: string;
    avatarUrl?: string;
    followerCount?: number;
    noteCount?: number;
    likedCount?: number;
  };

  // 互动数据
  interactions: {
    likeCount: number;
    collectCount: number;
    commentCount: number;
    shareCount: number;
    totalInteractions: number;
    collectToLikeRatio: number; // 收藏/点赞比
  };

  publishedAt?: Date;
  location?: string;
  isRecommended?: boolean;
}
```

## 测试

### 运行测试脚本

```bash
# 1. 编辑测试文件，替换为真实的笔记链接
vim src/lib/platforms/xiaohongshu/test.ts

# 2. 运行测试
npx ts-node src/lib/platforms/xiaohongshu/test.ts
```

### 测试内容

- ✅ URL 验证
- ✅ ID 提取
- ✅ 数据抓取
- ✅ 数据结构验证
- ✅ 错误处理

## 合规说明

### ✅ 允许的操作

- 访问公开页面
- 获取公开可见的信息（标题、正文、互动数据、封面图）
- 单次请求，不批量爬取
- 遵守 robots.txt

### ❌ 禁止的操作

- 绕过反爬措施
- 使用账号登录或 Cookie
- 批量爬取数据
- 频繁请求触发封禁

### 风险等级

| 行为 | 风险等级 |
|------|---------|
| 用户手动输入链接抓取 | ✅ 低风险 |
| 单次访问公开页面 | ✅ 低风险 |
| 批量爬取 | ❌ 高风险 |
| 绕过反爬 | ❌ 极高风险 |

## 性能优化

### 1. 浏览器实例复用

```typescript
// 推荐：在一个流程中复用同一个实例
const scraper = new XiaohongshuScraper();

try {
  const result1 = await scraper.scrapeNote(url1);
  const result2 = await scraper.scrapeNote(url2);
} finally {
  await scraper.close(); // 最后关闭
}
```

### 2. 使用单例（高级用法）

```typescript
// lib/platforms/xiaohongshu/scraper.ts
export const xiaohongshuScraper = new XiaohongshuScraper();

// 使用时
import { xiaohongshuScraper } from '@/lib/platforms/xiaohongshu';
const result = await xiaohongshuScraper.scrapeNote(url);
// 注意：单例模式需要在应用关闭时手动调用 close()
```

## 错误处理

```typescript
const result = await scraper.scrapeNote(url);

if (!result.success) {
  console.error('抓取失败:', result.error);

  // 根据错误类型处理
  if (result.error?.includes('timeout')) {
    // 超时，可能是网络问题
  } else if (result.error?.includes('Invalid')) {
    // URL 无效
  } else {
    // 其他错误
  }
}
```

## 注意事项

1. **首次使用必须安装浏览器**：`npx playwright install chromium`
2. **生产环境建议无头模式**：`headless: true`
3. **不要频繁请求**：模块已内置随机延迟，避免触发反爬
4. **及时关闭浏览器**：使用 `finally` 确保 `scraper.close()` 被调用
5. **遵守使用条款**：只用于分析自己或竞争对手的公开内容

## 下一步

- [ ] 集成到 Step 1 竞品分析 API
- [ ] 添加数据缓存（Redis）
- [ ] 添加速率限制（防止滥用）
- [ ] 实现批量抓取（带并发控制）

## 参考资料

- [Playwright 官方文档](https://playwright.dev/docs/intro)
- [小红书 robots.txt](https://www.xiaohongshu.com/robots.txt)
- [DATA_ANALYSIS.md - 合规边界](../../docs/DATA_ANALYSIS.md)
