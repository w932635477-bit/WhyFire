# WhyFire 方言 Rap 视频生成平台 - 技术设计方案

> 版本：v2.0
> 日期：2026-03-21
> 作者：WhyFire Team
> 更新：基于 MoneyPrinterTurbo 开源项目改造方案

---

## 一、项目概述

### 1.1 背景

当前音乐生成 API 存在以下问题：
- **价格昂贵**：Mureka API $1000+/月，MiniMax 也有成本压力
- **方言支持有限**：商业 API 方言种类少，无法覆盖市场需求
- **歌词质量差**：生成内容"太水"，缺乏时效性和热点元素

### 1.2 目标

构建一套**自研的方言 Rap + 视频合成平台**，实现：
1. ✅ 支持 18+ 种中国方言
2. ✅ 融合实时热点 + 节日元素
3. ✅ 低成本运营（$50-200/月 vs $1000+/月）
4. ✅ 完全可控的生成质量

### 1.3 目标用户

与 WhyFire 项目一致：短视频创作者、电商从业者、内容运营人员

### 1.4 技术路线决策

**选择基于 MoneyPrinterTurbo 开源项目改造**，而非从零开发。

**理由：**
- MoneyPrinterTurbo 已覆盖 90% 所需功能（视频生成、字幕、TTS）
- 15K+ GitHub Stars，社区活跃，持续维护
- 可节省 60-70% 开发时间，专注于方言和热点模块

---

## 二、可行性分析（基于 MoneyPrinterTurbo）

### 2.1 MoneyPrinterTurbo 项目分析

| 维度 | 评估 | 说明 |
|------|------|------|
| **GitHub Stars** | ⭐ 15K+ | 社区认可度高 |
| **活跃度** | ✅ 高 | 持续更新，Issue 响应及时 |
| **功能覆盖** | ✅ 90% | 视频生成、字幕、TTS 已完善 |
| **技术栈** | ✅ 兼容 | Python + FastAPI + FFmpeg |
| **扩展性** | ✅ 良好 | 模块化设计，易于扩展 |
| **文档质量** | ✅ 完善 | 部署文档、API 文档齐全 |

### 2.2 功能匹配度分析

| 功能需求 | MoneyPrinterTurbo | 改造难度 | 优先级 |
|----------|-------------------|----------|--------|
| 视频生成 | ✅ 已有 | 无需改造 | - |
| 字幕生成 | ✅ 已有 | 无需改造 | - |
| TTS 语音合成 | ✅ 已有（Azure/Edge） | 需替换为方言TTS | P0 |
| LLM 歌词生成 | ✅ 已有（GPT/Claude） | 需增强热点模块 | P0 |
| 背景音乐 | ✅ 已有 | 无需改造 | - |
| **方言支持** | ❌ 无 | 需新增 | P0 |
| **热点融合** | ❌ 无 | 需新增 | P1 |
| **节日感知** | ❌ 无 | 需新增 | P1 |
| **Rap 节奏同步** | ⚠️ 部分 | 需优化 | P2 |

### 2.3 改造风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Fun-CosyVoice3 部署复杂 | 中 | 提供 Docker 一键部署 |
| 热点 API 不稳定 | 低 | 多源备份 + 本地缓存 |
| 节奏同步算法精度 | 中 | 参考 Step-Audio 实现 |
| 与 WhyFire 现有代码集成 | 低 | 微服务架构，独立部署 |

### 2.4 可行性结论

**✅ 可行性：高**

- 技术上完全可行，所需组件均为开源项目
- 开发周期可控，预计 3-4 周完成核心功能
- 成本可控，月运营成本 $60-200
- 可逐步迭代，先上线核心功能再扩展

---

## 三、技术框架设计

### 3.1 整体架构（基于 MoneyPrinterTurbo 改造）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WhyFire 方言 Rap 平台 (基于 MoneyPrinterTurbo)           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MoneyPrinterTurbo 核心                         │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────┐ │   │
│  │  │ 视频生成     │   │ 字幕生成     │   │ 素材管理     │   │ 渲染引擎  │ │   │
│  │  │ (MoviePy)   │   │ (ASR)       │   │ (本地/CDN)  │   │ (FFmpeg) │ │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘   └──────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│                                    │ 调用                                    │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        WhyFire 增强模块                               │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │ 歌词增强服务      │  │ 方言 TTS 服务    │  │ Rap 节奏同步服务     │  │   │
│  │  │                 │  │                 │  │                     │  │   │
│  │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────────┐ │  │   │
│  │  │ │ 节日识别     │ │  │ │ Fun-CosyVoice│ │  │ │ 节拍检测         │ │  │   │
│  │  │ │ 热点搜索     │ │  │ │ 18种方言    │ │  │ │ (librosa/essentia)│ │  │   │
│  │  │ │ Prompt 增强  │ │  │ │ 音色克隆    │ │  │ │ 字幕时间轴对齐    │ │  │   │
│  │  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────────┘ │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           API 网关层                                  │   │
│  │   REST API (FastAPI)  │  WebSocket (实时状态)  │  Webhook (回调)     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 核心模块设计

