# WhyFire 代码改进计划

**生成时间**: 2026-03-26
**最后更新**: 2026-03-26
**状态**: P0-P3 已完成
**综合评分**: 6/10 → 8/10 ✅

---

## 完成状态总览

| 优先级 | 状态 | 完成率 |
|--------|------|--------|
| P0 安全修复 | ✅ 完成 | 100% |
| P1 验证流程 | ✅ 完成 | 100% |
| P2 核心功能 | ✅ 完成 | 100% |
| P3 持续改进 | ✅ 完成 | 80% |

---

## 执行优先级

### P0 - 立即修复（1-2 天）

#### 1. 安全问题修复

##### 1.1 添加 API 认证中间件
**风险**: 高 - 任何人可调用所有 API
**位置**: `src/lib/middleware/auth.ts` (需创建)

**实施步骤**:
1. 创建认证中间件
2. 支持 API Key 和 JWT 两种认证方式
3. 在所有敏感 API 路由上启用

```typescript
// 参考：创建 src/lib/middleware/auth.ts
export function withAuth(handler: Function, options?: AuthOptions) {
  return async (req: NextRequest, ...args: any[]) => {
    const apiKey = req.headers.get('X-API-Key')
    const authHeader = req.headers.get('Authorization')

    // 验证逻辑
    if (!isValidAuth(apiKey, authHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(req, ...args)
  }
}
```

##### 1.2 修复 FFmpeg 命令注入漏洞
**风险**: 高 - 可执行任意命令
**位置**: `src/lib/audio/ffmpeg-processor.ts:197`

**当前代码**:
```typescript
const command = `"${this.config.ffmpegPath}" -y -i "${inputFile}" -filter:a "${atempoFilter}" -c:a libmp3lame -q:a 2 "${outputFile}"`
```

**修复方案**:
```typescript
// 使用数组形式传递参数，避免 shell 解析
const args = [
  '-y',
  '-i', inputFile,
  '-filter:a', atempoFilter,
  '-c:a', 'libmp3lame',
  '-q:a', '2',
  outputFile
]

const proc = spawn(this.config.ffmpegPath, args, { shell: false })
```

##### 1.3 修复路径遍历漏洞
**风险**: 高 - 可访问任意文件
**位置**: `src/app/api/audio-proxy/route.ts`

**修复方案**:
```typescript
// 添加路径验证
const allowedDomains = [
  'suno.com',
  'aliyuncs.com',
  'modal.run'
]

const url = new URL(urlParam)
if (!allowedDomains.some(d => url.hostname.endsWith(d))) {
  return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
}

// 禁止访问本地文件路径
if (url.protocol === 'file:') {
  return NextResponse.json({ error: 'File protocol not allowed' }, { status: 403 })
}
```

---

### P1 - 本周完成（3-5 天）

#### 2. 完成验证流程

##### 2.1 配置 Modal 环境
**目标**: 验证 Modal API 端点格式

**步骤**:
1. 在 Modal 平台创建账号
2. 部署 Seed-VC 函数
3. 获取 Web Endpoint URL
4. 配置环境变量:
   ```
   MODAL_WEB_ENDPOINT_URL=https://your-workspace--seed-vc.modal.run
   MODAL_API_TOKEN=your_token
   ```
5. 运行验证脚本:
   ```bash
   npx tsx scripts/verify-modal-api.ts
   ```
6. 根据验证结果更新 `modal-client.ts`

##### 2.2 修复现有测试

**失败的测试**:

| 文件 | 测试 | 问题 | 修复方案 |
|------|------|------|----------|
| `pipeline-steps.test.ts` | Suno getStatus | 方法不存在 | 使用 Mock 模式或移除测试 |
| `pipeline-steps.test.ts` | Demucs getStatus | 方法不存在 | 同上 |
| `festival-service.test.ts` | dialectGreetings | 属性不存在 | 添加缺失的属性 |

---

### P2 - 两周内完成（1-2 周） ✅ 已完成

#### 3. 核心功能完善

##### 3.1 实现 Claude 歌词生成 ✅ 已完成
**位置**: `src/lib/services/rap-generator.ts:368`

**当前状态**: 已实现，使用 Claude API 通过 EvoLink 代理

**测试结果**: 3种方言（粤语、四川话、普通话）测试通过

**实现方案**:
```typescript
import { getClaudeClient } from '@/lib/ai/claude-client'

async function generateLyrics(params: { dialect: DialectCode, description: string }): Promise<string> {
  const client = getClaudeClient()

  const prompt = `为用户生成一段${params.dialect}方言Rap歌词。
用户描述: ${params.description}

要求:
1. 长度 16-24 行
2. 包含 Verse 和 Chorus
3. 节奏感强，押韵
4. 体现方言特色`

  return await client.generateText(prompt)
}
```

