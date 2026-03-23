# C方案：CosyVoice + RVC 技术设计文档

> **目标**：实现真正"唱rap"效果，同时保留用户声音特色
>
> **核心挑战**：如何获得"rap节奏"？

---

## 一、核心原理

### 1.1 问题分析

| 方案 | 节奏来源 | 音色来源 | 效果 |
|------|----------|----------|------|
| 纯CosyVoice TTS | 无节奏 | 用户声音 | 连续语音，像朗读 |
| Rhythm Adaptor | 人工切分+时间拉伸 | 用户声音 | 机械感，有拉伸痕迹 |
| MiniMax/Suno/Udio | 神经网络生成 | 通用声音 | 自然，但不是用户声音 |
| **C方案** | 模板Rap音频 | 用户声音(RVC转换) | 自然rap + 用户声音 |

### 1.2 C方案核心思路

```
┌─────────────────────────────────────────────────────────────────┐
│                      C方案 工作原理                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  输入1: 歌词文本                                                 │
│       ↓                                                         │
│  CosyVoice TTS (复刻音色 + 方言指令)                             │
│       ↓                                                         │
│  用户声音的方言语音 (连续、无节奏)  ←── 用于提取音素对齐信息      │
│                                                                 │
│  输入2: 模板Rap音频 (专业Rapper演唱的参考音频)                   │
│       ↓                                                         │
│  RVC 推理                                                       │
│       ↓                                                         │
│  用户声音的Rap (有节奏、有律动)  ←── 音色来自RVC模型             │
│                                                                 │
│  关键：模板音频提供节奏，RVC转换音色                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 技术选型对比

| 技术 | 作用 | 是否保留用户声音 | 是否有节奏 |
|------|------|------------------|------------|
| CosyVoice TTS | 方言语音生成 | ✅ | ❌ |
| Rhythm Adaptor | 时间拉伸对齐 | ✅ | ⚠️ 机械感 |
| **RVC** | 声音转换 | ✅(模型训练) | ✅(来自源音频) |
| **so-vits-svc** | 歌声转换 | ✅(模型训练) | ✅(来自源音频) |

---

## 二、技术方案设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         C方案：CosyVoice + RVC 架构                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Step 1: 声音采集与模型训练                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  用户音频(≥1分钟) → CosyVoice复刻 → 复刻音色ID (方言TTS用)          │  │
│   │                    → RVC模型训练 → 用户RVC模型 (声音转换用)         │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                   ↓                                         │
│   Step 2: 歌词生成                                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  用户描述 + 热梗 + 热点 → Claude API → 个性化歌词                   │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                   ↓                                         │
│   Step 3: 模板Rap生成（两种子方案）                                         │
│   ┌──────────────────────────────────┬────────────────────────────────┐   │
│   │ 方案3A: 模板Rap库                │ 方案3B: AI生成Rap模板          │   │
│   │ - 预录制通用Rap模板              │ - 使用Suno/Udio/MiniMax API    │   │
│   │ - 多种风格/速度                  │ - 生成带旋律的Rap               │   │
│   │ - 作为节奏参考源                 │ - 作为节奏参考源               │   │
│   └──────────────────────────────────┴────────────────────────────────┘   │
│                                   ↓                                         │
│   Step 4: RVC声音转换                                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  模板Rap音频 + 用户RVC模型 → RVC推理 → 用户声音的Rap                │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                   ↓                                         │
│   Step 5: 混音合成                                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  用户声音Rap + 用户指定Beat → 混音 → 最终成品                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 两种子方案对比

#### 方案3A：模板Rap库（推荐MVP）

```
优点：
- 实现简单，无需第三方API
- 质量可控（模板是专业录制）
- 成本低（无API调用费用）
- 处理速度快

缺点：
- 模板有限，风格固定
- 方言匹配可能不完美
- 需要维护模板库
```

#### 方案3B：AI生成Rap模板

```
优点：
- 风格灵活，可根据歌词生成
- 可以匹配任何方言风格
- 更有创意

