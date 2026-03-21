# 方言Rap生成系统 - 技术设计文档 v3.0

> 本文档与需求文档 `dialect-rap-requirements.md` 配套，确保技术实现与产品需求完全一致

---

## 一、系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           方言Rap生成系统 v3.0                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   前端层 (PC Web)                                                               │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│   │ 声音采集  │ │ 歌词生成  │ │ 方言选择  │ │ Beat选择  │ │ 结果预览  │        │
│   │ 视频/录音 │ │ 个人描述  │ │ 8种方言   │ │ 上传/库   │ │ 导出下载  │        │
│   └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   API层 (Node.js + TypeScript)                                                  │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │  REST API                                                              │    │
│   │  POST /api/voice/clone       - 声音克隆                                │    │
│   │  POST /api/voice/upload-video - 上传视频                              │    │
│   │  POST /api/lyrics/generate   - 生成歌词                                │    │
│   │  POST /api/rap/generate      - 生成方言Rap                             │    │
│   │  GET  /api/rap/:id           - 获取生成结果                            │    │
│   │  POST /api/auth/wechat       - 微信扫码登录                            │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   核心服务层                                                                     │
│                                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│   │  Voice Service  │  │ Lyrics Service  │  │  Rap Service    │               │
│   │  声音克隆+转换   │  │ 歌词生成(搞笑)  │  │ Rap生成+混音    │               │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘               │
│            │                    │                    │                        │
│            ▼                    ▼                    ▼                        │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│   │ GPT-SoVITS      │  │ Claude API      │  │ Rhythm Adaptor  │               │
│   │ Spleeter/Demucs │  │ (歌词生成)      │  │ (自研核心)      │               │
│   │ (人声分离)      │  │                 │  │                 │               │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘               │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   外部服务层                                                                     │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│   │ CosyVoice API │  │ Claude API    │  │ 微信OAuth     │  │ 阿里云OSS     │  │
│   │ (方言TTS)     │  │ (歌词LLM)     │  │ (扫码登录)    │  │ (文件存储)    │  │
│   └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心流水线

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         用户创作流程                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: 声音采集（二选一）                                                  │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                │
│  │ 📹 上传视频             │    │ 🎤 录音朗读             │                │
│  │ 视频文件 → 提取音轨    │    │ 朗读指定文字           │                │
│  │ → 人声分离 → 纯净人声  │    │ ≥1分钟                 │                │
│  └───────────┬─────────────┘    └───────────┬─────────────┘                │
│              └────────────┬─────────────────┘                              │
│                           ▼                                                 │
│              ┌─────────────────────────┐                                    │
│              │ GPT-SoVITS 声音克隆     │                                    │
│              │ → 用户音色模型          │                                    │
│              └───────────┬─────────────┘                                    │
│                          ▼                                                  │
│  Step 2: 歌词生成                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 用户描述 + 热梗 + 热点话题 + 节日热词                                │   │
│  │                          ↓                                          │   │
│  │              Claude API（搞笑风格）                                  │   │
│  │                          ↓                                          │   │
│  │                   个性化Rap歌词                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          ▼                                                  │
│  Step 3: 方言语音合成                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              CosyVoice API（8种方言）                                │   │
│  │                          ↓                                          │   │
│  │                   方言语音内容                                       │   │
│  │                          ↓                                          │   │
│  │              Voice Converter（用户音色）                             │   │
│  │                          ↓                                          │   │
│  │              用户声音 + 方言发音                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          ▼                                                  │
│  Step 4: Rap节奏处理                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Rhythm Adaptor（自研核心）                              │   │
│  │              - 音节切分                                              │   │
│  │              - 节奏对齐（BPM）                                       │   │
│  │              - 时间拉伸                                              │   │
│  │              - 人性化处理                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          ▼                                                  │
│  Step 5: 混音合成                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │         用户声音Rap + 用户指定Beat                                   │   │
│  │                          ↓                                          │   │
│  │                   混音合成                                           │   │
│  │                          ↓                                          │   │
│  │              最终成品 MP3                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心技术模块

### 2.1 Voice Service（声音服务）

#### 功能概述

