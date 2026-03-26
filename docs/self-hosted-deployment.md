# 自托管服务部署方案

> 2026-03-25 确定的 Suno + RVC Rap 生成路线
>
> **5 步流程**：Claude 生成歌词 → Suno 生成 Rap → 人声分离 → RVC 替换音色 → 与固定 BGM 混音

---

## 一、部署架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WhyFire 方言 Rap 生成系统                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   前端层 (Vercel)                                                            │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │  Next.js App → API Routes → 服务端处理                              │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                    │                                        │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│   ┌────────────────────┐  ┌────────────────┐  ┌────────────────────┐        │
│   │  云端服务           │  │  自托管服务    │  │  存储              │        │
│   │                    │  │                │  │                    │        │
│   │  - Suno API        │  │  - RVC Server  │  │  - 阿里云 OSS      │        │
│   │    (Evolink代理)   │  │  - Demucs      │  │  - Cloudflare R2   │        │
│   │  - Claude API      │  │  - FFmpeg      │  │                    │        │
│   │  - CosyVoice API   │  │                │  │                    │        │
│   │                    │  │  (GPU服务器)   │  │                    │        │
│   └────────────────────┘  └────────────────┘  └────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 服务分工

| 服务 | 类型 | 部署方式 | 说明 |
|------|------|----------|------|
| Suno API | 云端 | Evolink 代理 | Rap 生成，国内可访问 |
| Claude API | 云端 | EvoLink 代理 | 歌词生成 |
| CosyVoice API | 云端 | 阿里云 DashScope | 方言 TTS（备用方案） |
| **RVC** | 自托管 | GPU 服务器 | 音色替换（核心） |
| **Demucs** | 自托管 | GPU 服务器 | 人声分离 |
| FFmpeg | 自托管 | CPU/GPU | 音频混音 |

---

## 二、自托管服务

### 2.1 服务器配置

#### 推荐配置

| 配置项 | 最低配置 | 推荐配置 | 说明 |
|--------|----------|----------|------|
| CPU | 4 核 | 8 核 | 并发处理 |
| 内存 | 16 GB | 32 GB | 模型加载 |
| GPU | RTX 3060 (12GB) | RTX 4090 (24GB) | 推理加速 |
| 存储 | 100 GB SSD | 200 GB SSD | 模型 + 临时文件 |
| 带宽 | 10 Mbps | 50 Mbps | 音频上传/下载 |

#### 云服务商选择

| 服务商 | 优势 | 推荐机型 |
|--------|------|----------|
| **阿里云** | 国内访问快、稳定性高 | gn6v（T4）、gn7（A10） |
| 腾讯云 | 价格适中 | GN10Xp（T4）、GN7（A10） |
| AutoDL | 按小时计费、灵活 | RTX 3090/4090 |

### 2.2 Docker Compose 部署

创建统一的 Docker Compose 配置：

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ===========================================
  # RVC 服务 - 音色替换
  # ===========================================
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
      - RVC_MODEL_NAME=${RVC_MODEL_NAME:-base}
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

  # ===========================================
  # Demucs 服务 - 人声分离
  # ===========================================
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
      - DEMUCS_MODEL=htdemucs
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

  # ===========================================
  # FFmpeg 混音服务
  # ===========================================
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

  # ===========================================
  # Nginx 反向代理
  # ===========================================
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

  # ===========================================
  # Redis 队列（可选）
  # ===========================================
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

---

## 三、RVC 服务部署

### 3.1 RVC 服务选项

| 方案 | GitHub | API 类型 | 推荐指数 |
|------|--------|----------|----------|
| **RVC-WebUI + API 扩展** | RVC-Boss/so-vits-svc | REST | ⭐⭐⭐⭐⭐ |
| **Mangio-RVC** | Mangio621/Mangio-RVC | REST | ⭐⭐⭐⭐ |
| **RVC-REST-API** | customsolve/rvc-rest-api | REST | ⭐⭐⭐ |
| **MimikaStudio** | 私有方案 | WebSocket | ⭐⭐⭐⭐ |

### 3.2 推荐方案：RVC-WebUI + REST API