#### 3.2.1 MoneyPrinterTurbo 改造点

```python
# 改造文件: app/services/audio_service.py

# 原始：使用 Azure/Edge TTS
async def generate_audio(text: str, voice: str) -> str:
    # Edge TTS 实现
    pass

# 改造：支持方言 TTS
async def generate_audio(
    text: str,
    voice: str,
    dialect: str = "mandarin",  # 新增：方言参数
    use_dialect_tts: bool = False  # 新增：是否使用方言 TTS
) -> str:
    if use_dialect_tts:
        # 调用 Fun-CosyVoice3
        return await dialect_tts_service.generate(text, dialect, voice)
    else:
        # 保持原有逻辑
        pass
```

```python
# 改造文件: app/services/script_service.py

# 新增：热点融合的脚本生成
async def generate_script_with_trending(
    topic: str,
    dialect: str,
    include_trending: bool = True,
    include_festival: bool = True
) -> dict:
    # 1. 获取时间上下文
    time_context = get_time_context()

    # 2. 搜索相关热点
    trending = await trending_service.search(topic) if include_trending else []

    # 3. 增强 Prompt
    enhanced_prompt = build_enhanced_prompt(
        topic=topic,
        dialect=dialect,
        festival=time_context.current_festival,
        trending=trending
    )

    # 4. 调用 LLM 生成
    return await llm_service.generate(enhanced_prompt)
```

### 3.3 部署架构

