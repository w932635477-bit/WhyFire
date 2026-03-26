# Suno + RVC 方言 Rap 生成系统 - 技术方案

> **文档版本**: v1.0
> **创建日期**: 2026-03-25
> **状态**: 待部署
> **决策来源**: YC Office Hours + 内部技术评审

---

## 一、方案背景

### 1.1 问题诊断

**原方案失败**：TTS + 演唱感增强（F0 操控 + 能量增强 + WSOLA）

经过反复测试，原方案输出效果：
- ❌ "像念经一样"，没有真正的 Rap 节奏感
- ❌ Rhythm Adaptor 只是在"读"的基础上调整时间，本质还是"读"
- ❌ 用户反馈："用改变重音的方式读歌词" ≠ "说唱"

**根本原因**：TTS 本质上是为"说话"训练的，无法自然产生 Rap 所需的 F0 轮廓、能量动态和节奏重音。

### 1.2 技术路线对比

| 方案 | 描述 | 优点 | 缺点 | 状态 |
|------|------|------|------|------|
| **A: Suno + RVC** | Suno 生成 Rap → RVC 替换音色 | 效果最可靠 | 不能固定 BGM，方言有限 | ✅ 已选 |
| B: TTS + 演唱感增强 | 保持现有架构，增强演唱感 | 流程简单 | 技术不成熟 | ❌ 已放弃 |
| C: 歌声合成 (SVS) | DiffSinger 等系统 | 专业演唱 | 需要乐谱，复杂 | 暂不考虑 |

### 1.3 最终决策

**采用方案 A：Suno + RVC**

```
Claude 生成歌词 → Suno 生成 Rap → LALAL.AI 人声分离 → RVC 替换音色 → 与固定 BGM 混音
```

**进一步优化**：用自托管 Demucs 替代 LALAL.AI 云服务

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WhyFire 方言 Rap 生成系统                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   前端层 (Vercel - Next.js)                                                  │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │  声音采集 → 方言选择 → 歌词生成 → Rap 生成 → 预览导出               │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                    │                                        │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│   ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│   │  云端服务           │  │  自托管服务        │  │  存储              │    │
│   │                    │  │                    │  │                    │    │
│   │  • Suno API        │  │  • RVC Server      │  │  • 阿里云 OSS      │    │
│   │    (Evolink代理)   │  │  • Demucs Server   │  │  • Cloudflare R2   │    │
│   │  • Claude API      │  │  • FFmpeg          │  │                    │    │
│   │  • CosyVoice API   │  │                    │  │                    │    │
│   │                    │  │  (GPU服务器)       │  │                    │    │
│   └────────────────────┘  └────────────────────┘  └────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 服务分工

| 服务 | 类型 | 部署方式 | 用途 | 成本 |
|------|------|----------|------|------|
| **Suno API** | 云端 | Evolink 代理 | Rap 音乐生成 | ¥0.5-1/次 |
| **Claude API** | 云端 | EvoLink 代理 | 歌词生成 | ¥0.1-0.3/次 |
| **CosyVoice API** | 云端 | 阿里云 DashScope | 方言 TTS（备用） | ¥0.05/次 |
| **RVC** | 自托管 | GPU 服务器 | 音色替换 | 服务器成本 |
| **Demucs** | 自托管 | GPU 服务器 | 人声分离 | 服务器成本 |
| **FFmpeg** | 自托管 | CPU/GPU | 音频混音 | 服务器成本 |

---

## 三、完整生成流程