| 子模块 | 功能 | 技术方案 |
|--------|------|----------|
| 视频处理 | 上传视频 → 提取音轨 → 人声分离 | ffmpeg + Spleeter/Demucs |
| 录音处理 | 录音文件 → 质量检测 → 预处理 | Python音频处理 |
| 声音克隆 | 用户音频 → 音色模型 | GPT-SoVITS |
| 音色转换 | 方言语音 + 用户音色 | GPT-SoVITS推理 |

#### 2.1.1 视频上传与人声分离

```typescript
// src/lib/dialect-rap/voice-service/video-processor.ts

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface VideoProcessResult {
  audioPath: string;        // 提取的纯净人声路径
  duration: number;         // 时长（秒）
  quality: number;          // 质量评分 0-1
}

export class VideoProcessor {
  private tempDir: string;
  private pythonPath: string;

  constructor(tempDir: string = '/tmp/dialect-rap/video') {
    this.tempDir = tempDir;
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
  }

  /**
   * 处理上传的视频文件
   * 流程：提取音轨 → 人声分离 → 质量检测
   */
  async process(videoPath: string): Promise<VideoProcessResult> {
    const taskId = Date.now().toString();

    // Step 1: 提取音轨
    console.log('[VideoProcessor] Extracting audio track...');
    const audioTrackPath = await this.extractAudio(videoPath, taskId);

    // Step 2: 人声分离（使用 Spleeter 或 Demucs）
    console.log('[VideoProcessor] Separating vocals...');
    const vocalsPath = await this.separateVocals(audioTrackPath, taskId);

    // Step 3: 质量检测
    console.log('[VideoProcessor] Validating audio quality...');
    const quality = await this.validateQuality(vocalsPath);

    if (quality.score < 0.5) {
      throw new Error('音频质量不足，请确保视频中无背景音乐或噪音');
    }

    if (quality.duration < 60) {
      throw new Error('视频时长不足，请上传至少1分钟的视频');
    }

    return {
      audioPath: vocalsPath,
      duration: quality.duration,
      quality: quality.score,
    };
  }

  /**
   * 从视频中提取音轨
   */
  private async extractAudio(videoPath: string, taskId: string): Promise<string> {
    const outputPath = path.join(this.tempDir, `${taskId}_audio.wav`);

    execSync(
      `ffmpeg -y -i "${videoPath}" ` +
      `-vn -acodec pcm_s16le -ar 44100 -ac 1 ` +
      `"${outputPath}"`,
      { stdio: 'pipe' }
    );

    return outputPath;
  }

  /**
   * 人声分离
   * 使用 Demucs（效果更好）或 Spleeter
   */
  private async separateVocals(audioPath: string, taskId: string): Promise<string> {
    const outputDir = path.join(this.tempDir, taskId);

    // 使用 Demucs 进行人声分离
    // Demucs 会将音频分离为：drums, bass, other, vocals
    execSync(
      `${this.pythonPath} -m demucs --two-stems=vocals ` +
      `-o "${outputDir}" "${audioPath}"`,
      { stdio: 'pipe', timeout: 300000 } // 5分钟超时
    );

    // Demucs 输出路径
    const vocalsPath = path.join(outputDir, 'htdemucs', path.basename(audioPath, '.wav'), 'vocals.wav');

    // 检查文件是否存在
    await fs.access(vocalsPath);

    return vocalsPath;
  }

  /**
   * 音频质量检测
   */
  private async validateQuality(audioPath: string): Promise<{
    score: number;
    duration: number;
    issues: string[];
  }> {
    const scriptPath = path.join(__dirname, 'python', 'validate_audio.py');

    const result = execSync(
      `${this.pythonPath} "${scriptPath}" --audio "${audioPath}"`,
      { encoding: 'utf-8' }
    );

    return JSON.parse(result);
  }
}
```

#### 2.1.2 声音克隆（GPT-SoVITS）

