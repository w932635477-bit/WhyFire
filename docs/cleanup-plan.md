# 代码清理计划

## 背景

根据最新技术决策（2026-03-27），项目采用 **Suno + Seed-VC** 方案：

| 功能 | 当前方案 | 状态 |
|------|----------|------|
| Rap 生成 | Suno API (Evolink 代理) | ✅ 使用中 |
| 歌词生成 | Claude API (Evolink 代理) | ✅ 使用中 |
| 人声分离 | LALAL.AI API | 🔄 待集成 |
| 音色替换 | **Seed-VC** (Modal GPU) | ✅ 已部署 |
| 方言 TTS | CosyVoice 3 | ⚠️ 可选 |
| 音乐生成 | MiniMax | ❌ 已废弃 |
| Fish Audio TTS | - | ❌ 已废弃 |

**关键理解**：项目是"方言 Rap 生成系统"，采用 5 步流程：
1. Claude 生成歌词
2. Suno 生成 Rap（人声+随机BGM）
3. LALAL.AI 分离人声
4. Seed-VC 替换为用户音色
5. FFmpeg 与固定 BGM 混音

---

## Phase 1-3: 已完成的清理

✅ 已移除 MiniMax 模块
✅ 已移除 Fish Audio TTS 客户端
✅ 已更新相关导出和 API 路由

---

## Phase 4: 清理环境变量

### 4.1 `.env.local` 状态

**当前保留（仍在使用）**：
```env
EVOLINK_API_KEY=xxx          # Claude 歌词生成 + Sora 视频
MINIMAX_API_KEY=xxx          # ⚠️ 待确认是否仍需要
SUNO_API_KEY=xxx             # ✅ Rap 生成（核心）
DASHSCOPE_API_KEY=xxx        # CosyVoice 3（可选）
```

**已添加（新）**：
```env
SEEDVC_BACKEND=modal
MODAL_WEB_ENDPOINT_URL=https://w932635477--seed-vc-real-seedvc-convert.modal.run
```

---

## Phase 5: 清理类型定义

### 5.1 ✅ 已完成

- 移除 `fishAudioVoiceId` 字段
- 移除 `DIALECT_VOICE_MAP` 导出
- 更新 `src/types/__tests__/dialect.test.ts`
- 更新 `tests/unit/dialect.test.ts`

---

## Phase 6: 验证

| 检查项 | 状态 | 说明 |
|--------|------|------|
| TypeScript 编译 | ⚠️ | 测试文件有非阻塞错误 |
| 单元测试 | ⏳ | 运行时间较长 |
| 开发服务器 | ✅ | 正常运行在端口 3001 |
| Seed-VC Health | ✅ | Modal 端点正常 |
| Seed-VC Convert | ✅ | API 可响应请求 |

---

## 更新后的项目结构

```
src/lib/
├── ai/                    # Claude API（歌词生成）
│   ├── claude-client.ts
│   └── prompts/
├── audio/                 # 音频处理
│   ├── seed-vc-client.ts  # Seed-VC 零样本声音克隆
│   ├── rhythm-adaptor.ts  # 节奏对齐（备用）
│   └── ...
├── music/                 # 音乐路由
│   ├── suno-client.ts     # Suno Rap 生成
│   └── music-router.ts
├── serverless/            # Serverless 客户端
│   └── modal-client.ts
└── ...
```

---

## 执行清单（更新）

| # | 操作 | 文件 | 状态 |
|---|------|------|------|
| 1 | 删除 | `src/lib/minimax/` | ✅ 已完成 |
| 2 | 删除 | `src/lib/music/suno-client.ts` | ❌ 保留（核心功能） |
| 3 | 删除 | `src/lib/tts/fish-audio-client.ts` | ✅ 已完成 |
| 4 | 删除 | `src/lib/tts/__tests__/fish-audio-client.test.ts` | ✅ 已完成 |
| 5 | 删除 | `src/app/api/music/route.ts` | ✅ 已完成 |
| 6 | 更新 | `src/lib/tts/index.ts` | ✅ 已完成 |
| 7 | 更新 | `src/lib/music/music-router.ts` | ✅ 已完成 |
| 8 | 更新 | `src/app/api/music/generate/route.ts` | ✅ 已完成 |
| 9 | 更新 | `.env.local` | ⚠️ 需确认 MINIMAX |
| 10 | 更新 | `src/types/dialect.ts` | ✅ 已完成（移除 fishAudioVoiceId） |
| 11 | 验证 | TypeScript 编译 | ⚠️ 测试文件有小错误 |
| 12 | 验证 | Seed-VC Modal | ✅ 已部署验证 |

---

*创建时间: 2026-03-22*
*最后更新: 2026-03-27*
