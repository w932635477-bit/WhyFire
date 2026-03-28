"""
Seed-VC FastAPI 服务 - AutoDL 部署版

独立 FastAPI 服务，无 Modal 依赖。
在 AutoDL GPU 实例上运行，提供异步声音克隆 API。

使用:
  python seed_vc_server.py

端点:
  POST /convert   - 提交声音转换任务
  GET  /status    - 查询任务状态
  GET  /health    - 健康检查
"""

import os
import sys
import base64
import tempfile
import threading
import time
import subprocess
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import uvicorn

# ============================================================================
# 配置
# ============================================================================

SEED_VC_DIR = os.environ.get("SEED_VC_DIR", "/root/seed-vc")
MODEL_DIR = os.environ.get("MODEL_DIR", "/root/models")
HF_MIRROR = os.environ.get("HF_ENDPOINT", "https://hf-mirror.com")
PORT = int(os.environ.get("PORT", "6006"))
INFERENCE_TIMEOUT = int(os.environ.get("INFERENCE_TIMEOUT", "500"))

# 确保 seed-vc 在 Python 路径中
if SEED_VC_DIR not in sys.path:
    sys.path.insert(0, SEED_VC_DIR)

# 设置 HuggingFace 镜像
os.environ["HF_HOME"] = MODEL_DIR
if not os.environ.get("HF_ENDPOINT"):
    os.environ["HF_ENDPOINT"] = HF_MIRROR

# ============================================================================
# FastAPI 应用
# ============================================================================

app = FastAPI(title="Seed-VC Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 任务存储（线程安全）
# ============================================================================

task_store: dict = {}
task_lock = threading.Lock()

# ============================================================================
# 请求/响应模型
# ============================================================================

class ConvertRequest(BaseModel):
    """声音转换请求"""
    source_audio_url: Optional[str] = None
    reference_audio_url: Optional[str] = None
    source_audio_base64: Optional[str] = None
    reference_audio_base64: Optional[str] = None
    f0_condition: bool = True
    fp16: bool = True
    diffusion_steps: int = 10
    length_adjust: float = 1.0
    inference_cfg_rate: float = 0.7


# ============================================================================
# 工具函数
# ============================================================================

def get_audio_data(url: Optional[str], base64_data: Optional[str], label: str) -> bytes:
    """从 URL 或 Base64 获取音频数据"""
    if url:
        print(f"[SeedVC] Downloading {label} from URL ({len(url)} chars)...")
        with httpx.Client(timeout=120) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.content
        print(f"[SeedVC] Downloaded {label}: {len(data)} bytes")
        return data

    if base64_data:
        raw = base64_data
        if raw.startswith("data:"):
            raw = raw.split(",", 1)[1]
        data = base64.b64decode(raw)
        print(f"[SeedVC] Decoded {label}: {len(data)} bytes")
        return data

    raise ValueError(f"No audio source for {label}")


def run_inference(task_id: str, request_data: dict):
    """GPU 推理（后台线程）"""
    start_time = time.time()

    try:
        request = ConvertRequest(**request_data)

        with tempfile.TemporaryDirectory() as tmpdir:
            source_path = Path(tmpdir) / "source.wav"
            reference_path = Path(tmpdir) / "reference.wav"
            output_dir = Path(tmpdir) / "output"
            output_dir.mkdir()

            source_path.write_bytes(
                get_audio_data(request.source_audio_url, request.source_audio_base64, "source")
            )
            reference_path.write_bytes(
                get_audio_data(request.reference_audio_url, request.reference_audio_base64, "reference")
            )

            cmd = [
                sys.executable, f"{SEED_VC_DIR}/inference.py",
                "--source", str(source_path),
                "--target", str(reference_path),
                "--output", str(output_dir),
                "--diffusion-steps", str(request.diffusion_steps),
                "--length-adjust", str(request.length_adjust),
                "--inference-cfg-rate", str(request.inference_cfg_rate),
                "--f0-condition", str(request.f0_condition).lower(),
                "--fp16", str(request.fp16).lower(),
            ]

            print(f"[SeedVC] Running inference: {' '.join(cmd)}")
            result = subprocess.run(
                cmd, capture_output=True, text=True,
                timeout=INFERENCE_TIMEOUT,
                env={**os.environ, "HF_HOME": MODEL_DIR}
            )

            if result.returncode != 0:
                with task_lock:
                    task_store[task_id] = {
                        "status": "failed", "task_id": task_id,
                        "processing_time": time.time() - start_time,
                        "error": f"Inference failed: {result.stderr[:500]}",
                    }
                return

            output_files = list(output_dir.glob("*.wav"))
            if not output_files:
                with task_lock:
                    task_store[task_id] = {
                        "status": "failed", "task_id": task_id,
                        "processing_time": time.time() - start_time,
                        "error": "No output file generated",
                    }
                return

            output_data = output_files[0].read_bytes()
            output_base64 = base64.b64encode(output_data).decode()
            duration = len(output_data) / (44100 * 2 * 2)  # 估算时长
            processing_time = time.time() - start_time

            with task_lock:
                task_store[task_id] = {
                    "status": "completed", "task_id": task_id,
                    "output_audio": f"data:audio/wav;base64,{output_base64}",
                    "duration": duration,
                    "processing_time": processing_time,
                }
            print(f"[SeedVC] Completed in {processing_time:.2f}s")

    except subprocess.TimeoutExpired:
        with task_lock:
            task_store[task_id] = {
                "status": "failed", "task_id": task_id,
                "processing_time": time.time() - start_time,
                "error": f"Inference timeout (>{INFERENCE_TIMEOUT}s)",
            }
    except Exception as e:
        print(f"[SeedVC] Error: {e}")
        import traceback
        traceback.print_exc()
        with task_lock:
            task_store[task_id] = {
                "status": "failed", "task_id": task_id,
                "processing_time": time.time() - start_time,
                "error": str(e)[:500],
            }


# ============================================================================
# API 端点
# ============================================================================

@app.post("/convert")
async def convert(request: ConvertRequest):
    """提交声音转换任务（异步）"""
    task_id = f"vc-{int(time.time() * 1000)}"

    with task_lock:
        task_store[task_id] = {
            "status": "processing", "task_id": task_id,
            "processing_time": 0,
        }

    # 后台线程执行推理
    thread = threading.Thread(
        target=run_inference,
        args=(task_id, request.model_dump()),
        daemon=True,
    )
    thread.start()

    return {"task_id": task_id, "status": "processing"}


@app.get("/status")
async def status(task_id: str):
    """查询任务状态"""
    with task_lock:
        if task_id in task_store:
            return task_store[task_id]
    return {"task_id": task_id, "status": "not_found"}


@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "ok",
        "mode": "autodl",
        "version": "1.0.0",
        "service": "seed-vc-autodl",
        "pattern": "async (submit + poll)",
        "model_dir": SEED_VC_DIR,
        "gpu": "available",
    }


# ============================================================================
# 启动入口
# ============================================================================

if __name__ == "__main__":
    print("=" * 50)
    print("Seed-VC AutoDL Server")
    print(f"  Seed-VC dir: {SEED_VC_DIR}")
    print(f"  Model dir:   {MODEL_DIR}")
    print(f"  HF mirror:   {HF_MIRROR}")
    print(f"  Port:        {PORT}")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