```typescript
// src/lib/dialect-rap/voice-service/voice-cloner.ts

import { execSync } from 'child_process';
import path from 'path';

export interface VoiceProfile {
  id: string;
  userId: string;
  modelPath: string;
  sampleDuration: number;
  quality: number;
  createdAt: Date;
  expiresAt: Date;
}

export class VoiceCloner {
  private modelDir: string;
  private pythonPath: string;

  constructor(modelDir: string = '/data/voice-models') {
    this.modelDir = modelDir;
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
  }

  /**
   * 克隆用户声音
   * @param audioPath 用户音频文件（纯净人声）
   * @param userId 用户ID
   * @param text 录音对应的文本（如果是朗读模式）
   */
  async clone(
    audioPath: string,
    userId: string,
    text?: string
  ): Promise<VoiceProfile> {
    const modelPath = path.join(this.modelDir, userId);
    const scriptPath = path.join(__dirname, 'python', 'train_gpt_sovits.py');

    console.log(`[VoiceCloner] Training voice model for user ${userId}...`);

    // 调用 GPT-SoVITS 训练脚本
    const result = execSync(
      `${this.pythonPath} "${scriptPath}" ` +
      `--audio "${audioPath}" ` +
      `--output "${modelPath}" ` +
      (text ? `--text "${text}"` : ''),
      { encoding: 'utf-8', timeout: 600000, maxBuffer: 100 * 1024 * 1024 }
    );

    const response = JSON.parse(result);

    if (response.status !== 'success') {
      throw new Error(`Voice cloning failed: ${response.message}`);
    }

    // 计算过期时间（游客7天，登录用户30天）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 默认7天

    return {
      id: `voice_${userId}_${Date.now()}`,
      userId,
      modelPath: response.model_path,
      sampleDuration: response.duration,
      quality: response.quality,
      createdAt: new Date(),
      expiresAt,
    };
  }

  /**
   * 使用用户音色进行语音合成
   */
  async synthesize(
    text: string,
    voiceProfile: VoiceProfile,
    outputPath: string
  ): Promise<string> {
    const scriptPath = path.join(__dirname, 'python', 'inference_gpt_sovits.py');

    const result = execSync(
      `${this.pythonPath} "${scriptPath}" ` +
      `--model "${voiceProfile.modelPath}" ` +
      `--text "${text}" ` +
      `--output "${outputPath}"`,
      { encoding: 'utf-8', timeout: 120000 }
    );

    const response = JSON.parse(result);
    return response.audio_path;
  }
}
```

#### 2.1.3 Python 训练脚本（GPT-SoVITS）

```python
# src/lib/dialect-rap/voice-service/python/train_gpt_sovits.py

import argparse
import json
import os
import sys

def train_voice_model(audio_path: str, output_path: str, text: str = None):
    """
    使用 GPT-SoVITS 训练用户声音模型
    参考：https://github.com/RVC-Boss/GPT-SoVITS

    最佳实践：
    - 音频时长：≥1分钟
    - 音频质量：安静环境，无背景噪音
    - 如果是指定文本朗读，需提供文本内容
    """
    try:
        from GPT_SoVITS import TTS, Config

        # 1. 加载预训练模型
        config = Config()
        tts = TTS(config)

        # 2. 如果有文本，使用零样本推理
        # 如果没有文本，使用自动转录 + 微调
        if text:
            # 零样本模式：直接使用参考音频
            tts.set_reference_audio(audio_path, text)
            model_info = {
                "mode": "zero_shot",
                "reference_audio": audio_path,
                "reference_text": text
            }
        else:
            # 微调模式：使用 Whisper 转录 + LoRA 微调
            print("Transcribing audio with Whisper...")
            import whisper
            whisper_model = whisper.load_model("base")
            result = whisper_model.transcribe(audio_path, language="zh")
            transcribed_text = " ".join([seg["text"] for seg in result["segments"]])

            # 快速 LoRA 微调
            print("Fine-tuning with LoRA...")
            tts.finetune(
                audio_path=audio_path,
                text=transcribed_text,
                output_dir=output_path,
                epochs=100,
                use_lora=True,
                lora_rank=8
            )
            model_info = {
                "mode": "finetuned",
                "model_path": output_path
            }

        # 3. 获取音频信息
        import librosa
        y, sr = librosa.load(audio_path)
        duration = librosa.get_duration(y=y, sr=sr)

        return {
            "status": "success",
            "model_path": output_path,
            "duration": duration,
            "quality": 0.85,  # 质量评分
            "model_info": model_info
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--text", default=None)
    args = parser.parse_args()

    result = train_voice_model(args.audio, args.output, args.text)
    print(json.dumps(result, ensure_ascii=False))
```

---

### 2.2 Lyrics Service（歌词服务）

#### 功能概述