```yaml
# docker-compose.yml

version: '3.8'

services:
  # MoneyPrinterTurbo 核心服务
  money-printer:
    build: ./MoneyPrinterTurbo
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./data/videos:/app/data/videos
    depends_on:
      - redis

  # 方言 TTS 服务
  dialect-tts:
    build: ./dialect-tts
    ports:
      - "8001:8001"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ./models:/app/models

  # 热点服务
  trending-service:
    build: ./trending-service
    ports:
      - "8002:8002"
    environment:
      - SERPER_API_KEY=${SERPER_API_KEY}

  # Redis 缓存
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### 3.4 与 WhyFire 现有项目集成

```
┌───────────────────────────────────────────────────────────────────────┐
│                        WhyFire 现有项目 (Next.js)                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │
│  │ 前端 UI      │    │ API Routes  │    │ Remotion 视频合成        │   │
│  │ (React)     │    │ (/api/*)    │    │ (现有能力保留)           │   │
│  └─────────────┘    └──────┬──────┘    └─────────────────────────┘   │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                             │ HTTP/gRPC
                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│                  MoneyPrinterTurbo 微服务 (Python)                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │
│  │ 视频生成     │    │ 字幕生成     │    │ 素材管理                 │   │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘   │
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │
│  │ 方言 TTS     │    │ 热点服务     │    │ Rap 节奏同步             │   │
│  │ (新增模块)   │    │ (新增模块)   │    │ (新增模块)               │   │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**集成方式：**
1. MoneyPrinterTurbo 作为独立微服务部署
2. WhyFire 通过 HTTP API 调用
3. 两者共享 Supabase 数据库
4. Remotion 保留用于高级视频特效

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WhyFire 方言 Rap 平台                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │ 用户输入     │ →  │ 歌词生成     │ →  │ 音乐合成     │ →  │ 视频合成  │ │
│  │ (场景+方言)  │    │ (热点+节日)  │    │ (方言TTS)   │    │ (Remotion)│ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
│         │                  │                  │                  │      │
│         │                  │                  │                  │      │
│         ▼                  ▼                  ▼                  ▼      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │ 场景选择     │    │ 时效分析     │    │ 方言音色     │    │ 模板系统  │ │
│  │ 方言选择     │    │ 热点搜索     │    │ 背景音乐     │    │ FFmpeg   │ │
│  │ 内容描述     │    │ 歌词润色     │    │ 节奏同步     │    │ 字幕生成  │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 三、模块一：热点 + 节日融合的歌词生成

### 3.1 问题分析

| 当前问题 | 具体表现 |
|---------|---------|
| 示例太旧 | 示例库是固定的，没有时效性 |
| 缺少热点 | 无法获取最新网络热梗 |
| 无节日感知 | 不知道当前是什么节日 |
| 内容太水 | 缺少真实有趣的内容素材 |

### 3.2 解决方案

#### 3.2.1 时效性识别模块

```typescript
// src/lib/ai/context/time-context.ts

interface TimeContext {
  // 当前节日（当天或即将到来 7 天内）
  currentFestival?: Festival
  // 季节性主题
  seasonalTheme?: SeasonalTheme
  // 特殊时期
  specialPeriod?: SpecialPeriod
}

type Festival =
  | 'spring_festival'      // 春节
  | 'lantern_festival'     // 元宵节
  | 'qingming'             // 清明节
  | 'labor_day'            // 五一
  | 'dragon_boat'          // 端午节
  | 'mid_autumn'           // 中秋节
  | 'national_day'         // 国庆节
  | 'double_11'            // 双11
  | 'double_12'            // 双12
  | 'christmas'            // 圣诞节
  | 'new_year'             // 元旦
  | 'valentines'           // 情人节
  | 'womens_day'           // 三八节
  | 'mothers_day'          // 母亲节
  | 'fathers_day'          // 父亲节
  | 'childrens_day'        // 儿童节
  | 'teachers_day'         // 教师节

type SeasonalTheme =
  | 'spring_outing'        // 春游季
  | 'summer_vacation'      // 暑假
  | 'back_to_school'       // 开学季
  | 'autumn_harvest'       // 秋收
  | 'winter_solstice'      // 冬至
  | 'spring_travel'        // 春运

type SpecialPeriod =
  | 'year_end_party'       // 年会季
  | 'graduation'           // 毕业季
  | 'job_hunting'          // 求职季
  | 'shopping_festival'    // 购物节
```

#### 3.2.2 节日数据配置

```typescript
// src/lib/ai/context/festivals.ts

interface FestivalConfig {
  id: Festival
  name: string
  datePattern: string | ((year: number) => Date)  // 固定日期或计算函数
  advanceDays: number      // 提前几天开始预热
  themes: string[]         // 相关主题词
  keywords: string[]       // 关键词
  dialectStyle?: Record<DialectType, string>  // 方言特色表达
}

export const FESTIVAL_CONFIGS: FestivalConfig[] = [
  {
    id: 'spring_festival',
    name: '春节',
    datePattern: (year) => getLunarNewYear(year),  // 农历计算
    advanceDays: 14,
    themes: ['团圆', '红包', '拜年', '鞭炮', '年夜饭'],
    keywords: ['新年快乐', '恭喜发财', '龙年大吉', '万事如意'],
    dialectStyle: {
      mandarin: '新年好呀，恭喜发财',
      cantonese: '恭喜发财，利是逗来',
      // 山东话示例
      shandong: '过年好啊，给您拜年啦',
    }
  },
  {
    id: 'qingming',
    name: '清明节',
    datePattern: '04-04',  // 或 04-05
    advanceDays: 3,
    themes: ['踏青', '祭祖', '春游', '青团'],
    keywords: ['清明时节', '春风十里'],
  },
  {
    id: 'labor_day',
    name: '五一劳动节',
    datePattern: '05-01',
    advanceDays: 7,
    themes: ['假期', '旅游', '放松', '劳动光荣'],
    keywords: ['五一快乐', '假期模式'],
  },
  // ... 更多节日配置
]
```

#### 3.2.3 热点搜索服务

```typescript
// src/lib/ai/context/trending-search.ts

interface TrendingTopic {
  title: string
  description: string
  keywords: string[]
  memes: string[]      // 相关热梗
  source: 'weibo' | 'douyin' | 'zhihu' | 'bilibili'
  heat: number         // 热度值
  fetchedAt: Date
}

export class TrendingSearchService {
  /**
   * 获取当前热点话题
   */
  async getTrendingTopics(options?: {
    category?: 'all' | 'entertainment' | 'social' | 'tech'
    limit?: number
  }): Promise<TrendingTopic[]> {
    // 方案1: 调用第三方热点 API
    // 方案2: 使用 Web Search 搜索当前热点
    // 方案3: 缓存 + 定时更新
  }

  /**
   * 搜索特定主题的热点
   */
  async searchTrending(query: string): Promise<TrendingTopic[]> {
    // 使用 Web Search 搜索相关热点
  }

  /**
   * 获取网络热梗
   */
  async getInternetMemes(): Promise<string[]> {
    // 获取当前流行的网络用语、梗
  }
}
```

#### 3.2.4 歌词生成增强 Prompt

```typescript
// src/lib/ai/prompts/enhanced-lyrics-prompts.ts

