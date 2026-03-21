# 方言 Rap 平台实施计划

> 执行者：Claude
> 日期：2026-03-21
> 目标：交付完整可用的方言 Rap 视频生成产品

---

## 一、技术选型（最终决策）

| 组件 | 选择 | 说明 |
|------|------|------|
| 框架 | Next.js (WhyFire 现有) | 无需学习新技术 |
| 歌词生成 | Claude API (已有) | 增强热点+节日模块 |
| 方言 TTS | Fish Audio API | 18+ 方言，云端 API |
| 视频合成 | Remotion (已有) | 增强节奏同步 |
| 数据库 | Supabase (已有) | 无需变更 |
| 部署 | Vercel (已有) | 无需变更 |

## 二、方言 TTS 服务选型

### Fish Audio API
- **支持方言**：18+ 种中文方言
- **定价**：$0.006/1000 字符
- **无需 GPU**：云端 API
- **音色克隆**：支持

### API 接入
```
POST https://api.fish.audio/v1/tts
Authorization: Bearer {API_KEY}

{
  "text": "你好世界",
  "voice_id": "sichuan_female_1",
  "format": "mp3"
}
```

## 三、实施步骤

### Phase 1: 方言 TTS 集成 (Day 1-2)
- [ ] 注册 Fish Audio 账号
- [ ] 创建方言 TTS 客户端
- [ ] 实现方言映射
- [ ] 测试 18 种方言

### Phase 2: 热点+节日歌词增强 (Day 3-4)
- [ ] 创建节日服务
- [ ] 创建热点搜索服务
- [ ] 增强歌词生成 Prompt
- [ ] 测试歌词质量

### Phase 3: Rap 节奏同步 (Day 5-6)
- [ ] 实现节拍检测
- [ ] 实现字幕时间轴对齐
- [ ] 集成到视频合成

### Phase 4: 前端集成 (Day 7-8)
- [ ] 方言选择 UI
- [ ] 热点/节日选项 UI
- [ ] 视频生成进度

### Phase 5: 测试上线 (Day 9-10)
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 部署上线

## 四、文件结构

```
src/
├── lib/
│   ├── tts/
│   │   ├── fish-audio-client.ts    # Fish Audio 客户端
│   │   ├── dialect-mapper.ts       # 方言映射
│   │   └── index.ts                # 导出
│   ├── ai/
│   │   ├── context/
│   │   │   ├── festival-service.ts # 节日服务
│   │   │   └── trending-service.ts # 热点服务
│   │   └── prompts/
│   │       └── enhanced-prompts.ts # 增强 Prompt
│   └── video/
│       └── subtitle-sync.ts        # 字幕同步
├── app/
│   └── api/
│       ├── tts/
│       │   └── route.ts            # TTS API
│       └── lyrics/
│           └── generate-v2/
│               └── route.ts        # 增强歌词 API
└── types/
    └── dialect.ts                  # 方言类型定义
```

## 五、成本估算

| 项目 | 月成本 | 说明 |
|------|--------|------|
| Fish Audio TTS | $50-100 | 按 10 万字/月估算 |
| Claude API | $30-50 | 歌词生成 |
| 热点 API | $0-20 | Serper 免费额度 |
| Vercel | $0 | Hobby 计划 |
| Supabase | $0 | 免费额度 |
| **总计** | **$80-170** | 在 $300 预算内 |

