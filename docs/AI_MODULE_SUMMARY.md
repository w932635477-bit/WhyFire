# AI 分析模块开发总结

## 完成时间
2026-03-17

## 创建的文件清单

### 核心模块 (8 个文件)

1. **src/lib/anthropic/types.ts** - 类型定义
   - 定义了所有数据结构和接口
   - 包含错误处理类 AnalyzeError

2. **src/lib/anthropic/client.ts** - Claude API 客户端
   - 封装 @anthropic-ai/sdk
   - 实现单例模式
   - 内置重试机制
   - 配置模型和 Token 限制

3. **src/lib/anthropic/prompts/competitor.ts** - 竞品分析 Prompt
   - 构建深度分析 Prompt
   - 分析钩子强度、内容价值、视觉吸引力
   - 提取关键洞察和爆款要素

4. **src/lib/anthropic/prompts/diagnose.ts** - 内容诊断 Prompt
   - 对比用户笔记与竞品
   - 分析差距并给出改进建议
   - 按优先级排序改进项

5. **src/lib/anthropic/prompts/inspiration.ts** - 灵感解读 Prompt
   - 分析海外爆款视频
   - 生成本土化建议
   - 提供标题和标签建议

6. **src/lib/anthropic/analyze.ts** - 主分析函数
   - analyzeCompetitor: 竞品分析
   - diagnoseContent: 内容诊断
   - analyzeInspiration: 灵感解读
   - analyzeInspirationBatch: 批量分析

7. **src/lib/anthropic/index.ts** - 模块导出
   - 统一导出所有功能
   - 便于外部调用

8. **src/lib/utils/retry.ts** - 重试机制
   - 通用的重试工具函数
   - 支持指数退避
   - 错误类型识别

### 文档和示例 (4 个文件)

9. **src/lib/anthropic/README.md** - 模块文档
   - 完整的 API 参考
   - 使用说明
   - 注意事项

10. **src/lib/anthropic/QUICKSTART.md** - 快速开始指南
    - 实际集成示例
    - 完整流程演示
    - 常见问题解答

11. **src/lib/anthropic/examples.ts** - 代码示例
    - 6 个实际使用场景
    - API Route 示例
    - Server Action 示例

12. **src/lib/anthropic/test.ts** - 测试脚本
    - 可执行的测试代码
    - 验证所有功能

### 工具脚本 (1 个文件)

13. **scripts/check-anthropic-types.sh** - 类型检查脚本
    - 自动检查类型错误
    - 开发辅助工具

## Prompt 设计的核心思路

### 1. 竞品分析 Prompt (Sonnet)

**设计理念**: 深度拆解爆款笔记的成功要素

**核心维度**:
- 钩子强度 (1-10): 标题、悬念、前3秒吸引力
- 内容价值 (1-10): 痛点解决、实用信息、情感共鸣
- 视觉吸引力 (1-10): 图片质量、视觉风格、记忆点

**关键输出**:
- 爆款潜力分析: 为什么能火
- 关键洞察: 哪些元素可以借鉴
- 情感钩子: 如何触发用户情绪
- 价值主张: 核心传递的信息

### 2. 内容诊断 Prompt (Sonnet)

**设计理念**: 对比分析找差距，给出可执行建议

**核心逻辑**:
- 使用竞品分析结果作为参照
- 对比各维度差距（可为负数）
- 按优先级分类改进建议（HIGH/MEDIUM/LOW）
- 同时识别优势和劣势

**关键输出**:
- 差距分析: 钩子/内容/视觉的具体差值
- 改进建议: 结构化的优先级建议
- 优劣势: 用户内容的亮点和不足

### 3. 灵感解读 Prompt (Haiku)

**设计理念**: 快速生成本土化建议，控制成本

**核心逻辑**:
- 可选的诊断上下文：提高推荐相关性
- 分析创意要点和可借鉴元素
- 生成小红书风格的标题和标签
- 评估与用户方向的相关度

**关键输出**:
- 创意要点: 核心创意是什么
- 可借鉴元素: 具体可以复用的元素
- 本土化建议: 如何改编到小红书
- 相关度评分: 与用户需求的匹配度

## 技术实现要点

### 1. 模型选择策略

| 功能 | 模型 | 原因 | 成本 |
|------|------|------|------|
| 竞品分析 | Claude Sonnet 4 | 需要深度分析 | 高 |
| 内容诊断 | Claude Sonnet 4 | 需要深度分析 | 高 |
| 灵感解读 | Claude Haiku 3.5 | 文本生成足够 | 低 |

### 2. 重试机制