interface EnhancedPromptContext extends PromptContext {
  // 时效性上下文
  timeContext?: TimeContext
  // 热点内容
  trendingTopics?: TrendingTopic[]
  // 网络热梗
  internetMemes?: string[]
}

function buildEnhancedPrompt(ctx: EnhancedPromptContext): string {
  const festivalSection = ctx.timeContext?.currentFestival
    ? buildFestivalSection(ctx.timeContext.currentFestival)
    : ''

  const trendingSection = ctx.trendingTopics?.length
    ? buildTrendingSection(ctx.trendingTopics)
    : ''

  const memeSection = ctx.internetMemes?.length
    ? buildMemeSection(ctx.internetMemes)
    : ''

  return `你是专业的Rap歌词创作专家，擅长创作有梗、有趣、有时效性的内容。

【任务】创作30秒Rap歌词

场景: ${ctx.scene}
语言: ${ctx.dialect}
${ctx.productName ? `产品: ${ctx.productName}` : ''}
${ctx.theme ? `主题: ${ctx.theme}` : ''}

${festivalSection}

${trendingSection}

${memeSection}

【质量要求】
- 融合上述节日氛围/热点事件/网络热梗
- 至少使用2-3个热点元素
- 有1-2个"金句"（可单独传播的句子）
- 押韵自然，节奏感强
- 约100-150字

【重要】只输出歌词，不要任何解释、说明或分析。`
}

function buildFestivalSection(festival: Festival): string {
  const config = FESTIVAL_CONFIGS.find(f => f.id === festival)
  if (!config) return ''

  return `【当前节日氛围】
节日: ${config.name}
相关主题: ${config.themes.join('、')}
关键词: ${config.keywords.join('、')}
请在歌词中自然融入节日氛围！`
}

function buildTrendingSection(topics: TrendingTopic[]): string {
  const topTopics = topics.slice(0, 3)
  const content = topTopics.map(t =>
    `- ${t.title}: ${t.description}`
  ).join('\n')

  return `【当前热点事件】
${content}
请适度引用热点事件，增加话题性！`
}

function buildMemeSection(memes: string[]): string {
  return `【当前网络热梗】
${memes.slice(0, 5).join('、')}
请自然融入1-2个热梗，增加传播力！`
}
```

### 3.3 实现步骤

```
Phase 1: 节日识别 (1-2天)
├── 创建节日配置数据
├── 实现农历日期计算
├── 实现时效性识别函数
└── 单元测试

Phase 2: 热点搜索 (2-3天)
├── 集成 Web Search API
├── 实现热点搜索服务
├── 添加缓存机制 (1小时更新一次)
└── 错误处理

Phase 3: Prompt 增强 (1-2天)
├── 重构歌词生成 Prompt
├── 融合节日 + 热点 + 热梗
├── 测试生成效果
└── 调优
```

---

## 四、模块二：方言音乐生成

### 4.1 技术选型对比

| 方案 | 开源项目 | 方言支持 | 难度 | 推荐度 |
|------|----------|----------|------|--------|
| **方案A: 方言TTS** | Fun-CosyVoice3 | 18种方言 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **方案B: 音色克隆** | GPT-SoVITS | 多语言 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **方案C: 歌唱合成** | DiffSinger | 需训练 | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **方案D: 完整歌曲** | YuE/DiffRhythm | 需微调 | ⭐⭐⭐ | ⭐⭐⭐ |

### 4.2 推荐方案：方言TTS + 背景音乐

#### 4.2.1 架构设计

```
┌────────────────────────────────────────────────────────────────┐
│                      音乐生成流程                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  歌词 ──→ 方言TTS ──→ 人声轨道                                 │
│           (Fun-CosyVoice3)                                     │
│                                                                │
│  风格 ──→ 背景音乐 ──→ 伴奏轨道                                 │
│           (MusicGen/MiniMax)                                   │
│                                                                │
│  人声 + 伴奏 ──→ 混音 ──→ 最终音频                              │
│                  (FFmpeg)                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Fun-CosyVoice3 集成