```dockerfile
# services/rvc/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# 克隆 RVC
RUN git clone https://github.com/RVC-Boss/so-vits-svc.git .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 下载基础模型（可选）
# RUN python download_models.py

# 复制 API 服务
COPY api_server.py .
COPY start.sh .

RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
```

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
    input_audio: str  # 输入音频路径或 URL
    voice_model: str  # RVC 模型名称
    f0_method: str = "crepe"  # F0 提取方法
    f0_up_key: int = 0  # 音高偏移
    index_rate: float = 0.5  # 索引比率
    filter_radius: int = 3  # 过滤半径
    rms_mix_rate: float = 0.25  # RMS 混合比率
    protect: float = 0.33  # 保护清音

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
    """
    音色转换

    Args:
        request: 转换参数
            - input_audio: 输入音频（Suno 生成的 Rap）
            - voice_model: 用户训练好的 RVC 模型
            - f0_method: F0 提取方法（crepe/pm/harvest）
            - f0_up_key: 音高偏移（半音）
    """
    task_id = str(uuid.uuid4())
    output_path = f"/app/temp/output_{task_id}.wav"

    try:
        # 调用 RVC 推理
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

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120  # 2 分钟超时
        )

        if result.returncode != 0:
            raise Exception(result.stderr)

        # 获取音频时长
        duration = get_audio_duration(output_path)

        return VoiceConversionResult(
            task_id=task_id,
            status="completed",
            output_audio=output_path,
            duration=duration
        )

    except subprocess.TimeoutExpired:
        return VoiceConversionResult(
            task_id=task_id,
            status="failed",
            error="Conversion timeout"
        )
    except Exception as e:
        logger.error(f"RVC conversion failed: {e}")
        return VoiceConversionResult(
            task_id=task_id,
            status="failed",
            error=str(e)
        )

@app.post("/api/v1/train")
async def train_voice_model(
    audio_file: UploadFile = File(...),
    model_name: str = "user_voice",
    epochs: int = 100
):
    """
    训练用户声音模型

    Args:
        audio_file: 用户录音（30秒 - 2分钟）
        model_name: 模型名称
        epochs: 训练轮数
    """
    task_id = str(uuid.uuid4())

    # 保存上传文件
    input_path = f"/app/temp/train_{task_id}.wav"
    with open(input_path, "wb") as f:
        f.write(await audio_file.read())

    # 启动异步训练任务
    # TODO: 使用 Celery 或 Redis Queue 实现异步任务

    return {
        "task_id": task_id,
        "status": "training",
        "model_name": model_name
    }

@app.get("/api/v1/models")
async def list_models():
    """列出可用的 RVC 模型"""
    models_dir = "/app/models"
    models = []

    for f in os.listdir(models_dir):
        if f.endswith(".pth"):
            model_name = f[:-4]
            models.append({
                "name": model_name,
                "path": os.path.join(models_dir, f)
            })

    return {"models": models}

def get_audio_duration(file_path: str) -> float:
    """获取音频时长"""
    import subprocess
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration", "-of",
         "default=noprint_wrappers=1:nokey=1", file_path],
        capture_output=True,
        text=True
    )
    return float(result.stdout.strip())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

```bash
# services/rvc/start.sh
#!/bin/bash

# 检查 GPU
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"

# 启动 API 服务
uvicorn api_server:app --host 0.0.0.0 --port 8000 --workers 1
```

---

## 四、人声分离服务（Demucs）

### 4.1 Demucs 服务

```dockerfile
# services/demucs/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 安装 Demucs
RUN pip install demucs

# 复制 API 服务
COPY api_server.py .
COPY start.sh .

RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
```

