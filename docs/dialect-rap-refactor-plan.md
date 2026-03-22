# 方言Rap生成系统 - 项目重构方案

## 一、重构概览

### 1.1 核心变化

| 模块 | 现有方案 | 新方案 | 变化程度 |
|------|---------|--------|----------|
| 用户身份 | SMS认证 + Supabase | 游客模式 + 微信扫码 | 🔴 重构 |
| 声音克隆 | 无 | GPT-SoVITS | 🟢 新增 |
| 人声分离 | 无 | Demucs | 🟢 新增 |
| 方言支持 | 19种 → 8种 | 精简 | 🟡 调整 |
| 音乐生成 | Suno API | 自研 Rhythm Adaptor | 🔴 替换 |
| TTS引擎 | Fish Audio | CosyVoice 3 API | 🟡 替换 |
| 歌词生成 | 多场景多风格 | 固定搞笑风格 | 🟡 调整 |
| Beat管理 | AI生成 | 用户上传 | 🔴 重构 |

### 1.2 重构原则

1. **渐进式重构**：保留可用的模块，逐步替换
2. **模块化设计**：新模块独立，便于测试
3. **向后兼容**：暂不删除旧代码，标记为 deprecated
4. **配置驱动**：通过配置切换新旧方案

---

## 二、文件级修改清单

### 2.1 需要新增的文件 ✅

#### 核心模块 (src/lib/)

```
src/lib/
├── voice/                          # 声音模块 (新增)
│   ├── voice-cloner.ts             # GPT-SoVITS 集成
│   ├── video-processor.ts          # 视频处理 + 人声分离
│   ├── audio-quality-checker.ts    # 音频质量检测
│   └── types.ts
│
├── tts/                            # TTS模块 (重构)
│   ├── cosyvoice-client.ts         # CosyVoice 3 API 客户端
│   └── types.ts                    # (保留，更新类型)
│
├── rhythm-adaptor/                 # 自研核心 (新增)
│   ├── index.ts                    # 主入口
│   ├── syllable-splitter.ts        # 音节切分
│   ├── beat-aligner.ts             # 节奏对齐
│   ├── time-stretcher.ts           # 时间拉伸
│   ├── humanizer.ts                # 人性化处理
│   └── types.ts
│
├── auth/                           # 认证模块 (新增)
│   ├── guest-manager.ts            # 游客模式管理
│   ├── wechat-oauth.ts             # 微信扫码登录
│   └── types.ts
│
└── beat/                           # Beat管理 (新增)
    ├── beat-manager.ts             # Beat上传/分析
    ├── bpm-detector.ts             # BPM检测
    └── types.ts
```

#### API路由 (src/app/api/)

```
src/app/api/
├── voice/                          # 声音相关 (新增)
│   ├── upload/route.ts             # 上传录音/视频
│   ├── clone/route.ts              # 声音克隆
│   └── status/route.ts             # 克隆状态
│
├── beat/                           # Beat管理 (新增)
│   ├── upload/route.ts             # 上传Beat
│   └── analyze/route.ts            # BPM分析
│
├── rap/                            # Rap生成 (新增)
│   ├── generate/route.ts           # 生成方言Rap
│   └── status/route.ts             # 生成状态
│
└── auth/                           # 认证 (重构)
    ├── guest/route.ts              # 游客身份
    └── wechat/route.ts             # 微信扫码
```

#### 组件 (src/components/)

```
src/components/features/
├── voice/                          # 声音采集 (新增)
│   ├── voice-recorder.tsx          # 录音组件
│   ├── video-uploader.tsx          # 视频上传
│   └── voice-status.tsx            # 克隆状态显示
│
├── beat/                           # Beat管理 (新增)
│   ├── beat-uploader.tsx           # Beat上传
│   └── beat-library.tsx            # Beat库
│
└── rap/                            # Rap生成 (新增)
    ├── rap-generator.tsx           # Rap生成主组件
    └── preview-player.tsx          # 预览播放器
```

### 2.2 需要修改的文件 📝

#### 类型定义

| 文件 | 修改内容 |
|------|---------|
| `src/types/dialect.ts` | 精简到8种方言，移除其他11种 |
| `src/types/index.ts` | 新增声音克隆、Beat相关类型 |

#### 现有模块

| 文件 | 修改内容 |
|------|---------|
| `src/lib/ai/claude-client.ts` | 调整prompt为固定搞笑风格 |
| `src/lib/music/music-router.ts` | 标记 deprecated，保留备用 |
| `src/lib/music/suno-client.ts` | 标记 deprecated，保留备用 |
| `src/lib/tts/fish-audio-client.ts` | 标记 deprecated，保留备用 |
| `src/lib/audio/beat-detector.ts` | 迁移到 `lib/beat/bpm-detector.ts` |
| `src/lib/audio/timestamp-mapper.ts` | 迁移到 `lib/rhythm-adaptor/` |