```typescript
// src/lib/dialect-tts/cosyvoice-client.ts

interface CosyVoiceOptions {
  text: string
  dialect: DialectType
  emotion?: 'happy' | 'sad' | 'angry' | 'neutral'
  voiceId?: string  // 音色ID
  speed?: number    // 语速
}

interface CosyVoiceResult {
  audioUrl: string
  duration: number
}

export class CosyVoiceClient {
  private baseUrl: string

  constructor() {
    // 本地部署或远程 API
    this.baseUrl = process.env.COSYVOICE_API_URL || 'http://localhost:8000'
  }

  /**
   * 生成方言语音
   * 支持18种中文方言
   */
  async generateSpeech(options: CosyVoiceOptions): Promise<CosyVoiceResult> {
    const response = await fetch(`${this.baseUrl}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: options.text,
        dialect: this.mapDialect(options.dialect),
        emotion: options.emotion || 'happy',
        voice_id: options.voiceId,
        speed: options.speed || 1.0,
      }),
    })

    // 返回音频文件
    const audioBuffer = await response.arrayBuffer()
    // 保存并返回 URL
  }

  /**
   * 方言映射
   */
  private mapDialect(dialect: DialectType): string {
    const map: Record<DialectType, string> = {
      mandarin: 'zh-cn',
      cantonese: 'yue',
      shandong: 'sd',      // 山东话
      dongbei: 'ne',       // 东北话
      sichuan: 'sc',       // 四川话
      henan: 'ha',         // 河南话
      shaanxi: 'sn',       // 陕西话
      wu: 'wu',            // 吴语
      minnan: 'min',       // 闽南语
      hakka: 'hak',        // 客家话
      // ... 更多方言
    }
    return map[dialect] || 'zh-cn'
  }
}
```

#### 4.2.3 支持的方言列表

| 方言 | 代码 | 示例区域 |
|------|------|---------|
| 普通话 | mandarin | 全国 |
| 粤语 | cantonese | 广东、香港 |
| 山东话 | shandong | 山东 |
| 东北话 | dongbei | 东北三省 |
| 四川话 | sichuan | 四川、重庆 |
| 河南话 | henan | 河南 |
| 陕西话 | shaanxi | 陕西 |
| 吴语 | wu | 上海、江苏、浙江 |
| 闽南语 | minnan | 福建、台湾 |
| 客家话 | hakka | 广东、江西 |
| 湘语 | xiang | 湖南 |
| 赣语 | gan | 江西 |
| 晋语 | jin | 山西 |
| 兰银官话 | lanyin | 甘肃、宁夏 |
| 江淮官话 | jianghuai | 江苏、安徽 |
| 西南官话 | xinan | 云南、贵州、广西 |
| 胶辽官话 | jiaoliao | 山东、辽宁 |
| 中原官话 | zhongyuan | 河南、陕西 |

### 4.3 部署方案

#### 4.3.1 本地部署（推荐）

```yaml
# docker-compose.yml
version: '3.8'

services:
  cosyvoice:
    image: funaudiollm/cosyvoice:latest
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models
      - ./output:/app/output
    environment:
      - GPU_VISIBLE_DEVICES=0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

#### 4.3.2 云服务器部署

| 配置 | GPU | 月费用 | 适用场景 |
|------|-----|--------|---------|
| 入门 | T4 16GB | ~$50-100 | 开发测试 |
| 标准 | A10 24GB | ~$150-300 | 小规模生产 |
| 高配 | A100 40GB | ~$500-800 | 大规模生产 |

---

## 五、模块三：视频合成

### 5.1 现有基础

项目已有 Remotion 视频合成能力，需要增强：

1. **字幕同步**：歌词与音频节拍同步
2. **模板系统**：更多方言/场景模板
3. **特效增强**：节日氛围特效

### 5.2 增强点

```typescript
// src/lib/video/templates/festival-template.ts

interface FestivalTemplateConfig {
  festival: Festival
  backgroundColor: string
  textColor: string
  decorations: string[]  // 装饰元素
  animations: string[]   // 动画效果
  bgMusic?: string       // 背景音效
}

export const FESTIVAL_TEMPLATES: Record<Festival, FestivalTemplateConfig> = {
  spring_festival: {
    backgroundColor: '#D4242B',  // 中国红
    textColor: '#FFD700',        // 金色
    decorations: ['灯笼', '鞭炮', '福字', '龙'],
    animations: ['fireworks', 'floating-lanterns'],
    bgMusic: '/audio/spring-festival-bg.mp3',
  },
  mid_autumn: {
    backgroundColor: '#1a1a2e',
    textColor: '#f5f5dc',
    decorations: ['月亮', '月饼', '兔子', '桂花'],
    animations: ['moon-glow', 'falling-petals'],
  },
  // ... 更多节日模板
}
```

---

## 六、API 设计

