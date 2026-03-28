# WhyFire

> AI 方言 Rap 生成器 - 录制声音，生成你的专属方言 Rap

## 功能

- 8 种方言支持：普通话、粤语、四川话、东北话、陕西话、吴语、闽南语、天津话
- AI 生成 Rap 歌词（Claude）
- AI 生成 Rap 人声 + BGM（Suno Add Vocals）
- 零样本声音克隆（Seed-VC）
- 声音复刻注册（CosyVoice）

## 技术栈

- **前端**: Next.js 15 + React 18 + TypeScript + Tailwind CSS
- **AI 歌词**: Claude API (Anthropic)
- **音乐生成**: SunoAPI (Add Vocals)
- **声音克隆**: Seed-VC (Modal GPU) + CosyVoice (阿里云 DashScope)
- **文件存储**: 阿里云 OSS
- **方言支持**: 8 种中国方言

## 快速开始

```bash
pnpm install
cp .env.example .env.local
# 编辑 .env.local 填入 API Keys
pnpm dev
```

## 环境变量

| 变量名 | 用途 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude API（歌词生成） |
| `SUNOAPI_API_KEY` | SunoAPI（Rap 音乐生成） |
| `SEEDVC_ENDPOINT` | Seed-VC Modal 端点 URL |
| `DASHSCOPE_API_KEY` | CosyVoice 声音复刻 |
| `OSS_ACCESS_KEY_ID` | 阿里云 OSS |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS |
| `OSS_BUCKET` | 阿里云 OSS Bucket |

## 用户流程

1. 录制或上传声音样本（用于声音克隆）
2. 选择方言和 BGM
3. 输入创意描述（AI 自动生成歌词）
4. AI 生成 Rap（Suno 在 BGM 上合成人声）
5. 声音替换（Seed-VC 将人声替换为用户声音）
6. 预览和下载

## 生成管道

```
用户描述 → Claude 生成歌词 → Suno Add Vocals（BGM + 人声）→ Seed-VC 音色替换 → 成品音频
```

## 许可证

MIT