#### 页面

| 文件 | 修改内容 |
|------|---------|
| `src/app/create/page.tsx` | 重构创建流程，适配新功能 |
| `src/app/page.tsx` | 更新Landing Page内容 |

### 2.3 需要废弃的文件 (标记 deprecated，暂不删除)

```
src/lib/minimax/                    # MiniMax 音乐生成 (P2再评估)
src/lib/wechat-pay/                 # 微信支付 (P2再做)
src/lib/subscription/               # 订阅系统 (P2再做)
src/lib/credits/                    # 积分系统 (P2再做)
src/app/api/payments/               # 支付API (P2再做)
src/app/api/subscription/           # 订阅API (P2再做)
src/app/api/credits/                # 积分API (P2再做)
```

---

## 三、数据结构变更

### 3.1 新增数据类型

```typescript
// src/lib/voice/types.ts
export interface VoiceProfile {
  userId: string;
  modelId: string;          // GPT-SoVITS 模型ID
  audioSamplePath: string;  // 原始音频样本
  quality: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt: Date;          // 7天/30天过期
}

// src/lib/beat/types.ts
export interface BeatFile {
  id: string;
  userId: string;
  filename: string;
  bpm: number;
  duration: number;
  url: string;
  createdAt: Date;
}

// src/lib/rhythm-adaptor/types.ts
export interface RhythmConfig {
  bpm: number;
  swing: number;           // 摇摆感 0-1
  humanize: number;        // 人性化程度 0-1
  groove: 'straight' | 'swing' | 'triplet';
}

// src/lib/auth/types.ts
export interface GuestUser {
  id: string;
  createdAt: Date;
  expiresAt: Date;         // 7天后过期
  voiceProfile?: VoiceProfile;
}

export interface WechatUser {
  openid: string;
  unionid?: string;
  voiceProfile?: VoiceProfile;
  createdAt: Date;
  lastActiveAt: Date;
}
```

### 3.2 方言精简

```typescript
// src/types/dialect.ts (修改后)
export const SUPPORTED_DIALECTS = [
  { id: 'mandarin', name: '普通话', cosyvoiceId: 'zh' },
  { id: 'cantonese', name: '粤语', cosyvoiceId: 'yue' },
  { id: 'sichuan', name: '四川话', cosyvoiceId: 'sc' },
  { id: 'dongbei', name: '东北话', cosyvoiceId: 'ne' },
  { id: 'shandong', name: '山东话', cosyvoiceId: 'sd' },
  { id: 'shanghai', name: '上海话', cosyvoiceId: 'sh' },
  { id: 'henan', name: '河南话', cosyvoiceId: 'ha' },
  { id: 'hunan', name: '湖南话', cosyvoiceId: 'hn' },
] as const;

// 移除: 闽南语、客家话、山西话、赣语、兰银、江淮、西南、胶辽、中原
```

---

## 四、重构阶段规划

### Phase 1: 核心功能开发 (Week 1)

#### Day 1-2: 声音模块
- [ ] 实现 `VideoProcessor` (视频处理 + Demucs人声分离)
- [ ] 实现 `VoiceCloner` (GPT-SoVITS集成)
- [ ] 实现 `AudioQualityChecker` (音频质量检测)
- [ ] 新建API路由 `/api/voice/*`

#### Day 3-4: TTS + 方言
- [ ] 实现 `CosyVoiceClient` (CosyVoice 3 API)
- [ ] 精简方言配置到8种
- [ ] 测试8种方言TTS效果

#### Day 5-7: Rhythm Adaptor (核心)
- [ ] 实现 `SyllableSplitter` (音节切分)
- [ ] 实现 `BeatAligner` (节奏对齐)
- [ ] 实现 `TimeStretcher` (时间拉伸)
- [ ] 实现 `Humanizer` (人性化处理)
- [ ] 集成测试

### Phase 2: 用户系统 + UI (Week 2)

#### Day 8-9: 用户系统
- [ ] 实现游客模式 (`GuestManager`)
- [ ] 实现微信扫码登录 (`WechatOAuth`)
- [ ] 本地存储 + 过期逻辑

#### Day 10-12: 前端组件
- [ ] 声音采集组件 (`VoiceRecorder`, `VideoUploader`)
- [ ] Beat管理组件 (`BeatUploader`, `BeatLibrary`)
- [ ] Rap生成组件 (`RapGenerator`)
- [ ] 重构创建流程页面