### 6.1 歌词生成 API（增强版）

```typescript
// POST /api/lyrics/generate-v2

interface LyricsGenerateV2Request {
  scene: SceneType
  dialect: DialectType
  inputs: {
    // 场景相关输入
    productName?: string
    sellingPoints?: string[]
    theme?: string
    keywords?: string[]
  }
  // 新增：时效性选项
  timeOptions?: {
    includeFestival?: boolean     // 是否包含节日元素
    includeTrending?: boolean     // 是否包含热点
    includeMemes?: boolean        // 是否包含热梗
    customFestival?: Festival     // 指定节日（可选）
    customTrending?: string[]     // 指定热点（可选）
  }
}

interface LyricsGenerateV2Response {
  lyricsId: string
  content: string
  wordCount: number
  estimatedDuration: number
  // 新增：生成元信息
  meta: {
    festival?: {
      id: Festival
      name: string
    }
    trendingTopics?: string[]
    memes?: string[]
  }
}
```

### 6.2 音乐生成 API

```typescript
// POST /api/music/generate

interface MusicGenerateRequest {
  lyrics: string
  dialect: DialectType
  style: 'rap' | 'pop' | 'electronic'
  voiceId?: string           // 音色ID（可选）
  includeBgm?: boolean       // 是否包含背景音乐
  bgmStyle?: string          // 背景音乐风格
}

interface MusicGenerateResponse {
  audioUrl: string
  duration: number
  provider: 'cosyvoice' | 'minimax'
}
```

### 6.3 视频合成 API

```typescript
// POST /api/video/compose

interface VideoComposeRequest {
  audioUrl: string
  lyrics: string
  template: string
  dialect: DialectType
  festival?: Festival        // 节日主题（可选）
  customStyle?: {
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
  }
}

interface VideoComposeResponse {
  videoUrl: string
  duration: number
  thumbnailUrl: string
}
```

---

## 七、成本分析

### 7.1 开发成本对比

| 方案 | 开发周期 | 人力成本 | 说明 |
|------|----------|----------|------|
| **从零开发** | 6-8 周 | 高 | 需要实现视频生成、字幕、TTS 等全部模块 |
| **基于 MoneyPrinterTurbo** | **3-5 周** | **低** | 只需开发方言 TTS、热点模块，其他复用 |

### 7.2 开发工作量明细（基于 MoneyPrinterTurbo 改造）

| 模块 | 工作量 | 说明 |
|------|--------|------|
| 环境搭建 | 2-3 天 | MoneyPrinterTurbo + CosyVoice 部署 |
| 方言 TTS 集成 | 3-5 天 | CosyVoice API 封装 + 集成 |
| 节日识别 | 1-2 天 | 配置 + 农历计算 |
| 热点搜索 | 2-3 天 | API 集成 + 缓存 |
| 歌词增强 | 1-2 天 | Prompt 重构 |
| Rap 节奏同步 | 3-4 天 | 节拍检测 + 字幕对齐 |
| 与 WhyFire 集成 | 2-3 天 | API 路由 + 前端 |
| 测试与优化 | 3-5 天 | 端到端测试 |
| **总计** | **3-5 周** | |

### 7.3 运营成本对比

| 方案 | 月成本 | 方言数 | 可控性 | 歌词质量 |
|------|--------|--------|--------|----------|
| **Mureka API** | $1000+ | 2种 | 低 | 一般 |
| **MiniMax API** | ~$100 | 3种 | 低 | 一般 |
| **自研方案 (MPT)** | **$60-200** | **18+种** | **高** | **高(热点融合)** |

### 7.4 自研方案成本明细

| 项目 | 成本/月 | 说明 |
|------|---------|------|
| GPU 服务器 (CosyVoice) | $50-150 | 按需使用，可本地部署 |
| 热点 API (Serper) | $0-20 | 可用免费方案 |
| 存储 CDN | $10-30 | 视频/音频存储 |
| LLM API (Claude) | $20-50 | 歌词生成 |
| **总计** | **$80-250** | 随使用量线性增长 |

### 7.5 ROI 分析

假设每月生成 1000 个视频：

| 方案 | 月成本 | 单视频成本 | 方言选择 |
|------|--------|------------|----------|
| Mureka | $1000+ | $1.00+ | 2 种 |
| **自研** | $80-250 | $0.08-0.25 | **18+ 种** |

**节省比例：75-92%**

---

## 八、实施路线图（基于 MoneyPrinterTurbo 改造）

### 8.1 Phase 1: 基础搭建 (Week 1)