缺点：
- 依赖第三方API（Suno/Udio/MiniMax）
- 成本较高
- 可能无法完美保留用户声音特色
- 处理时间较长
```

---

## 三、详细实现

### 3.1 方案3A：模板Rap库 + RVC

#### 3.1.1 模板库设计

```typescript
// 模板Rap库结构
interface RapTemplate {
  id: string;
  name: string;
  bpm: number;
  style: 'passionate' | 'funny' | 'lyrical' | 'energetic';
  duration: number;           // 秒
  audioPath: string;          // 模板音频文件路径
  lyricsTemplate: string;     // 模板歌词（用于对齐）
  syllableCount: number;      // 音节数量
  dialects: Dialect[];        // 适用的方言
}
```

#### 3.1.2 工作流程

```typescript
// src/lib/dialect-rap/c-plan/template-rap-service.ts

export class TemplateRapService {
  private templatesDir: string;
  private rvcEngine: RVCEngine;

  /**
   * 完整流程：歌词 → 模板匹配 → RVC转换 → 混音
   */
  async generateRap(input: GenerateRapInput): Promise<GenerateRapResult> {
    // Step 1: 匹配最适合的模板
    const template = await this.matchTemplate(input.lyrics, input.bpm, input.style);

    // Step 2: 调整模板音频的节奏/BPM（如果需要）
    const adjustedTemplate = await this.adjustTemplate(template, input.bpm);

    // Step 3: RVC声音转换
    const userRapAudio = await this.rvcEngine.convert({
      sourceAudio: adjustedTemplate.audioPath,
      userModelPath: input.userRvcModelPath,
      pitchAdjust: this.calculatePitchAdjust(input.dialect),
    });

    // Step 4: 混音
    const finalAudio = await this.mixWithBeat(userRapAudio, input.beatPath, input.bpm);

    return {
      audioPath: finalAudio,
      template: template.id,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 匹配最适合的模板
   * 考虑因素：音节数、BPM、风格
   */
  private async matchTemplate(
    lyrics: string,
    targetBpm: number,
    style: string
  ): Promise<RapTemplate> {
    const syllableCount = this.countSyllables(lyrics);

    // 从数据库/文件系统加载模板列表
    const templates = await this.loadTemplates();

    // 筛选条件
    const candidates = templates.filter(t =>
      Math.abs(t.syllableCount - syllableCount) < 10 &&  // 音节数接近
      Math.abs(t.bpm - targetBpm) < 10 &&               // BPM接近
      t.style === style                                  // 风格匹配
    );

    if (candidates.length === 0) {
      // 没有完全匹配的，找最接近的
      return this.findClosestTemplate(templates, syllableCount, targetBpm, style);
    }

    // 返回最佳匹配
    return candidates[0];
  }
}
```

#### 3.1.3 RVC引擎封装

```typescript
// src/lib/dialect-rap/c-plan/rvc-engine.ts

import { execSync } from 'child_process';
import path from 'path';

export interface RVCConvertOptions {
  sourceAudio: string;        // 源音频（模板Rap）
  userModelPath: string;      // 用户RVC模型路径
  pitchAdjust?: number;       // 音高调整（半音）
  f0Method?: 'crepe' | 'rmvpe' | 'pm' | 'harvest';
  indexRate?: number;         // 检索特征占比 (0-1)
  filterRadius?: number;      // 过滤半径
  rmsMixRate?: number;        // 均方根混合率
  protectVoiceless?: number;  // 保护清辅音
}

export interface RVCConvertResult {
  outputPath: string;
  processingTime: number;
}

export class RVCEngine {
  private rvcRoot: string;
  private pythonPath: string;
  private tempDir: string;

  constructor(rvcRoot: string, tempDir: string) {
    this.rvcRoot = rvcRoot;
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.tempDir = tempDir;
  }

  /**
   * RVC推理 - 将源音频转换为目标音色
   */
  async convert(options: RVCConvertOptions): Promise<RVCConvertResult> {
    const startTime = Date.now();
    const outputPath = path.join(this.tempDir, `${Date.now()}_converted.wav`);

    // 构建 RVC CLI 命令
    const cmd = [
      `cd ${this.rvcRoot}`,
      '&&',
      this.pythonPath,
      'infer-cli.py',
      `--input "${options.sourceAudio}"`,
      `--output "${outputPath}"`,
      `--model "${options.userModelPath}"`,
      `--f0method ${options.f0Method || 'rmvpe'}`,
      `--pitch ${options.pitchAdjust || 0}`,
      `--index_rate ${options.indexRate || 0.5}`,
      `--filter_radius ${options.filterRadius || 3}`,
      `--rms_mix_rate ${options.rmsMixRate || 0.25}`,
      `--protect ${options.protectVoiceless || 0.33}`,
    ].join(' ');

    execSync(cmd, {
      encoding: 'utf-8',
      timeout: 300000,  // 5分钟超时
      maxBuffer: 100 * 1024 * 1024,
    });

    return {
      outputPath,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 训练用户RVC模型
   * 输入：用户音频（≥10分钟推荐，最低1分钟）
   * 输出：RVC模型文件
   */
  async trainModel(options: {
    audioPath: string;
    modelName: string;
    sampleRate?: number;
    hopLength?: number;
  }): Promise<string> {
    const modelDir = path.join(this.tempDir, 'models', options.modelName);

    // Step 1: 预处理音频
    console.log('[RVC] Step 1: Preprocessing audio...');
    execSync(
      `${this.pythonPath} ${this.rvcRoot}/infer/modules/train/preprocess.py ` +
      `--input "${options.audioPath}" ` +
      `--output "${modelDir}/processed" ` +
      `--sr ${options.sampleRate || 48000}`,
      { timeout: 600000 }
    );

    // Step 2: 提取F0特征
    console.log('[RVC] Step 2: Extracting F0 features...');
    execSync(
      `${this.pythonPath} ${this.rvcRoot}/infer/modules/train/extract_f0.py ` +
      `--input "${modelDir}/processed" ` +
      `--output "${modelDir}/f0"`,
      { timeout: 600000 }
    );

    // Step 3: 训练模型
    console.log('[RVC] Step 3: Training model...');
    execSync(
      `${this.pythonPath} ${this.rvcRoot}/infer/modules/train/train.py ` +
      `--input "${modelDir}" ` +
      `--model_name "${options.modelName}"`,
      { timeout: 3600000 }  // 1小时超时
    );

    return path.join(modelDir, `${options.modelName}.pth`);
  }
}
```

### 3.2 方案3B：AI生成Rap模板 + RVC

```typescript
// src/lib/dialect-rap/c-plan/ai-rap-template-service.ts

export interface AIGenerateTemplateOptions {
  lyrics: string;
  style: string;
  bpm: number;
  dialect: Dialect;
}

export class AIRapTemplateService {
  private minimaxApiKey: string;
  private rvcEngine: RVCEngine;

  constructor() {
    this.minimaxApiKey = process.env.MINIMAX_API_KEY!;
    this.rvcEngine = new RVCEngine(process.env.RVC_ROOT!, process.env.TEMP_DIR!);
  }

  /**
   * 使用 MiniMax 生成 Rap 模板
   */
  async generateTemplate(options: AIGenerateTemplateOptions): Promise<string> {
    const response = await fetch('https://api.minimaxi.com/v1/music_generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.minimaxApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'music-2.5+',
        prompt: this.buildPrompt(options),
        lyrics: options.lyrics,
        audio_setting: {
          sample_rate: 44100,
          bitrate: 256000,
          format: 'mp3',
        },
      }),
    });

    const data = await response.json();
    // 下载音频文件
    const audioBuffer = await this.downloadAudio(data.data.audio_url);

    return this.saveTempFile(audioBuffer);
  }

  private buildPrompt(options: AIGenerateTemplateOptions): string {
    const dialectNames: Record<Dialect, string> = {
      mandarin: '普通话',
      cantonese: '粤语',
      sichuan: '四川话',
      dongbei: '东北话',
      shandong: '山东话',
      wu: '上海话',
      henan: '河南话',
      xiang: '湖南话',
    };

    return `${dialectNames[options.dialect]} Rap, ${options.style}, ${options.bpm} BPM, Hip-hop, energetic, rhythmic`;
  }
}
```

---

## 四、完整流程代码

### 4.1 统一入口

```typescript
// src/lib/dialect-rap/c-plan/index.ts

export interface CPlanInput {
  userId: string;
  voiceModel: {
    cosyvoiceId: string;      // CosyVoice 复刻音色 ID
    rvcModelPath: string;      // RVC 模型路径
  };
  lyrics: string;
  dialect: Dialect;
  beat: {
    path: string;
    bpm: number;
  };
  style: 'passionate' | 'funny' | 'lyrical' | 'energetic';
  mode: 'template' | 'ai-generate';  // 3A 或 3B
}

export interface CPlanResult {
  audioPath: string;
  duration: number;
  processingTime: number;
  details: {
    templateUsed?: string;
    aiGenerated?: boolean;
  };
}

export class CPlanEngine {
  private templateService: TemplateRapService;
  private aiTemplateService: AIRapTemplateService;