#### Day 13-14: 集成测试
- [ ] 端到端测试
- [ ] 性能优化
- [ ] Bug修复

---

## 五、重构后的目录结构

```
src/
├── app/
│   ├── page.tsx                    # Landing (更新)
│   ├── create/page.tsx             # 创建流程 (重构)
│   ├── api/
│   │   ├── voice/                  # 声音API (新增)
│   │   ├── beat/                   # Beat API (新增)
│   │   ├── rap/                    # Rap生成API (新增)
│   │   ├── auth/                   # 认证API (重构)
│   │   └── lyrics/                 # 歌词API (保留)
│   └── ...
│
├── components/
│   ├── features/
│   │   ├── voice/                  # 声音采集 (新增)
│   │   ├── beat/                   # Beat管理 (新增)
│   │   ├── rap/                    # Rap生成 (新增)
│   │   ├── dialect-selector.tsx    # (更新)
│   │   └── ...
│   └── ...
│
├── lib/
│   ├── voice/                      # 声音模块 (新增)
│   ├── tts/                        # TTS (重构)
│   ├── rhythm-adaptor/             # 自研核心 (新增)
│   ├── auth/                       # 认证 (新增)
│   ├── beat/                       # Beat (新增)
│   ├── ai/                         # Claude (更新prompt)
│   │
│   ├── music/                      # (deprecated，保留)
│   ├── minimax/                    # (deprecated，保留)
│   ├── wechat-pay/                 # (deprecated，保留)
│   └── ...
│
├── types/
│   ├── dialect.ts                  # (精简到8种)
│   ├── voice.ts                    # (新增)
│   ├── beat.ts                     # (新增)
│   ├── rhythm.ts                   # (新增)
│   └── ...
│
└── stores/
    ├── video-creation-store.ts     # (更新)
    └── voice-store.ts              # (新增)
```

---

## 六、依赖变更

### 6.1 新增依赖

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",     // Claude API (已有)
    "demucs": "^4.0.0",                  // 人声分离 (新增)
    "rubberband": "^3.0.0",              // 时间拉伸 (新增)
    "qrcode": "^1.5.0",                  // 微信扫码 (新增)
    "uuid": "^9.0.0"                     // 游客ID生成 (新增)
  }
}
```

### 6.2 移除依赖 (暂不删除，P2评估)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "...",     // P2再评估
    "fish-audio-sdk": "..."              // 替换为 CosyVoice
  }
}
```

---

## 七、环境变量更新

```env
# .env.local (新增)

# CosyVoice 3 API
COSYVOICE_API_KEY=your_api_key
COSYVOICE_MODEL=cosyvoice-v3-flash

# GPT-SoVITS (声音克隆)
GPT_SOVITS_API_URL=http://your-gpu-server:9880
GPT_SOVITS_MODEL=default

# 微信开放平台
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_secret

# Demucs (人声分离)
DEMUCS_MODEL=htdemucs

# (保留)
EVO_API_KEY=your_evolink_key
ANTHROPIC_API_KEY=your_claude_key
```

---

## 八、风险评估

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| Rhythm Adaptor效果不佳 | 高 | 保留Suno作为备选方案 |
| CosyVoice API变更 | 中 | 封装适配层 |
| GPT-SoVITS部署复杂 | 中 | 使用云GPU按需付费 |
| 微信登录审核 | 低 | MVP先用游客模式 |

---

## 九、执行建议

### 9.1 分支策略

```bash
# 创建重构分支
git checkout -b feature/dialect-rap-refactor

# 按阶段提交
git checkout -b feature/voice-module
git checkout -b feature/tts-refactor
git checkout -b feature/rhythm-adaptor
git checkout -b feature/auth-refactor
```

### 9.2 渐进式重构

1. **第一步**：新增模块，不删除旧代码
2. **第二步**：通过配置开关切换新旧方案
3. **第三步**：测试稳定后再删除旧代码

### 9.3 配置开关

```typescript
// src/config/features.ts
export const FEATURES = {
  USE_NEW_VOICE_SYSTEM: true,
  USE_RHYTHM_ADAPTOR: true,
  USE_COSYVOICE_TTS: true,
  USE_GUEST_MODE: true,
  USE_WECHAT_LOGIN: true,

  // 旧方案 (备用)
  USE_SUNO_MUSIC: false,
  USE_FISH_AUDIO_TTS: false,
  USE_SMS_AUTH: false,
};
```

---

*文档版本: v1.0*
*创建时间: 2026-03-21*
*状态: 待执行*