```
Phase 1: 环境搭建与核心改造 (Week 1)
├── Day 1-2: MoneyPrinterTurbo 部署
│   ├── Clone 项目并本地部署
│   ├── 配置环境变量和 API Keys
│   ├── 测试基础视频生成功能
│   └── 验证所有依赖正常
│
├── Day 3-4: 代码结构分析
│   ├── 梳理核心模块依赖关系
│   ├── 识别需要改造的文件
│   ├── 设计方言 TTS 接口
│   └── 设计热点服务接口
│
└── Day 5-7: Fun-CosyVoice3 部署
    ├── Docker 镜像拉取/构建
    ├── 模型下载和配置
    ├── API 服务启动
    └── 18 种方言效果测试
```

### 8.2 Phase 2: 方言 TTS 集成 (Week 2)

```
Phase 2: 方言 TTS 集成 (Week 2)
├── Day 1-2: TTS 服务封装
│   ├── 创建 dialect_tts_service.py
│   ├── 实现 CosyVoice API 调用
│   ├── 添加方言映射配置
│   └── 单元测试
│
├── Day 3-4: 集成到 MoneyPrinterTurbo
│   ├── 修改 audio_service.py
│   ├── 添加方言参数传递
│   ├── 实现自动降级（方言失败回退到标准 TTS）
│   └── 集成测试
│
└── Day 5-7: 音色优化
    ├── 收集各地方言音色样本
    ├── 配置默认音色映射
    ├── 语速和情感参数调优
    └── 生成效果验收
```

### 8.3 Phase 3: 热点 + 节日融合 (Week 3)

```
Phase 3: 热点 + 节日融合 (Week 3)
├── Day 1-2: 节日识别服务
│   ├── 创建 festival_service.py
│   ├── 配置节日数据（含农历计算）
│   ├── 实现时间上下文识别
│   └── 单元测试
│
├── Day 3-4: 热点搜索服务
│   ├── 集成 Serper/Web Search API
│   ├── 实现热点搜索和缓存
│   ├── 添加网络热梗获取
│   └── 错误处理和降级
│
└── Day 5-7: Prompt 增强
    ├── 修改 script_service.py
    ├── 创建 enhanced_prompt_builder.py
    ├── 融合节日 + 热点 + 热梗
    └── 生成效果测试和调优
```

### 8.4 Phase 4: Rap 节奏同步 (Week 4)

```
Phase 4: Rap 节奏同步 (Week 4)
├── Day 1-2: 节拍检测
│   ├── 集成 librosa/essentia
│   ├── 实现 BPM 检测
│   ├── 实现节拍点提取
│   └── 测试不同风格音乐
│
├── Day 3-4: 字幕时间轴对齐
│   ├── 创建 subtitle_sync_service.py
│   ├── 实现歌词到节拍对齐算法
│   ├── 添加手动微调接口
│   └── 效果验证
│
└── Day 5-7: 整体集成
    ├── 与 MoneyPrinterTurbo 视频合成集成
    ├── 端到端流程测试
    ├── 性能优化
    └── Bug 修复
```

### 8.5 Phase 5: 上线与优化 (Week 5)

```
Phase 5: 上线与优化 (Week 5)
├── Day 1-2: 部署上线
│   ├── 生产环境 Docker Compose 配置
│   ├── Nginx 反向代理配置
│   ├── 监控和日志配置
│   └── 灰度发布
│
├── Day 3-4: 与 WhyFire 集成
│   ├── WhyFire API 路由改造
│   ├── 前端界面更新
│   ├── 用户测试
│   └── 反馈收集
│
└── Day 5-7: 优化迭代
    ├── 根据反馈优化效果
    ├── 性能调优
    ├── 文档完善
    └── 正式发布
```

### 8.6 里程碑与交付物

| 里程碑 | 时间 | 交付物 | 验收标准 |
|--------|------|--------|----------|
| M1: 环境就绪 | Week 1 | 部署文档、测试报告 | MoneyPrinterTurbo + CosyVoice 正常运行 |
| M2: 方言可用 | Week 2 | 方言 TTS 模块 | 5 种以上方言测试通过 |
| M3: 歌词增强 | Week 3 | 热点服务模块 | 热点融合歌词生成成功 |
| M4: 节奏同步 | Week 4 | 字幕同步模块 | 歌词与节拍对齐误差 < 100ms |
| M5: 正式发布 | Week 5 | 完整平台 | 端到端流程跑通，用户可使用 |

---

## 九、参考资源

### 9.1 核心开源项目