  async generate(input: CPlanInput): Promise<CPlanResult> {
    const startTime = Date.now();

    let rapSourceAudio: string;

    if (input.mode === 'template') {
      // 方案3A: 使用模板库
      rapSourceAudio = await this.useTemplateMode(input);
    } else {
      // 方案3B: AI生成模板
      rapSourceAudio = await this.useAIGenerateMode(input);
    }

    // RVC 转换
    const convertedAudio = await this.rvcEngine.convert({
      sourceAudio: rapSourceAudio,
      userModelPath: input.voiceModel.rvcModelPath,
      f0Method: 'rmvpe',
      indexRate: 0.5,
    });

    // 混音
    const finalAudio = await this.mixWithBeat(
      convertedAudio.outputPath,
      input.beat.path,
      input.beat.bpm
    );

    return {
      audioPath: finalAudio,
      duration: await this.getAudioDuration(finalAudio),
      processingTime: Date.now() - startTime,
      details: {
        aiGenerated: input.mode === 'ai-generate',
      },
    };
  }
}
```

---

## 五、依赖与环境

### 5.1 系统依赖

```bash
# Python 3.10+
# PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# RVC 依赖
pip install fairseq
pip install faiss-cpu  # 或 faiss-gpu
pip install librosa
pip install praat-parselmouth
pip install pyworld
pip install scipy
pip install soundfile
pip install torchcrepe

# ffmpeg
# macOS: brew install ffmpeg
# Ubuntu: apt-get install ffmpeg
```

### 5.2 RVC 项目结构

```
/RVC-Project/
├── infer-cli.py              # CLI推理入口
├── infer/
│   └── modules/
│       ├── train/            # 训练模块
│       │   ├── preprocess.py
│       │   ├── extract_f0.py
│       │   └── train.py
│       └── vc/
│           └── infer.py      # 推理模块
├── assets/
│   └── models/               # 预训练模型
└── logs/                     # 训练日志
```

### 5.3 环境变量

```bash
# .env 新增
RVC_ROOT=/path/to/RVC-Project
MINIMAX_API_KEY=xxx              # 方案3B需要
```

---

## 六、MVP实施建议

### 6.1 推荐路线（方案3A优先）

| 阶段 | 内容 | 时间 |
|------|------|------|
| **Phase 1** | 搭建RVC环境，测试基础转换 | 2天 |
| **Phase 2** | 录制/收集模板Rap库（20个模板） | 3天 |
| **Phase 3** | 实现完整流程（模板匹配 + RVC + 混音） | 3天 |
| **Phase 4** | 集成到现有系统，优化用户体验 | 2天 |
| **Phase 5** | （可选）接入MiniMax API实现方案3B | 3天 |

### 6.2 模板库规格（MVP）

| 风格 | BPM范围 | 数量 |
|------|---------|------|
| 激情 | 120-140 | 5 |
| 搞笑 | 80-100 | 5 |
| 抒情 | 70-90 | 5 |
| 通用 | 90-110 | 5 |

每个模板应：
- 时长：30-60秒
- 清晰人声（用于RVC转换）
- 标注音节数和节奏模式

---

## 七、与原v3.1方案对比

| 对比项 | v3.1 Rhythm Adaptor | C方案 RVC |
|--------|---------------------|-----------|
| 节奏来源 | 人工切分+时间拉伸 | 模板/AI生成音频 |
| 自然度 | ⚠️ 机械感 | ✅ 自然 |
| 音色保留 | ✅ 原始TTS音色 | ✅ RVC模型 |
| 实现复杂度 | 中 | 高 |
| 处理时间 | 快（<10秒） | 慢（30-60秒） |
| 额外依赖 | Python音频处理 | RVC + GPU |
| 方言匹配 | ✅ CosyVoice原生 | ⚠️ 依赖模板/生成 |

---

## 八、结论与建议

### 8.1 MVP推荐

**推荐方案3A（模板库 + RVC）**，理由：
1. 实现可控，不依赖第三方API
2. 成本低，处理速度快
3. 质量有保障（模板是专业录制）
4. 可以逐步扩展模板库

### 8.2 长期规划

- **P1**：接入MiniMax/Suno API实现方案3B
- **P2**：训练自有的方言Rap生成模型
- **P3**：优化RVC模型，支持实时转换

---

*文档版本: v1.0*
*创建时间: 2026-03-23*
*状态: 技术方案设计中*