```python
# services/demucs/api_server.py
"""
Demucs 人声分离 API 服务
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import subprocess
import os
import uuid
import logging
import torchaudio

app = FastAPI(title="Demucs API", version="1.0.0")

logger = logging.getLogger(__name__)

class SeparationResult(BaseModel):
    """分离结果"""
    task_id: str
    status: str
    vocals: str | None = None
    accompaniment: str | None = None
    duration: float | None = None
    error: str | None = None

@app.get("/health")
async def health():
    return {"status": "ok", "service": "demucs"}

@app.post("/api/v1/separate", response_model=SeparationResult)
async def separate_audio(
    audio_file: UploadFile = File(...),
    model: str = "htdemucs"
):
    """
    人声分离

    Args:
        audio_file: 输入音频文件（Suno 生成的 Rap）
        model: Demucs 模型
            - htdemucs: 默认模型，效果好
            - htdemucs_ft: 更快，效果略差
            - mdx: 音乐分离专用
    """
    task_id = str(uuid.uuid4())
    input_path = f"/app/temp/input_{task_id}.wav"
    output_dir = f"/app/temp/output_{task_id}"

    try:
        # 保存上传文件
        with open(input_path, "wb") as f:
            f.write(await audio_file.read())

        # 创建输出目录
        os.makedirs(output_dir, exist_ok=True)

        # 调用 Demucs
        cmd = [
            "demucs",
            "-n", model,
            "-o", output_dir,
            "--two-stems=vocals",  # 只分离人声和伴奏
            input_path
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180  # 3 分钟超时
        )

        if result.returncode != 0:
            raise Exception(result.stderr)

        # Demucs 输出路径结构: output_dir/model_name/input_name/vocals.wav
        model_output_dir = os.path.join(output_dir, model)
        input_name = os.path.splitext(os.path.basename(input_path))[0]

        vocals_path = os.path.join(model_output_dir, input_name, "vocals.wav")
        no_vocals_path = os.path.join(model_output_dir, input_name, "no_vocals.wav")

        # 获取时长
        duration = get_audio_duration(vocals_path)

        return SeparationResult(
            task_id=task_id,
            status="completed",
            vocals=vocals_path,
            accompaniment=no_vocals_path,
            duration=duration
        )

    except subprocess.TimeoutExpired:
        return SeparationResult(
            task_id=task_id,
            status="failed",
            error="Separation timeout"
        )
    except Exception as e:
        logger.error(f"Demucs separation failed: {e}")
        return SeparationResult(
            task_id=task_id,
            status="failed",
            error=str(e)
        )

@app.get("/api/v1/download/{task_id}/{stem}")
async def download_stem(task_id: str, stem: str):
    """
    下载分离后的音轨

    Args:
        task_id: 任务 ID
        stem: 音轨类型（vocals/no_vocals）
    """
    file_path = f"/app/temp/output_{task_id}/htdemucs/input_{task_id}/{stem}.wav"

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path,
        media_type="audio/wav",
        filename=f"{stem}_{task_id}.wav"
    )

def get_audio_duration(file_path: str) -> float:
    """获取音频时长"""
    waveform, sample_rate = torchaudio.load(file_path)
    return waveform.shape[1] / sample_rate

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 五、完整生成流程

### 5.1 流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Suno + RVC Rap 生成流程                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: 用户声音克隆                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  用户录音 → RVC 训练 → 用户 RVC 模型                              │   │
│  │                    ↑                                             │   │
│  │              自托管 RVC 服务                                      │   │
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
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 4: 人声分离                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Suno Rap → Demucs (自托管) → 人声 + 伴奏                         │   │
│  │                    ↑                                             │   │
│  │              自托管 Demucs 服务                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 5: RVC 音色替换                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Suno 人声 + 用户 RVC 模型 → RVC (自托管) → 用户音色 Rap           │   │
│  │                    ↑                                             │   │
│  │              自托管 RVC 服务                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  Step 6: 混音合成                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  用户音色 Rap + 固定 BGM → FFmpeg → 最终成品                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 API 调用示例

```typescript
// src/lib/services/rap-generator.ts

import { getSunoClient } from '@/lib/music/suno-client'
import { callRvcService } from '@/lib/services/rvc-client'
import { callDemucsService } from '@/lib/services/demucs-client'
import { mixAudio } from '@/lib/audio/ffmpeg-processor'

interface RapGenerationParams {
  lyrics: string
  dialect: DialectCode
  userId: string
  voiceModelId: string  // 用户训练好的 RVC 模型 ID
  bgmUrl: string        // 固定 BGM
}

export async function generateRapSunoRvc(params: RapGenerationParams) {
  const { lyrics, dialect, userId, voiceModelId, bgmUrl } = params

  // Step 1: Suno 生成 Rap
  console.log('[Rap Generator] Step 1: Generating Rap with Suno...')
  const sunoClient = getSunoClient()
  const sunoResult = await sunoClient.generate({
    lyrics,
    dialect,
    style: 'rap',
  })

  if (!sunoResult.audioUrl) {
    throw new Error('Suno generation failed')
  }

  // Step 2: Demucs 人声分离
  console.log('[Rap Generator] Step 2: Separating vocals with Demucs...')
  const demucsResult = await callDemucsService({
    audioUrl: sunoResult.audioUrl,
    model: 'htdemucs',
  })

  if (!demucsResult.vocals) {
    throw new Error('Demucs separation failed')
  }

  // Step 3: RVC 音色替换
  console.log('[Rap Generator] Step 3: Converting voice with RVC...')
  const rvcResult = await callRvcService({
    inputAudio: demucsResult.vocals,
    voiceModel: voiceModelId,
    f0Method: 'crepe',
    f0UpKey: 0,
  })

  if (!rvcResult.outputAudio) {
    throw new Error('RVC conversion failed')
  }

  // Step 4: FFmpeg 混音
  console.log('[Rap Generator] Step 4: Mixing with BGM...')
  const finalAudio = await mixAudio({
    vocalsUrl: rvcResult.outputAudio,
    bgmUrl: bgmUrl,
    outputFormat: 'mp3',
  })

  return {
    audioUrl: finalAudio.url,
    duration: finalAudio.duration,
  }
}
```

---

## 六、部署步骤

### 6.1 服务器准备

```bash
# 1. 购买 GPU 服务器（阿里云/腾讯云/AutoDL）
# 推荐: RTX 3090 或 RTX 4090

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