### 3.1 流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Suno + RVC Rap 生成流程                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: 用户声音克隆                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  用户录音(30s-2min) → RVC 训练 → 用户 RVC 模型                    │   │
│  │                              ↑                                   │   │
│  │                        自托管 RVC 服务                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 2: 歌词生成                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  用户描述 + 热点 + 方言 → Claude API → 个性化歌词                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 3: Suno 生成 Rap                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  歌词 + 方言风格 → Suno API (Evolink) → AI 音色 Rap               │   │
│  │  (例如: 59.92s 四川话 Rap)                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 4: 人声分离                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Suno Rap → Demucs (自托管) → 人声 + 伴奏                         │   │
│  │                   ↑                                              │   │
│  │             自托管 Demucs 服务                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 5: RVC 音色替换                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Suno 人声 + 用户 RVC 模型 → RVC (自托管) → 用户音色 Rap           │   │
│  │                   ↑                                              │   │
│  │             自托管 RVC 服务                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 6: 混音合成                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  用户音色 Rap + 固定 BGM → FFmpeg → 最终成品 MP3                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 关键决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **Suno BGM 不可控** | 采用人声分离 + 固定 BGM 方案 | 确保用户可以选择自己的 BGM |
| **方言支持** | Phase 1 普通话，Phase 2 探索方言 | Suno 方言支持有限，分阶段实现 |
| **人声分离** | 自托管 Demucs 替代 LALAL.AI | 降低成本，提高稳定性 |
| **音色替换** | 自托管 RVC | 避免云端 API 不稳定，数据隐私 |

---

## 四、自托管服务部署

### 4.1 服务器配置

#### 推荐配置

| 配置项 | 最低配置 | 推荐配置 | 说明 |
|--------|----------|----------|------|
| CPU | 4 核 | 8 核 | 并发处理 |
| 内存 | 16 GB | 32 GB | 模型加载 |
| GPU | RTX 3060 (12GB) | RTX 4090 (24GB) | 推理加速 |
| 存储 | 100 GB SSD | 200 GB SSD | 模型 + 临时文件 |
| 带宽 | 10 Mbps | 50 Mbps | 音频上传/下载 |

#### 云服务商选择

| 服务商 | 优势 | 推荐机型 | 月费用 |
|--------|------|----------|--------|
| **阿里云** | 国内访问快、稳定性高 | gn6v（T4）、gn7（A10） | ¥2000-4000 |
| 腾讯云 | 价格适中 | GN10Xp（T4）、GN7（A10） | ¥1500-3500 |
| AutoDL | 按小时计费、灵活 | RTX 3090/4090 | ¥3-5/小时 |

### 4.2 Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  # RVC 服务 - 音色替换
  rvc-server:
    build:
      context: ./services/rvc
      dockerfile: Dockerfile
    ports:
      - "8001:8000"
    volumes:
      - ./models/rvc:/app/models
      - ./temp:/app/temp
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Demucs 服务 - 人声分离
  demucs-server:
    build:
      context: ./services/demucs
      dockerfile: Dockerfile
    ports:
      - "8002:8000"
    volumes:
      - ./models/demucs:/app/models
      - ./temp:/app/temp
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # FFmpeg 混音服务
  ffmpeg-server:
    build:
      context: ./services/ffmpeg
      dockerfile: Dockerfile
    ports:
      - "8003:8000"
    volumes:
      - ./temp:/app/temp
      - ./assets/bgm:/app/bgm:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - rvc-server
      - demucs-server
      - ffmpeg-server

  # Redis 队列（可选）
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### 4.3 RVC 服务实现