- **输入**：用户描述 + 热梗 + 热点话题 + 节日热词
- **输出**：搞笑风格的个性化Rap歌词
- **LLM**：Claude API

```typescript
// src/lib/dialect-rap/lyrics-service/index.ts

import Anthropic from '@anthropic-ai/sdk';
import { Dialect, Lyrics } from '../types';

export interface LyricsInput {
  // 用户个人描述
  userProfile: {
    occupation?: string;
    hobbies?: string[];
    selfDescription?: string;
  };

  // 热点内容
  hotContent: {
    trending?: string[];   // 热搜话题（可选）
    memes: string[];       // 热梗
    festival?: string;     // 节日
  };

  // 方言
  dialect: Dialect;
}

export class LyricsService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * 生成搞笑风格的个性化Rap歌词
   * 风格固定为搞笑，不需要用户选择
   */
  async generate(input: LyricsInput): Promise<Lyrics> {
    const prompt = this.buildPrompt(input);

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseLyrics(content.text, input.dialect);
  }

  private buildPrompt(input: LyricsInput): string {
    const { userProfile, hotContent, dialect } = input;

    const dialectNames: Record<Dialect, string> = {
      mandarin: '普通话',
      cantonese: '粤语',
      sichuan: '四川话',
      northeast: '东北话',
      shandong: '山东话',
      shanghai: '上海话',
      henan: '河南话',
      hunan: '湖南话',
    };

    const parts: string[] = [];

    // 用户信息
    parts.push(`你是一位专业的Rap歌词创作人。请创作一段${dialectNames[dialect]}Rap歌词。`);
    parts.push('');
    parts.push('## 用户信息');
    parts.push(`- 职业/身份：${userProfile.occupation || '普通人'}`);
    parts.push(`- 爱好：${userProfile.hobbies?.join('、') || '生活'}`);
    parts.push(`- 想表达的内容：${userProfile.selfDescription || '日常生活'}`);
    parts.push('');

    // 热点话题（可选）
    if (hotContent.trending && hotContent.trending.length > 0) {
      parts.push('## 热点话题（选择1-2个自然融入歌词）');
      hotContent.trending.forEach((t, i) => parts.push(`${i + 1}. ${t}`));
      parts.push('');
    }

    // 热梗
    parts.push('## 热梗（自然融入歌词）');
    parts.push(hotContent.memes.join('、'));
    parts.push('');

    // 节日
    if (hotContent.festival) {
      parts.push(`## 节日相关：${hotContent.festival}`);
      parts.push('');
    }

    // 风格要求
    parts.push('## 风格要求');
    parts.push('- 整体风格：搞笑、幽默、接地气（这是固定风格，不需要更改）');
    parts.push(`- 使用地道的${dialectNames[dialect]}词汇和表达方式`);
    parts.push('- 押韵自然，节奏感强');
    parts.push('- 内容要贴近用户真实生活，让人有共鸣');
    parts.push('- 适当加入自嘲和幽默元素');
    parts.push('- 包含[Intro]、[Verse]、[Chorus]、[Outro]段落标记');
    parts.push('');

    parts.push('请直接输出歌词，不要有多余解释。');

    return parts.join('\n');
  }

  private parseLyrics(text: string, dialect: Dialect): Lyrics {
    const sections: Lyrics['sections'] = [];
    const lines = text.split('\n');

    let currentSection: Lyrics['sections'][0] | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      const sectionMatch = trimmed.match(/^\[(\w+)\]$/);

      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const type = sectionMatch[1].toLowerCase() as Lyrics['sections'][0]['type'];
        currentSection = {
          type: ['intro', 'verse', 'chorus', 'bridge', 'outro'].includes(type) ? type : 'verse',
          lines: [],
        };
        continue;
      }

      if (currentSection && trimmed) {
        currentSection.lines.push(trimmed);
      }
    }

    if (currentSection && currentSection.lines.length > 0) {
      sections.push(currentSection);
    }

    return {
      id: `lyrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dialect,
      topic: 'personalized',
      sections,
      createdAt: new Date(),
    };
  }
}
```

---

### 2.3 Rhythm Adaptor（节奏适配器 - 自研核心）

#### 功能概述

将"正常说话的方言语音"转换为"有节奏的Rap"

```
输入: CosyVoice输出的方言语音 (连续、无节奏)
                    ↓
        ┌───────────────────────┐
        │   1. 音节切分 (Segment) │  - Whisper + 文本对齐
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   2. 节奏对齐 (Align)  │  - BPM网格对齐
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   3. 声音合成 (Synth)  │  - 时间拉伸 + 重组
        └───────────────────────┘
                    ↓
输出: 有节奏的方言Rap语音
```

#### 核心代码

```typescript
// src/lib/dialect-rap/rhythm-adaptor/index.ts

import { execSync } from 'child_process';
import path from 'path';

export interface RhythmAdaptorConfig {
  bpm: number;
  enableHumanization?: boolean;
}

export interface RhythmAdaptorResult {
  audioPath: string;
  processingTime: number;
  details: {
    syllableCount: number;
    duration: number;
    bpm: number;
  };
}

export class RhythmAdaptor {
  private pythonPath: string;
  private scriptsPath: string;
  private tempDir: string;

  constructor(tempDir: string = '/tmp/dialect-rap/rhythm') {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptsPath = path.join(__dirname, 'python');
    this.tempDir = tempDir;
  }

  /**
   * 处理音频，添加Rap节奏
   */
  async process(
    audioPath: string,
    lyrics: string,
    config: RhythmAdaptorConfig
  ): Promise<RhythmAdaptorResult> {
    const startTime = Date.now();
    const taskId = Date.now().toString();

    // Step 1: 音节切分
    console.log('[RhythmAdaptor] Step 1: Segmenting syllables...');
    const segmentResult = await this.segmentSyllables(audioPath, lyrics);

    // Step 2: 节奏对齐
    console.log('[RhythmAdaptor] Step 2: Aligning to beat grid...');
    const alignmentResult = await this.alignToBeat(
      segmentResult,
      config.bpm,
      config.enableHumanization ?? true
    );

    // Step 3: 声音合成
    console.log('[RhythmAdaptor] Step 3: Synthesizing rhythmic audio...');
    const outputAudio = await this.synthesizeRhythm(
      audioPath,
      alignmentResult,
      taskId
    );

    const processingTime = Date.now() - startTime;
    console.log(`[RhythmAdaptor] Completed in ${processingTime}ms`);

    return {
      audioPath: outputAudio,
      processingTime,
      details: {
        syllableCount: segmentResult.syllables.length,
        duration: alignmentResult.totalDuration,
        bpm: config.bpm,
      },
    };
  }

  /**
   * 音节切分（使用 Whisper）
   */
  private async segmentSyllables(audioPath: string, lyrics: string): Promise<any> {
    const scriptPath = path.join(this.scriptsPath, 'segment_syllables.py');

    const result = execSync(
      `${this.pythonPath} "${scriptPath}" ` +
      `--audio "${audioPath}" --text "${lyrics}"`,
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );

    return JSON.parse(result);
  }

  /**
   * 节奏对齐
   */
  private async alignToBeat(
    segmentResult: any,
    bpm: number,
    enableHumanization: boolean
  ): Promise<any> {
    const scriptPath = path.join(this.scriptsPath, 'align_beat.py');

    const result = execSync(
      `${this.pythonPath} "${scriptPath}" ` +
      `--segments '${JSON.stringify(segmentResult)}' ` +
      `--bpm ${bpm} ` +
      `--humanization ${enableHumanization}`,
      { encoding: 'utf-8' }
    );

    return JSON.parse(result);
  }

  /**
   * 合成节奏音频
   */
  private async synthesizeRhythm(
    audioPath: string,
    alignment: any,
    taskId: string
  ): Promise<string> {
    const scriptPath = path.join(this.scriptsPath, 'synthesize_rhythm.py');
    const outputPath = path.join(this.tempDir, `${taskId}_rhythm.wav`);

    execSync(
      `${this.pythonPath} "${scriptPath}" ` +
      `--audio "${audioPath}" ` +
      `--alignment '${JSON.stringify(alignment)}' ` +
      `--output "${outputPath}"`,
      { encoding: 'utf-8', timeout: 120000 }
    );

    return outputPath;
  }
}
```

---

### 2.4 Auth Service（认证服务）

#### 功能概述

- **游客模式**：LocalStorage 存储，7天过期
- **微信登录**：扫码登录，30天过期

```typescript
// src/lib/dialect-rap/auth-service/index.ts

import { v4 as uuidv4 } from 'uuid';

export interface UserSession {
  id: string;
  type: 'guest' | 'wechat';
  wechatOpenId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export class AuthService {
  /**
   * 创建游客会话
   */
  createGuestSession(): UserSession {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天过期

    return {
      id: uuidv4(),
      type: 'guest',
      createdAt: now,
      expiresAt,
    };
  }

  /**
   * 微信扫码登录
   */
  async wechatLogin(code: string): Promise<UserSession> {
    // 调用微信 API 获取 openId
    const openId = await this.getWechatOpenId(code);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30); // 30天过期

    return {
      id: uuidv4(),
      type: 'wechat',
      wechatOpenId: openId,
      createdAt: now,
      expiresAt,
    };
  }

  /**
   * 获取微信 openId
   */
  private async getWechatOpenId(code: string): Promise<string> {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    const response = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    );

    const data = await response.json();

    if (data.errcode) {
      throw new Error(`WeChat login failed: ${data.errmsg}`);
    }

    return data.openid;
  }

  /**
   * 检查会话是否过期
   */
  isExpired(session: UserSession): boolean {
    return new Date() > session.expiresAt;
  }

  /**
   * 续期会话
   */
  renewSession(session: UserSession): UserSession {
    const now = new Date();
    const days = session.type === 'wechat' ? 30 : 7;

    session.expiresAt = new Date(now);
    session.expiresAt.setDate(session.expiresAt.getDate() + days);

    return session;
  }
}
```

---

### 2.5 Sensitive Word Filter（敏感词过滤）

```typescript
// src/lib/dialect-rap/content-filter/index.ts

export class SensitiveWordFilter {
  private blackList: Set<string>;
  private sensitiveWordLib: any;

  constructor() {
    // 基础黑名单
    this.blackList = new Set([
      // 政治、色情、暴力等敏感词
      // 实际项目中应该从配置文件或数据库加载
    ]);

    // 使用 sensitive-word 库
    // import { SensitiveWord } from 'sensitive-word';
    // this.sensitiveWordLib = new SensitiveWord();
  }

  /**
   * 检查文本是否包含敏感词
   */
  check(text: string): { hasSensitive: boolean; words: string[] } {
    const found: string[] = [];

    // 检查黑名单
    for (const word of this.blackList) {
      if (text.includes(word)) {
        found.push(word);
      }
    }

    // 使用 sensitive-word 库检查
    // const libResult = this.sensitiveWordLib.check(text);
    // found.push(...libResult);

    return {
      hasSensitive: found.length > 0,
      words: found,
    };
  }

  /**
   * 过滤敏感词（替换为 *）
   */
  filter(text: string): string {
    let result = text;

    for (const word of this.blackList) {
      const regex = new RegExp(word, 'gi');
      result = result.replace(regex, '*'.repeat(word.length));
    }

    return result;
  }
}
```

---

## 三、API 接口设计

### 3.1 接口列表

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /api/voice/upload-video | 上传视频提取人声 |
| POST | /api/voice/upload-audio | 上传录音 |
| POST | /api/voice/clone | 声音克隆 |
| POST | /api/lyrics/generate | 生成歌词 |
| POST | /api/rap/generate | 生成方言Rap |
| GET | /api/rap/:id/status | 查询生成状态 |
| GET | /api/rap/:id/download | 下载音频 |
| POST | /api/auth/wechat | 微信扫码登录 |
| GET | /api/hot-topics | 获取热点话题 |

### 3.2 核心接口详情

#### POST /api/rap/generate

```typescript
// 请求
{
  "userId": "user_xxx",
  "voiceId": "voice_xxx",           // 声音模型ID
  "dialect": "sichuan",              // 方言
  "userProfile": {
    "occupation": "程序员",
    "hobbies": ["打游戏", "看番"],
    "selfDescription": "最近加班累成狗，想吐槽一下"
  },
  "hotTopics": ["996", "打工人"],     // 可选
  "beatId": "beat_001",              // Beat ID 或上传URL
  "bpm": 90
}

// 响应
{
  "success": true,
  "data": {
    "taskId": "task_xxx",
    "status": "processing",
    "estimatedTime": 120
  }
}
```

#### GET /api/rap/:id/status

```typescript
// 响应
{
  "success": true,
  "data": {
    "taskId": "task_xxx",
    "status": "completed",           // pending/processing/completed/failed
    "progress": 100,
    "result": {
      "audioUrl": "https://oss.xxx.com/rap_xxx.mp3",
      "duration": 45.5,
      "dialect": "sichuan",
      "lyrics": "...",
      "createdAt": "2026-03-21T00:00:00.000Z"
    }
  }
}
```

---

## 四、数据存储设计

### 4.1 用户声音模型

```typescript
// 存储在 OSS 或本地文件系统
interface VoiceModelStorage {
  userId: string;
  voiceId: string;
  modelPath: string;         // 模型文件路径
  referenceAudioPath: string; // 参考音频路径
  createdAt: Date;
  expiresAt: Date;
  type: 'guest' | 'wechat';
}
```

### 4.2 用户作品

```typescript
// PostgreSQL
CREATE TABLE rap_works (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  voice_id VARCHAR(64) NOT NULL,
  dialect VARCHAR(32) NOT NULL,
  lyrics TEXT NOT NULL,
  audio_url VARCHAR(512) NOT NULL,
  duration DECIMAL(10, 2),
  beat_id VARCHAR(64),
  bpm INTEGER,
  status VARCHAR(32) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## 五、部署架构

### 5.1 组件部署

| 组件 | 方案 | 规格 |
|------|------|------|
| API服务 | 云服务器 | 2核4G起 |
| 声音克隆 | 云GPU按需 | NVIDIA T4/A10 |
| 前端 | Vercel/阿里云OSS | 静态部署 |
| 存储 | 阿里云OSS | 按量付费 |
| 数据库 | PostgreSQL | 1核1G起 |

### 5.2 环境变量

```bash
# .env
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# CosyVoice API
ALIBABA_CLOUD_API_KEY=sk-xxx

# 微信登录
WECHAT_APP_ID=wx xxx
WECHAT_APP_SECRET=xxx

# 阿里云OSS
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_BUCKET=dialect-rap
OSS_REGION=oss-cn-shanghai

# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/dialect_rap
```

---

## 六、开发路线

### Phase 1: MVP（2周）

| 功能 | 状态 | 技术方案 |
|------|------|----------|
| 用户声音克隆 | ✅必做 | GPT-SoVITS |
| 视频上传+人声分离 | ✅必做 | Spleeter/Demucs |
| 录音朗读 | ✅必做 | 指定文本 |
| 8种方言支持 | ✅必做 | CosyVoice API |
| 个性化歌词生成 | ✅必做 | Claude API + 搞笑风格 |
| Rhythm Adaptor | ✅必做 | 自研基础版 |
| 混音合成 | ✅必做 | ffmpeg |
| 音频导出 | ✅必做 | MP3 |
| 游客模式 | ✅必做 | 7天存储 |
| 微信扫码登录 | ✅必做 | 30天存储 |
| 敏感词过滤 | ✅必做 | sensitive-word库 |
| 用户协议 | ✅必做 | 简单版 |

### Phase 2: 优化（2周）

- 热点自动抓取
- Beat库完善
- 歌词编辑器
- 效果预览

### Phase 3: 打磨（1周）

- 付费功能
- 分享功能
- 移动端适配（P2）
- 抖音小程序（P2）

---

## 七、依赖列表

### 7.1 Node.js 依赖

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "uuid": "^9.0.0",
    "ffmpeg-static": "^5.2.0"
  }
}
```

### 7.2 Python 依赖

```txt
# 声音处理
whisper>=1.0.0
librosa>=0.10.0
pyrubberband>=0.3.0
soundfile>=0.12.0

# 人声分离
demucs>=4.0.0
# 或
spleeter>=2.0.0

# 声音克隆
# GPT-SoVITS（需单独安装）
# 参考：https://github.com/RVC-Boss/GPT-SoVITS

# 敏感词
sensitive-word>=1.0.0
```

### 7.3 系统依赖

```bash
# macOS
brew install ffmpeg rubberband

# Ubuntu
apt-get install ffmpeg rubberband-tools
```

---

*文档版本: v3.0*
*更新时间: 2026-03-21*
*状态: 与需求文档完全对齐*