| 项目 | GitHub | Stars | 说明 |
|------|--------|-------|------|
| **MoneyPrinterTurbo** | [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | 15K+ | **基础项目**，视频生成一站式 |
| Fun-CosyVoice3 | [modelscope/Fun-CosyVoice](https://github.com/modelscope/Fun-CosyVoice) | 5K+ | 18种方言TTS |
| GPT-SoVITS | [RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) | 30K+ | 音色克隆 |
| Step-Audio | [stepfun-ai/step-audio](https://github.com/stepfun-ai/step-audio) | 新 | 支持方言 + Rap |
| DiffSinger | [openvpi/DiffSinger](https://github.com/openvpi/DiffSinger) | 5K+ | 歌唱合成 |
| AudioCraft | [facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft) | 20K+ | Meta音乐生成 |

### 9.2 MoneyPrinterTurbo 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 视频生成 | ✅ | 基于 MoviePy + FFmpeg |
| 字幕生成 | ✅ | 支持 ASR 自动字幕 |
| TTS 语音 | ✅ | Azure/Edge TTS（需替换为方言 TTS） |
| LLM 脚本 | ✅ | GPT/Claude（需增强热点模块） |
| 背景音乐 | ✅ | 多种风格 BGM |
| 素材管理 | ✅ | 本地/CDN 素材库 |
| Web UI | ✅ | Streamlit 界面 |
| API | ✅ | FastAPI RESTful |

### 9.3 商业参考

| 服务 | 价格 | 方言支持 | 对比 |
|------|------|----------|------|
| Mureka | $1000+/月 | 东北话、四川话 | ❌ 已弃用 |
| MiniMax | 按量计费 | 普通话、粤语、英语 | 可作为备选 |
| **自研方案** | $60-200/月 | **18+ 种** | ✅ 推荐 |

---

## 十、总结

### 10.1 核心价值

1. **成本低**：自研方案 $60-200/月 vs 商业 API $1000+/月
2. **方言多**：18+ 种方言，覆盖中国主要地区
3. **质量高**：融合热点+节日，歌词更有传播力
4. **可控强**：完全自主控制，可按需定制
5. **开发快**：基于 MoneyPrinterTurbo 改造，节省 60-70% 开发时间

### 10.2 关键决策

| 决策点 | 推荐方案 | 理由 |
|--------|----------|------|
| **基础框架** | MoneyPrinterTurbo | 功能完善，社区活跃，易扩展 |
| 歌词生成 | 热点+节日融合 | 增加时效性和传播力 |
| 音乐生成 | 方言TTS (CosyVoice) | 成本低、方言多、效果好 |
| 视频合成 | MoneyPrinterTurbo + Remotion | 核心用 MPT，高级特效用 Remotion |
| 部署方式 | Docker Compose + GPU | 一键部署，灵活可控 |

### 10.3 风险与应对

| 风险 | 应对措施 |
|------|----------|
| CosyVoice 部署复杂 | 提供 Docker 一键部署方案 |
| 热点 API 限流/不稳定 | 多源备份 + 本地缓存 + 降级策略 |
| 节奏同步精度不足 | 参考成熟开源方案，持续优化 |
| MoneyPrinterTurbo 更新冲突 | Fork 项目，定期同步上游更新 |

### 10.4 下一步行动

1. **立即开始**：Clone MoneyPrinterTurbo，本地部署测试
2. **Week 1 结束**：完成环境搭建，CosyVoice 部署就绪
3. **Week 2 结束**：方言 TTS 集成完成，可生成方言语音
4. **Week 3 结束**：热点 + 节日模块完成，歌词质量提升
5. **Week 5 结束**：完整平台上线，用户可使用

---

## 附录 A：MoneyPrinterTurbo 快速开始

```bash
# 1. Clone 项目
git clone https://github.com/harry0703/MoneyPrinterTurbo.git
cd MoneyPrinterTurbo

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Keys

# 4. 启动 Web UI
python webui.py

# 5. 启动 API 服务
python main.py
```

## 附录 B：Fun-CosyVoice3 快速部署

```bash
# 1. 拉取 Docker 镜像
docker pull funaudiollm/cosyvoice:latest

# 2. 启动服务
docker run -d \
  --name cosyvoice \
  --gpus all \
  -p 8001:8001 \
  -v ./models:/app/models \
  funaudiollm/cosyvoice:latest

# 3. 测试 API
curl -X POST http://localhost:8001/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "你好世界", "dialect": "sc"}' \
  --output test.wav
```

---

*文档结束 - v2.0 - 基于 MoneyPrinterTurbo 改造方案*