```python
# services/rvc/api_server.py
"""
RVC REST API 服务
基于 RVC-WebUI 的 REST API 封装
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import subprocess
import os
import uuid
import logging

app = FastAPI(title="RVC API", version="1.0.0")
logger = logging.getLogger(__name__)

class VoiceConversionRequest(BaseModel):
    """音色转换请求"""
    input_audio: str              # 输入音频路径或 URL
    voice_model: str              # RVC 模型名称
    f0_method: str = "crepe"      # F0 提取方法
    f0_up_key: int = 0            # 音高偏移
    index_rate: float = 0.5       # 索引比率
    filter_radius: int = 3        # 过滤半径
    rms_mix_rate: float = 0.25    # RMS 混合比率
    protect: float = 0.33         # 保护清音

class VoiceConversionResult(BaseModel):
    """转换结果"""
    task_id: str
    status: str
    output_audio: str | None = None
    duration: float | None = None
    error: str | None = None

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok", "service": "rvc"}

@app.post("/api/v1/convert", response_model=VoiceConversionResult)
async def convert_voice(request: VoiceConversionRequest):
    """音色转换"""
    task_id = str(uuid.uuid4())
    output_path = f"/app/temp/output_{task_id}.wav"

    try:
        cmd = [
            "python", "infer_cli.py",
            "--model_path", f"/app/models/{request.voice_model}.pth",
            "--config_path", f"/app/models/{request.voice_model}.json",
            "--input_path", request.input_audio,
            "--output_path", output_path,
            "--f0_method", request.f0_method,
            "--f0_up_key", str(request.f0_up_key),
            "--index_rate", str(request.index_rate),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            raise Exception(result.stderr)

        duration = get_audio_duration(output_path)

        return VoiceConversionResult(
            task_id=task_id,
            status="completed",
            output_audio=output_path,
            duration=duration
        )

    except Exception as e:
        logger.error(f"RVC conversion failed: {e}")
        return VoiceConversionResult(
            task_id=task_id,
            status="failed",
            error=str(e)
        )

def get_audio_duration(file_path: str) -> float:
    """获取音频时长"""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file_path],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 4.4 Demucs 服务实现

```python
# services/demucs/api_server.py
"""
Demucs 人声分离 API 服务
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import subprocess
import os
import uuid
import logging

app = FastAPI(title="Demucs API", version="1.0.0")
logger = logging.getLogger(__name__)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "demucs"}

@app.post("/api/v1/separate")
async def separate_audio(
    audio_file: UploadFile = File(...),
    model: str = "htdemucs"
):
    """人声分离"""
    task_id = str(uuid.uuid4())
    input_path = f"/app/temp/input_{task_id}.wav"
    output_dir = f"/app/temp/output_{task_id}"

    try:
        # 保存上传文件
        with open(input_path, "wb") as f:
            f.write(await audio_file.read())

        os.makedirs(output_dir, exist_ok=True)

        # 调用 Demucs
        cmd = [
            "demucs", "-n", model, "-o", output_dir,
            "--two-stems=vocals", input_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)

        if result.returncode != 0:
            raise Exception(result.stderr)

        # Demucs 输出路径
        model_output_dir = os.path.join(output_dir, model)
        input_name = os.path.splitext(os.path.basename(input_path))[0]

        vocals_path = os.path.join(model_output_dir, input_name, "vocals.wav")
        no_vocals_path = os.path.join(model_output_dir, input_name, "no_vocals.wav")

        return {
            "task_id": task_id,
            "status": "completed",
            "vocals": vocals_path,
            "accompaniment": no_vocals_path,
        }

    except Exception as e:
        logger.error(f"Demucs separation failed: {e}")
        return {
            "task_id": task_id,
            "status": "failed",
            "error": str(e)
        }

@app.get("/api/v1/download/{task_id}/{stem}")
async def download_stem(task_id: str, stem: str):
    """下载分离后的音轨"""
    file_path = f"/app/temp/output_{task_id}/htdemucs/input_{task_id}/{stem}.wav"

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path,
        media_type="audio/wav",
        filename=f"{stem}_{task_id}.wav"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 五、客户端代码

### 5.1 RVC 客户端

```typescript
// src/lib/audio/rvc-client.ts

export interface RVCCOnversionRequest {
  inputAudio: string
  voiceModel: string
  f0Method?: 'crepe' | 'pm' | 'harvest'
  f0UpKey?: number
  indexRate?: number
}

export interface RVCConversionResult {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  outputAudio?: string
  duration?: number
  error?: string
}

export class RVCClient {
  private apiUrl = process.env.RVC_API_URL || 'http://localhost:8001'

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }

  async convert(request: RVCCOnversionRequest): Promise<RVCConversionResult> {
    const response = await fetch(`${this.apiUrl}/api/v1/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_audio: request.inputAudio,
        voice_model: request.voiceModel,
        f0_method: request.f0Method || 'crepe',
        f0_up_key: request.f0UpKey || 0,
        index_rate: request.indexRate || 0.5,
      }),
    })

    if (!response.ok) {
      throw new Error(`RVC API error: ${response.status}`)
    }

    return await response.json()
  }
}

export const getRVCClient = () => new RVCClient()
```

### 5.2 Demucs 客户端

```typescript
// src/lib/audio/demucs-client.ts

export interface SeparationRequest {
  audioUrl: string
  model?: 'htdemucs' | 'htdemucs_ft' | 'mdx'
}

export interface SeparationResult {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  vocals?: string
  accompaniment?: string
  duration?: number
  error?: string
}

export class DemucsClient {
  private apiUrl = process.env.DEMUCS_API_URL || 'http://localhost:8002'

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }

  async separate(request: SeparationRequest): Promise<SeparationResult> {
    const audioResponse = await fetch(request.audioUrl)
    const audioBuffer = await audioResponse.arrayBuffer()

    const formData = new FormData()
    formData.append('audio_file', new Blob([audioBuffer]), 'input.wav')
    formData.append('model', request.model || 'htdemucs')

    const response = await fetch(`${this.apiUrl}/api/v1/separate`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Demucs API error: ${response.status}`)
    }

    return await response.json()
  }
}

export const getDemucsClient = () => new DemucsClient()
```

### 5.3 完整 Rap 生成器

```typescript
// src/lib/services/rap-generator-suno-rvc.ts

import { getSunoClient } from '@/lib/music/suno-client'
import { getRVCClient } from '@/lib/audio/rvc-client'
import { getDemucsClient } from '@/lib/audio/demucs-client'
import { FFmpegProcessor } from '@/lib/audio/ffmpeg-processor'

export interface RapGenerationParams {
  userId: string
  userDescription: string
  dialect: DialectCode
  voiceModelId: string
  bgmUrl: string
  lyrics?: string
}

export interface RapGenerationResult {
  audioUrl: string
  duration: number
  lyrics: string
  dialect: DialectCode
  taskId: string
}

export class RapGeneratorSunoRvc {
  private sunoClient = getSunoClient()
  private rvcClient = getRVCClient()
  private demucsClient = getDemucsClient()
  private ffmpegProcessor = new FFmpegProcessor()

  async generate(
    params: RapGenerationParams,
    onProgress?: (step: string, progress: number) => void
  ): Promise<RapGenerationResult> {
    const { userId, userDescription, dialect, voiceModelId, bgmUrl, lyrics: providedLyrics } = params
    const taskId = `${userId}-${Date.now()}`

    // Step 1: 生成歌词
    onProgress?.('lyrics', 0)
    const lyrics = providedLyrics || await this.generateLyrics(userDescription, dialect)
    onProgress?.('lyrics', 100)

    // Step 2: Suno 生成 Rap
    onProgress?.('suno', 0)
    const sunoResult = await this.sunoClient.generate({
      lyrics,
      dialect,
      style: 'rap',
    })

    if (!sunoResult.audioUrl) {
      throw new Error('Suno generation failed')
    }
    onProgress?.('suno', 100)

    // Step 3: Demucs 人声分离
    onProgress?.('separation', 0)
    const separationResult = await this.demucsClient.separate({
      audioUrl: sunoResult.audioUrl,
      model: 'htdemucs',
    })

    if (!separationResult.vocals) {
      throw new Error('Demucs separation failed')
    }
    onProgress?.('separation', 100)

    // Step 4: RVC 音色替换
    onProgress?.('conversion', 0)
    const rvcResult = await this.rvcClient.convert({
      inputAudio: separationResult.vocals,
      voiceModel: voiceModelId,
      f0Method: 'crepe',
    })

    if (!rvcResult.outputAudio) {
      throw new Error('RVC conversion failed')
    }
    onProgress?.('conversion', 100)

    // Step 5: FFmpeg 混音
    onProgress?.('mixing', 0)
    const finalAudio = await this.ffmpegProcessor.mixAudio({
      vocalsUrl: rvcResult.outputAudio,
      bgmUrl: bgmUrl,
      vocalsVolume: 1.0,
      bgmVolume: 0.3,
      outputFormat: 'mp3',
    })
    onProgress?.('mixing', 100)

    return {
      audioUrl: finalAudio.url,
      duration: finalAudio.duration,
      lyrics,
      dialect,
      taskId,
    }
  }

  private async generateLyrics(description: string, dialect: DialectCode): Promise<string> {
    // TODO: 调用 Claude API 生成歌词
    return `[Verse 1]\n${description}\n\n[Chorus]\n用方言唱出我的style`
  }
}

export const getRapGenerator = () => new RapGeneratorSunoRvc()
```

---

## 六、环境配置

### 6.1 环境变量

```bash
# .env.local

# ===========================================
# 云端服务（已有）
# ===========================================

# Suno API - 通过 Evolink 代理
SUNO_API_KEY=your_suno_api_key_here

# Claude API - 通过 EvoLink 代理
EVOLINK_API_KEY=your_evolink_api_key_here

# CosyVoice API - 阿里云 DashScope
DASHSCOPE_API_KEY=your_dashscope_api_key_here

# ===========================================
# 自托管服务（新增）
# ===========================================

# RVC 服务 - 音色替换
RVC_API_URL=http://your-gpu-server:8001

# Demucs 服务 - 人声分离
DEMUCS_API_URL=http://your-gpu-server:8002

# FFmpeg 混音服务（可选）
# FFMPEG_API_URL=http://your-gpu-server:8003

# ===========================================
# 存储（已有）
# ===========================================

# 阿里云 OSS
OSS_ACCESS_KEY_ID=your_oss_access_key_id_here
OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret_here
OSS_BUCKET=your_oss_bucket_name_here
OSS_REGION=oss-cn-beijing
```

---

## 七、部署步骤

### 7.1 服务器准备

```bash
# 1. 购买 GPU 服务器
# 推荐: 阿里云 gn7 (A10 GPU) 或 AutoDL RTX 3090

# 2. 安装 Docker 和 NVIDIA Container Toolkit
curl -fsSL https://get.docker.com | sh

distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# 3. 验证 GPU
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### 7.2 部署服务

```bash
# 1. 创建项目目录
mkdir -p whyfire-services/{services,models,temp,assets}
cd whyfire-services

# 2. 创建服务目录
mkdir -p services/{rvc,demucs,ffmpeg}

# 3. 复制 Dockerfile 和 API 代码
# (参考上文的服务实现)

# 4. 下载 RVC 预训练模型
mkdir -p models/rvc
# 从官方下载或使用已有模型

# 5. 启动服务
docker-compose up -d

# 6. 验证服务
curl http://localhost:8001/health  # RVC
curl http://localhost:8002/health  # Demucs
curl http://localhost:8003/health  # FFmpeg
```

### 7.3 配置域名和 SSL（可选）

```nginx
# nginx.conf
upstream rvc {
    server rvc-server:8000;
}

upstream demucs {
    server demucs-server:8000;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location /rvc/ {
        proxy_pass http://rvc/;
        client_max_body_size 100M;
    }

    location /demucs/ {
        proxy_pass http://demucs/;
        client_max_body_size 100M;
    }
}
```

---

## 八、成本分析

### 8.1 云 GPU 服务器成本

| 配置 | 月费用（按需） | 月费用（包年） | 适用场景 |
|------|---------------|---------------|----------|
| RTX 3060 (12GB) | ¥800-1200 | ¥600-900 | 测试、低并发 |
| RTX 3090 (24GB) | ¥2000-3000 | ¥1500-2200 | **推荐：稳定生产** |
| RTX 4090 (24GB) | ¥4000-5000 | ¥3000-3800 | 高并发、多实例 |

### 8.2 API 调用成本

| 服务 | 单次成本 | 月成本（1000次） | 说明 |
|------|----------|------------------|------|
| Suno API | ¥0.5-1 | ¥500-1000 | Evolink 代理 |
| Claude API | ¥0.1-0.3 | ¥100-300 | 歌词生成 |
| **自托管 RVC** | ¥0 | ¥0 | 仅服务器成本 |
| **自托管 Demucs** | ¥0 | ¥0 | 仅服务器成本 |

### 8.3 总成本估算

| 配置 | API 成本 | 服务器成本 | 月总计 |
|------|----------|-----------|--------|
| 最低配置 | ¥600-1300 | ¥800-1200 | ¥1400-2500 |
| **推荐配置** | ¥600-1300 | ¥2000-3000 | ¥2600-4300 |
| 高并发配置 | ¥600-1300 | ¥4000-5000 | ¥4600-6300 |

**ROI 分析**：自托管方案相比纯云端 API，月生成 500 次以上即可回本。

---

## 九、性能指标

### 9.1 处理时间

| 步骤 | 预估时间 | 说明 |
|------|----------|------|
| 歌词生成 | 3-5s | Claude API |
| Suno 生成 | 60-120s | Rap 生成 |
| Demucs 分离 | 30-60s | GPU 加速 |
| RVC 转换 | 20-40s | GPU 加速 |
| FFmpeg 混音 | 5-10s | CPU |
| **总计** | **2-4 min** | 完整流程 |

### 9.2 并发能力

| 配置 | 并发数 | 说明 |
|------|--------|------|
| RTX 3060 | 2-3 | 低并发 |
| RTX 3090 | 5-8 | **推荐** |
| RTX 4090 | 10-15 | 高并发 |

---

## 十、下一步行动

### 10.1 立即行动（本周）

- [ ] **服务器采购**
  - 选择云服务商（推荐阿里云 gn7）
  - 购买 GPU 服务器
  - 配置网络和安全组

- [ ] **模型准备**
  - 下载 RVC 预训练模型
  - 准备测试音频数据

- [ ] **服务部署**
  - 编写 Dockerfile
  - 配置 Docker Compose
  - 启动并验证服务

### 10.2 短期计划（2周内）

- [ ] **客户端集成**
  - 创建 RVC/Demucs 客户端代码
  - 整合完整生成流程
  - 编写单元测试

- [ ] **端到端测试**
  - 测试完整 5 步流程
  - 评估生成质量
  - 优化参数

### 10.3 中期计划（1个月内）

- [ ] **生产部署**
  - 配置域名和 SSL
  - 设置监控和告警
  - 编写运维文档

- [ ] **方言支持 Phase 2**
  - 测试 RVC + 方言参考音频
  - 评估 Suno 方言 prompt 优化
  - 探索 DiffSinger 方言模型

---

## 十一、风险与应对

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| RVC 转换效果差（电子音严重） | 高 | 中 | 尝试不同 RVC 服务商或调整参数 |
| Demucs 分离质量不达标 | 中 | 低 | 尝试其他模型（mdx、spleeter） |
| Suno API 不可用 | 高 | 低 | 降级到 TTS + Rhythm Adaptor（已知效果有限） |
| 处理时间 > 5 分钟 | 中 | 中 | 优化 RVC 推理或考虑异步处理 |
| 服务器成本超预算 | 中 | 低 | 使用 AutoDL 按小时计费，非高峰期停机 |

---

## 十二、参考资料

### 12.1 技术文档

- [Suno API 文档](https://docs.evolink.ai)
- [RVC 项目](https://github.com/RVC-Boss/so-vits-svc)
- [Demucs 项目](https://github.com/facebookresearch/demucs)
- [FFmpeg 文档](https://ffmpeg.org/documentation.html)

### 12.2 相关文档

- [方言 Rap 需求文档](./dialect-rap-requirements.md)
- [自托管部署详细文档](./self-hosted-deployment.md)
- [技术设计文档 v3](./dialect-rap-technical-design-v3.md)

---

**文档结束**

*本方案已于 2026-03-25 确认，开始执行部署。*