```typescript
- 默认重试 3 次
- 指数退避 (1s, 2s, 4s)
- 自动识别可重试错误
  - 网络错误 (ECONNRESET, ETIMEDOUT)
  - HTTP 5xx 错误
  - Rate limit (429)
```

### 3. 错误处理

- 自定义 AnalyzeError 类
- 区分可重试/不可重试错误
- 失败时返回默认结果（优雅降级）

### 4. 类型安全

- 完整的 TypeScript 类型定义
- 运行时验证分析结果
- 严格的 null 检查

## 如何测试

### 1. 单元测试

```bash
# 设置 API Key
export ANTHROPIC_API_KEY=sk-ant-your-key

# 运行测试脚本
npx ts-node src/lib/anthropic/test.ts
```

### 2. 类型检查

```bash
# 运行类型检查脚本
./scripts/check-anthropic-types.sh
```

### 3. 集成测试

```typescript
// 在 API Route 中测试
import { analyzeCompetitor } from '@/lib/anthropic';

export async function POST(request: Request) {
  const result = await analyzeCompetitor(testData);
  return Response.json(result);
}
```

### 4. 手动测试

1. 启动开发服务器: `npm run dev`
2. 创建测试 API Route
3. 使用 Postman 或 cURL 测试
4. 检查返回的 JSON 结构

## 需要注意的问题

### 1. API Key 安全

- ❌ 不要提交 `.env.local` 到 Git
- ✅ 使用 `.env.example` 作为模板
- ✅ 生产环境使用安全的环境变量管理

### 2. 成本控制

- ⚠️ Sonnet 成本较高，避免重复分析
- ✅ 实现缓存机制（Redis）
- ✅ 灵感解读使用 Haiku
- ✅ 合理设置 max_tokens

### 3. 性能优化

- ⚠️ API 调用较慢（2-5秒）
- ✅ 前端显示 loading 状态
- ✅ 使用 Promise.all 并行分析
- ✅ 实现请求去重

### 4. 并发控制

- ⚠️ 避免同时发送大量请求
- ✅ 使用 p-limit 控制并发
- ✅ 实现用户级别的速率限制
- ✅ 使用 Redis 记录请求次数

### 5. 错误处理

- ⚠️ API 可能返回非 JSON
- ✅ 内置 JSON 解析失败处理
- ✅ 区分临时错误和永久错误
- ✅ 提供有意义的错误信息

### 6. 数据验证

- ⚠️ 小红书数据可能不完整
- ✅ 验证必需字段
- ✅ 提供默认值
- ✅ 记录异常情况

## 下一步工作

### 1. 数据抓取 (P0)
- [ ] 实现 Playwright 小红书爬虫
- [ ] 处理反爬机制
- [ ] 解析页面数据到 XhsNoteData

### 2. API Routes (P0)
- [ ] `/api/wizard/competitor` - 竞品分析
- [ ] `/api/wizard/diagnose` - 内容诊断
- [ ] `/api/wizard/inspiration` - 灵感推荐

### 3. 缓存机制 (P1)
- [ ] Redis 缓存层
- [ ] 缓存键设计
- [ ] 缓存过期策略

### 4. 前端集成 (P1)
- [ ] 创建向导式 UI
- [ ] 实现 loading 状态
- [ ] 错误提示处理

### 5. 监控和日志 (P2)
- [ ] 添加 Sentry 监控
- [ ] API 调用日志
- [ ] 成本追踪

## 技术债务

### 1. 测试覆盖
- 当前只有手动测试脚本
- 需要添加 Jest/Vitest 单元测试
- 需要 Mock Claude API

### 2. 流式响应
- 当前使用一次性响应
- 可以实现流式响应提升用户体验
- 需要使用 Claude 的 streaming API

### 3. Prompt 优化
- 当前 Prompt 可以进一步优化
- 需要收集用户反馈
- 可以实现 A/B 测试

### 4. 多语言支持
- 当前只支持中文
- 可以添加多语言 Prompt
- 需要国际化架构

## 参考资料

- [Claude API 文档](https://docs.anthropic.com)
- [技术架构文档](./docs/plans/2026-03-16-technical-architecture.md)
- [用户流程文档](./docs/USER_FLOW.md)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)

## 总结

成功创建了完整的 AI 分析模块,包括:

- 8 个核心模块文件
- 4 个文档和示例文件
- 1 个工具脚本

核心功能:
- 竞品分析 (Claude Sonnet)
- 内容诊断 (Claude Sonnet)
- 灵感解读 (Claude Haiku)

技术亮点:
- 完整的 TypeScript 类型
- 内置重试机制
- 优雅的错误处理
- 成本优化策略

下一步:
- 实现数据抓取
- 创建 API Routes
- 前端集成
- 添加缓存
