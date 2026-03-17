# 小红书抓取模块 - 快速开始

## 1. 安装依赖

```bash
# 安装项目依赖（包括 Playwright）
npm install

# 安装 Chromium 浏览器（首次使用必须）
npx playwright install chromium
```

## 2. 测试抓取

编辑测试文件，替换为真实的笔记链接：

```bash
vim src/lib/platforms/xiaohongshu/test.ts
# 将 'https://www.xiaohongshu.com/explore/xxxxx' 替换为真实链接
```

运行测试：

```bash
npx ts-node src/lib/platforms/xiaohongshu/test.ts
```

## 3. 使用 API

启动开发服务器：

```bash
npm run dev
```

发送请求：

```bash
curl -X POST http://localhost:3000/api/scrape/xiaohongshu \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.xiaohongshu.com/explore/YOUR_NOTE_ID"}'
```

## 4. 返回数据示例

```json
{
  "success": true,
  "data": {
    "platform": "xiaohongshu",
    "noteId": "abc123",
    "noteUrl": "https://www.xiaohongshu.com/explore/abc123",
    "title": "显瘦穿搭技巧",
    "description": "分享几个显瘦穿搭技巧...",
    "noteType": "normal",
    "coverImage": "https://...",
    "hashtags": ["穿搭", "显瘦", "时尚"],
    "author": {
      "authorId": "user123",
      "authorName": "时尚博主小王",
      "followerCount": 50000
    },
    "interactions": {
      "likeCount": 1200,
      "collectCount": 350,
      "commentCount": 89,
      "shareCount": 45,
      "totalInteractions": 1684,
      "collectToLikeRatio": 0.29
    }
  },
  "scrapedAt": "2026-03-17T07:30:00.000Z"
}
```

## 5. 常见问题

### Q: 提示找不到 Playwright 模块？

```bash
npm install playwright
npx playwright install chromium
```

### Q: 抓取失败或超时？

- 检查网络连接
- 确认笔记链接有效
- 查看错误日志

### Q: 如何调整超时时间？

```typescript
const scraper = new XiaohongshuScraper({
  timeout: 60000, // 60 秒
  maxRetries: 5,  // 5 次重试
});
```

## 6. 下一步

- 集成到向导流程 Step 1（竞品分析）
- 添加 Redis 缓存
- 添加速率限制

详细文档请查看：
- [完整使用指南](./XIAOHONGSHU_SCRAPER.md)
- [技术架构](./plans/2026-03-16-technical-architecture.md)
- [合规说明](./DATA_ANALYSIS.md)