### 6.2 部署服务

```bash
# 1. 克隆项目
git clone https://github.com/your-org/whyfire-services.git
cd whyfire-services

# 2. 下载 RVC 预训练模型
mkdir -p models/rvc
# 从官方下载或使用已有模型

# 3. 启动服务
docker-compose up -d

# 4. 验证服务
curl http://localhost:8001/health  # RVC
curl http://localhost:8002/health  # Demucs
curl http://localhost:8003/health  # FFmpeg
```

### 6.3 配置 Nginx

```nginx
# nginx.conf
upstream rvc {
    server rvc-server:8000;
}

upstream demucs {
    server demucs-server:8000;
}

upstream ffmpeg {
    server ffmpeg-server:8000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # HTTPS 重定向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # RVC API
    location /rvc/ {
        proxy_pass http://rvc/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }

    # Demucs API
    location /demucs/ {
        proxy_pass http://demucs/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }

    # FFmpeg API
    location /ffmpeg/ {
        proxy_pass http://ffmpeg/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }
}
```

---

## 七、环境变量配置

在 `.env` 中添加：

```bash
# 自托管服务地址
RVC_API_URL=http://your-gpu-server:8001
DEMUCS_API_URL=http://your-gpu-server:8002
FFMPEG_API_URL=http://your-gpu-server:8003

# 或者通过 Nginx 代理
# RVC_API_URL=https://api.yourdomain.com/rvc
# DEMUCS_API_URL=https://api.yourdomain.com/demucs
# FFMPEG_API_URL=https://api.yourdomain.com/ffmpeg
```

---

## 八、成本估算

### 8.1 云 GPU 服务器成本

| 配置 | 月费用（按需） | 月费用（包年） | 说明 |
|------|---------------|---------------|------|
| RTX 3060 | ¥800-1200 | ¥600-900 | 最低配置 |
| RTX 3090 | ¥2000-3000 | ¥1500-2200 | 推荐配置 |
| RTX 4090 | ¥4000-5000 | ¥3000-3800 | 高性能 |

### 8.2 API 调用成本

| 服务 | 单次成本 | 说明 |
|------|----------|------|
| Suno API | ¥0.5-1/首 | Evolink 代理 |
| Claude API | ¥0.1-0.3/次 | 歌词生成 |
| 自托管 RVC | ¥0 | 仅服务器成本 |
| 自托管 Demucs | ¥0 | 仅服务器成本 |

### 8.3 总成本估算

- **最低配置**：¥1000-1500/月（按需使用）
- **推荐配置**：¥2000-3000/月（稳定服务）
- **高并发配置**：¥5000+/月（多实例）

---

## 九、监控与运维

### 9.1 健康检查

```bash
# 添加到 crontab，每 5 分钟检查一次
*/5 * * * * /path/to/health-check.sh
```

```bash
#!/bin/bash
# health-check.sh

services=("rvc" "demucs" "ffmpeg")
ports=("8001" "8002" "8003")

for i in ${!services[@]}; do
  service=${services[$i]}
  port=${ports[$i]}

  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)

  if [ $response != "200" ]; then
    echo "$(date) - $service is down, restarting..."
    docker-compose restart $service-server
    # 发送告警（可选）
    # curl -X POST "https://your-webhook" -d "Service $service is down"
  fi
done
```

### 9.2 日志

```bash
# 查看服务日志
docker-compose logs -f rvc-server
docker-compose logs -f demucs-server

# 日志持久化
# 在 docker-compose.yml 中添加:
# volumes:
#   - ./logs:/app/logs
```

---

## 十、下一步

1. **服务器采购**：选择云服务商，购买 GPU 服务器
2. **模型准备**：下载 RVC 预训练模型
3. **服务部署**：按照本文档部署 Docker Compose
4. **客户端集成**：创建 RVC 和 Demucs 客户端代码
5. **端到端测试**：完成 5 步流程的完整测试

---

*文档版本: v1.0*
*创建时间: 2026-03-25*
*状态: 待部署*