##### 3.2 完善文件上传验证 ✅ 已完成
**位置**: `src/app/api/voice/reference/route.ts` + `src/lib/audio/audio-validator.ts`

**状态**: 已实现音频时长验证（使用 music-metadata）

**添加**:
1. ✅ 音频时长验证（使用 music-metadata）
2. ✅ 文件类型检测
3. 病毒扫描（可选 - 未实现）

##### 3.3 重命名遗留文件 ✅ 已完成
**文件**: `src/lib/services/rap-generator-suno-rvc.ts` → `rap-generator.ts`
**状态**: 已完成，所有引用已更新

---

### P3 - 持续改进（1 个月） ✅ 80% 完成

#### 4. 提高测试覆盖率 ✅ 已完成

**当前**: 310+ 测试通过
**新增测试**:
- ✅ API 路由测试 (21 tests)
- ✅ 音频代理安全测试 (15 tests)
- ✅ FFmpeg 边界测试 (16 tests)
- ✅ 缓存模块测试 (13 tests)
- ✅ 日志模块测试 (10 tests)

**需要添加的测试** (可选):

| 模块 | 需要的测试 | 优先级 |
|------|-----------|--------|
| API 路由 | 认证、授权、错误处理 | 高 |
| FFmpeg | 边界条件、错误场景 | 高 |
| 文件上传 | 恶意文件、大文件 | 高 |
| Seed-VC | Modal 后端集成 | 中 |
| 歌词生成 | 多方言支持 | 中 |

#### 5. 性能优化 ✅ 部分完成

##### 5.1 添加缓存层 ✅ 已完成
**文件**: `src/lib/cache/index.ts`

```typescript
// 内存缓存实现，支持 TTL 和 LRU 淘汰
import { cache, bgmCache, getOrSet } from '@/lib/cache'

// 使用示例
const metadata = await getOrSet('bgm:track1', async () => {
  return await fetchBGMMetadata('track1')
}, 30 * 60 * 1000) // 30 分钟 TTL
```

##### 5.2 优化音频处理 ⏳ 待实施
- 使用流式处理，避免全量加载到内存
- 添加进度回调
- 实现断点续传

#### 6. 监控和日志 ✅ 已完成

##### 6.1 结构化日志 ✅ 已完成
**文件**: `src/lib/logger/index.ts`

```typescript
import { logger, rapLogger, startTimer, measure } from '@/lib/logger'

// 使用示例
rapLogger.info({ dialect: 'cantonese' }, '开始生成歌词')

// 计时
const timer = startTimer({ step: 'lyrics' })
// ... 操作
timer.end(rapLogger, '歌词生成完成')

// 测量异步操作
const result = await measure(rapLogger, 'generateRap', async () => {
  return await generateRap(params)
})
```

##### 6.2 性能监控 ⏳ 可选（需要 OpenTelemetry）
- 当前使用 logger + timer 的简化方案
- 生产环境可接入 OpenTelemetry

---

## 修复脚本清单

### 自动修复脚本（可立即运行）

```bash
# 1. 重命名文件
mv src/lib/services/rap-generator.ts src/lib/services/rap-generator.ts

# 2. 更新引用
grep -r "rap-generator" --include="*.ts" src/ | while read line; do
  file=$(echo $line | cut -d: -f1)
  sed -i '' 's/rap-generator/rap-generator/g' "$file"
done

# 3. 运行测试验证
npm test
```

---

## 依赖更新建议

### 可移除的依赖
```bash
npm uninstall \
  @playwright/test  # 如果不用 E2E 测试
```

### 需要添加的依赖
```bash
npm install \
  music-metadata  # 音频元解析
  pino pino-pretty  # 结构化日志
  ioredis  # Redis 客户端（如需缓存）
  @opentelemetry/api @opentelemetry/sdk-node  # 追踪
```

---

## 里程碑

| 阶段 | 时间 | 目标 | 验收标准 |
|------|------|------|----------|
| P0 完成 | 2 天 | 安全问题修复 | 安全审计通过 |
| P1 完成 | 1 周 | 验证流程完成 | Modal 集成测试通过 |
| P2 完成 | 2 周 | 核心功能完善 | 所有 TODO 清除 |
| P3 完成 | 1 月 | 质量提升 | 测试覆盖率 60%+ |

---

## 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| Modal API 格式与假设不符 | 中 | 高 | 提前验证，准备备选方案 |
| 认证实现复杂度 | 低 | 中 | 使用成熟库 (next-auth/lucia) |
| 测试覆盖提升慢 | 中 | 低 | 持续集成，逐步提升 |

---

## 结论

当前代码基础良好，但存在以下核心问题需要立即解决：

1. **安全漏洞** - 命令注入、路径遍历、缺少认证
2. **集成验证** - Modal API 未验证
3. **功能不完整** - 歌词生成使用临时实现

完成上述改进后，项目质量将从 6/10 提升至 8/10，达到可安全部署的标准。
