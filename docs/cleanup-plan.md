# 代码清理计划

## 背景

根据需求文档 `/docs/dialect-rap-requirements.md`，项目技术栈已确定：

| 功能 | 正确方案 | 旧方案（需清理） |
|------|----------|------------------|
| 声音克隆 | GPT-SoVITS | - |
| 方言 TTS | CosyVoice 3 | Fish Audio, Suno |
| 歌词生成 | Claude API | - |
| 音乐生成 | ❌ 不需要 | Suno, MiniMax |

**关键理解**：项目是"方言 Rap 生成系统"，不是"音乐生成系统"。用户上传自己的 Beat，系统只负责：
1. 克隆用户声音
2. 用克隆的声音唱方言歌词
3. 把人声和用户提供的 Beat 混音

---

## Phase 1: 删除废弃模块

### 1.1 删除 MiniMax 模块

```bash
rm -rf src/lib/minimax/
```

**文件列表**：
- `src/lib/minimax/index.ts`
- `src/lib/minimax/client.ts`
- `src/lib/minimax/types.ts`

**原因**：MiniMax 用于音乐生成，项目不需要音乐生成功能。

---

### 1.2 删除 Suno 客户端

```bash
rm src/lib/music/suno-client.ts
```

**原因**：Suno 用于音乐生成，项目不需要音乐生成功能。

---

### 1.3 删除 Fish Audio TTS 客户端

```bash
rm src/lib/tts/fish-audio-client.ts
rm src/lib/tts/__tests__/fish-audio-client.test.ts
```

**原因**：方言 TTS 已切换到 CosyVoice 3。

---

## Phase 2: 更新导出文件

### 2.1 更新 `src/lib/tts/index.ts`

**Before**:
```typescript
// Fish Audio TTS (保留作为备用)
export { FishAudioClient, getFishAudioClient } from './fish-audio-client'

// CosyVoice TTS (主要 TTS 服务)
export { CosyVoiceClient, ... } from './cosyvoice-client'
```

**After**:
```typescript
// CosyVoice 3 TTS - 方言语音合成
export { CosyVoiceClient, ... } from './cosyvoice-client'
```

---

### 2.2 更新 `src/lib/music/music-router.ts`

**需要移除**：
- `generateWithSuno()` 函数
- `generateWithMiniMax()` 函数
- `generateWithFishAudio()` 函数
- 相关导入

---

## Phase 3: 更新 API 路由

### 3.1 删除旧的音乐 API

```bash
rm src/app/api/music/route.ts
```

**原因**：这是 MiniMax 模拟 API，已废弃。

---

### 3.2 更新 `src/app/api/music/generate/route.ts`

**更新内容**：
- 移除 Suno/MiniMax/Fish Audio 相关注释
- 更新错误处理信息
- 更新 GET 返回的提供商描述

---

## Phase 4: 清理环境变量

### 4.1 更新 `.env.local`

**移除/标记废弃**：
```env
# === 已废弃（技术栈迁移） ===
# MINIMAX_API_KEY=xxx        # 不再使用
# MINIMAX_GROUP_ID=xxx       # 不再使用
# SUNO_API_KEY=xxx           # 不再使用
# FISH_AUDIO_API_KEY=xxx     # 不再使用

# === 当前使用 ===
DASHSCOPE_API_KEY=xxx        # CosyVoice 3
EVOLINK_API_KEY=xxx          # Claude API（歌词生成）
```

---

## Phase 5: 清理类型定义

### 5.1 更新 `src/types/dialect.ts`

检查是否有 Fish Audio 相关的 Voice ID 映射需要移除。

---

## Phase 6: 验证

### 6.1 运行 TypeScript 检查
```bash
npx tsc --noEmit
```

### 6.2 运行测试
```bash
npm test
```

### 6.3 启动开发服务器
```bash
npm run dev
```

---

## 执行清单

| # | 操作 | 文件 | 状态 |
|---|------|------|------|
| 1 | 删除 | `src/lib/minimax/` | ⏳ |
| 2 | 删除 | `src/lib/music/suno-client.ts` | ⏳ |
| 3 | 删除 | `src/lib/tts/fish-audio-client.ts` | ⏳ |
| 4 | 删除 | `src/lib/tts/__tests__/fish-audio-client.test.ts` | ⏳ |
| 5 | 删除 | `src/app/api/music/route.ts` | ⏳ |
| 6 | 更新 | `src/lib/tts/index.ts` | ⏳ |
| 7 | 更新 | `src/lib/music/music-router.ts` | ⏳ |
| 8 | 更新 | `src/app/api/music/generate/route.ts` | ⏳ |
| 9 | 更新 | `.env.local` | ⏳ |
| 10 | 验证 | TypeScript 编译 | ⏳ |

---

## 预期结果

清理后的项目结构：

```
src/lib/
├── ai/                    # Claude API（歌词生成）
│   ├── claude-client.ts
│   └── prompts/
├── audio/                 # 音频处理
│   ├── audio-extractor.ts # 从视频提取音频
│   ├── beat-detector.ts   # BPM 检测
│   └── timestamp-mapper.ts
├── music/                 # 音乐路由
│   ├── index.ts
│   └── music-router.ts    # CosyVoice + GPT-SoVITS
├── tts/                   # 方言 TTS
│   ├── index.ts
│   └── cosyvoice-client.ts
└── voice/                 # 声音克隆
    ├── index.ts
    └── gpt-sovits-client.ts
```

---

*创建时间: 2026-03-22*
