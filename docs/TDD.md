# WhyFire 技术设计文档 (TDD)

> AI 方言 Rap 生成器 - 技术架构

**文档版本**: 2.0
**最后更新**: 2026-03-28

---

## 1. 系统架构

### 1.1 核心管道

```
用户描述 → Claude 生成歌词 → SunoAPI Add Vocals（BGM + 人声）→ Seed-VC 音色替换 → OSS 存储 → 返回音频 URL
```

三步异步管道，由 `RapGeneratorSunoRvc` 编排：

| 步骤 | 服务 | 输入 | 输出 |
|------|------|------|------|
| 歌词生成 | Claude API | 用户描述 + 方言 + BGM 时长 | 歌词文本 |
| Rap 生成 | SunoAPI Add Vocals | BGM URL + 歌词 + 风格标签 | 带人声的音频 URL |
| 音色替换 | Seed-VC (Modal) | Rap 音频 + 用户参考音频 | 替换音色后的音频 |

### 1.2 辅助服务

| 服务 | 用途 |
|------|------|
| CosyVoice (DashScope) | 声音复刻注册，创建可复用音色 ID |
| 阿里云 OSS | 音频文件上传和公网分发 |
| FFmpeg (Node.js) | 音频格式转换、元数据提取 |

## 2. 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | Next.js 15 + React 18 + TypeScript | App Router |
| 样式 | Tailwind CSS + Framer Motion | 深色主题 |
| AI 歌词 | Claude API (Haiku) | 爆款分析版歌词生成 |
| 音乐 | SunoAPI.org | Add Vocals 模式 |
| 声音克隆 | Seed-VC | Modal GPU (A10G)，零样本 |
| 声音注册 | CosyVoice v3.5 | DashScope API |
| 存储 | 阿里云 OSS | 音频文件存储 |

## 3. 目录结构

```
src/
├── app/
│   ├── sonic-gallery/create/      # 创作流程页面
│   │   ├── step-1-voice-cloning.tsx  # 声音录制/上传
│   │   ├── step-2-beat-dialect.tsx   # 方言+BGM选择
│   │   ├── step-3-lyrics-generation.tsx # 歌词编辑
│   │   └── step-4-preview.tsx        # 预览下载
│   └── api/                       # API Routes
│       ├── rap/                   # Rap 生成 API
│       ├── audio-proxy/           # 音频代理
│       └── voice/reference/       # 参考音频上传
├── lib/
│   ├── ai/                        # AI 服务
│   │   ├── claude-client.ts       # Claude API 客户端
│   │   └── prompts/               # 歌词生成 Prompt
│   ├── music/                     # 音乐服务
│   │   ├── suno-api-client.ts     # SunoAPI 客户端
│   │   └── bgm-library.ts        # BGM 库
│   ├── audio/                     # 音频处理
│   │   ├── seed-vc-client.ts      # Seed-VC Modal 客户端
│   │   ├── audio-extractor.ts     # 音频提取（FFmpeg）
│   │   └── audio-validator.ts     # 音频验证
│   ├── tts/
│   │   └── cosyvoice-clone-client.ts  # CosyVoice 声音复刻
│   ├── oss/                       # 阿里云 OSS
│   ├── services/
│   │   └── rap-generator.ts       # Rap 生成编排器
│   └── effects/                   # 特效系统（视频合成用）
├── components/
│   ├── features/                  # 业务组件
│   └── ui/                        # 基础 UI 组件
└── types/                         # TypeScript 类型
```

## 4. 关键模块

### 4.1 RapGeneratorSunoRvc (`src/lib/services/rap-generator.ts`)

核心编排器，单例模式。三步管道：

1. `generateLyrics()` - Claude 生成歌词，根据 BGM 时长约束字数
2. `sunoApiClient.addVocals()` - 在用户 BGM 上生成人声
3. `seedVCClient.convert()` - 零样本音色替换

### 4.2 Seed-VC Client (`src/lib/audio/seed-vc-client.ts`)

Modal GPU 上的 Seed-VC 服务。三个独立端点：
- `*-convert.modal.run` - 提交转换任务
- `*-status.modal.run` - 查询任务状态
- `*-health.modal.run` - 健康检查

异步轮询模式：提交 → 每 3 秒查询 → 完成后获取音频。

### 4.3 SunoAPI Client (`src/lib/music/suno-api-client.ts`)

SunoAPI.org 的 Add Vocals 功能。上传 BGM URL + 歌词 + 风格标签，生成带人声的音频。

### 4.4 CosyVoice Clone Client (`src/lib/tts/cosyvoice-clone-client.ts`)

阿里云 DashScope 的声音复刻服务。注册用户声音，创建可复用音色 ID。

## 5. 环境变量

```bash
# AI 服务
ANTHROPIC_API_KEY=           # Claude API
SUNOAPI_API_KEY=             # SunoAPI

# Seed-VC (Modal)
SEEDVC_ENDPOINT=             # Modal 端点 URL

# 阿里云
DASHSCOPE_API_KEY=           # CosyVoice
OSS_ACCESS_KEY_ID=           # 阿里云 OSS
OSS_ACCESS_KEY_SECRET=       # 阿里云 OSS
OSS_BUCKET=                  # 阿里云 OSS Bucket
OSS_REGION=                  # 阿里云 OSS Region
```

## 6. 网络架构

所有外部服务直连，不使用代理。`setGlobalDispatcher` 全局代理已移除（会破坏 Node.js fetch）。

---

*本文档最后更新于 2026-03-28*
