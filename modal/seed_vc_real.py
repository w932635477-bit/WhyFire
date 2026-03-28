"""
Seed-VC 真实版本 - Modal GPU 部署（异步模式）

用途：
- 零样本声音克隆（Rap 歌声转换）
- 异步处理：submit 返回 task_id → status 轮询结果
- 解决 Modal Web Endpoint 60 秒 HTTP 超时限制

部署：
  modal deploy modal/seed_vc_real.py

测试：
  modal serve modal/seed_vc_real.py
"""

import modal
import os
import tempfile
import time

# 创建 Modal App
app = modal.App("seed-vc-real")

# 定义容器镜像
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("ffmpeg", "libsndfile1", "git", "wget")
    .pip_install(
        "torch==2.4.0",
        "torchvision==0.19.0",
        "torchaudio==2.4.0",
        "scipy==1.13.1",
        "librosa==0.10.2",
        "huggingface-hub>=0.28.1",
        "munch==4.0.0",
        "einops==0.8.0",
        "descript-audio-codec==1.0.0",
        "pydub==0.25.1",
        "resemblyzer",
        "transformers==4.46.3",
        "soundfile==0.12.1",
        "numpy==1.26.4",
        "hydra-core==1.3.2",
        "pyyaml",
        "accelerate",
        "fastapi>=0.104",
        "python-multipart",
        "httpx",
        "pydantic",
    )
    .run_commands(
        "cd /root && git clone https://github.com/Plachtaa/seed-vc.git",
        "cd /root/seed-vc && pip install -e . || true",
    )
)

# 共享存储
volume = modal.Volume.from_name("seed-vc-models", create_if_missing=True)
task_store = modal.Dict.from_name("seed-vc-tasks", create_if_missing=True)
MODEL_DIR = "/root/models"

from pydantic import BaseModel
from typing import Optional


class ConvertRequest(BaseModel):
    """声音转换请求"""
    source_audio_url: Optional[str] = None
    reference_audio_url: Optional[str] = None
    source_audio_base64: Optional[str] = None
    reference_audio_base64: Optional[str] = None
    f0_condition: Optional[bool] = True
    fp16: Optional[bool] = True
    diffusion_steps: Optional[int] = 10
    length_adjust: Optional[float] = 1.0
    inference_cfg_rate: Optional[float] = 0.7


@app.cls(
    image=image,
    gpu="A10G",
    timeout=600,
    memory=16384,
    volumes={MODEL_DIR: volume},
    scaledown_window=300,
    min_containers=1,
)
class SeedVC:
    """Seed-VC 声音转换服务（异步模式）"""

    @modal.enter()
    def setup(self):
        import sys
        sys.path.insert(0, "/root/seed-vc")
        if not os.environ.get("HF_ENDPOINT"):
            os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
        os.environ["HF_HOME"] = MODEL_DIR
        self.model_loaded = False
        print("Seed-VC setup complete")

    def _get_audio_data(self, url, base64_data, label):
        import base64 as b64mod
        import httpx

        if url:
            print(f"Downloading {label} from URL: {url[:100]}...")
            with httpx.Client(timeout=120) as client:
                resp = client.get(url)
                resp.raise_for_status()
                data = resp.content
            print(f"  Downloaded {label}: {len(data)} bytes")
            return data

        if base64_data:
            raw = base64_data
            if raw.startswith("data:"):
                raw = raw.split(",", 1)[1]
            data = b64mod.b64decode(raw)
            print(f"  Decoded {label}: {len(data)} bytes")
            return data

        raise ValueError(f"No audio source for {label}")

    @modal.method()
    def process(self, task_id: str, request_data: dict):
        """GPU 推理（后台运行，不受 60 秒 HTTP 限制）"""
        import subprocess
        import base64
        from pathlib import Path

        request = ConvertRequest(**request_data)
        start_time = time.time()

        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                source_path = Path(tmpdir) / "source.wav"
                reference_path = Path(tmpdir) / "reference.wav"
                output_dir = Path(tmpdir) / "output"
                output_dir.mkdir()

                source_path.write_bytes(
                    self._get_audio_data(request.source_audio_url, request.source_audio_base64, "source")
                )
                reference_path.write_bytes(
                    self._get_audio_data(request.reference_audio_url, request.reference_audio_base64, "reference")
                )

                cmd = [
                    "python", "/root/seed-vc/inference.py",
                    "--source", str(source_path),
                    "--target", str(reference_path),
                    "--output", str(output_dir),
                    "--diffusion-steps", str(request.diffusion_steps),
                    "--length-adjust", str(request.length_adjust),
                    "--inference-cfg-rate", str(request.inference_cfg_rate),
                    "--f0-condition", str(request.f0_condition).lower(),
                    "--fp16", str(request.fp16).lower(),
                ]

                print(f"Running inference: {' '.join(cmd)}")
                result = subprocess.run(
                    cmd, capture_output=True, text=True,
                    timeout=500, env={**os.environ, "HF_HOME": MODEL_DIR}
                )

                if result.returncode != 0:
                    task_store[task_id] = {
                        "status": "failed", "task_id": task_id,
                        "processing_time": time.time() - start_time,
                        "error": f"Inference failed: {result.stderr[:500]}",
                    }
                    return

                output_files = list(output_dir.glob("*.wav"))
                if not output_files:
                    task_store[task_id] = {
                        "status": "failed", "task_id": task_id,
                        "processing_time": time.time() - start_time,
                        "error": "No output file generated",
                    }
                    return

                output_data = output_files[0].read_bytes()
                output_base64 = base64.b64encode(output_data).decode()
                duration = len(output_data) / (44100 * 2 * 2)
                processing_time = time.time() - start_time

                task_store[task_id] = {
                    "status": "completed", "task_id": task_id,
                    "output_audio": f"data:audio/wav;base64,{output_base64}",
                    "duration": duration,
                    "processing_time": processing_time,
                }
                print(f"Completed in {processing_time:.2f}s")

        except subprocess.TimeoutExpired:
            task_store[task_id] = {
                "status": "failed", "task_id": task_id,
                "processing_time": time.time() - start_time,
                "error": "Inference timeout (>500s)",
            }
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            task_store[task_id] = {
                "status": "failed", "task_id": task_id,
                "processing_time": time.time() - start_time,
                "error": str(e)[:500],
            }

    @modal.fastapi_endpoint(method="POST", docs=True)
    def convert(self, request: ConvertRequest):
        """提交声音转换任务（异步）- 立即返回 task_id"""
        task_id = f"vc-{int(time.time()*1000)}"

        # 初始化任务状态
        task_store[task_id] = {
            "status": "processing", "task_id": task_id,
            "processing_time": 0,
        }

        # 在 GPU 容器中异步执行推理
        self.process.spawn(task_id, request.model_dump())

        return {"task_id": task_id, "status": "processing"}

    @modal.fastapi_endpoint(method="GET", docs=True)
    def status(self, task_id: str):
        """查询任务状态"""
        if task_id in task_store:
            return task_store[task_id]
        return {"task_id": task_id, "status": "not_found"}

    @modal.fastapi_endpoint(method="GET", docs=True)
    def health(self):
        """健康检查"""
        return {
            "status": "ok",
            "mode": "real",
            "version": "2.0.0",
            "service": "seed-vc-real",
            "pattern": "async (submit + poll)",
        }


@app.local_entrypoint()
def test():
    print("Seed-VC Real v2 (async) deployed!")
    print("Submit: POST /convert  -> returns task_id")
    print("Status: GET /status?task_id=xxx  -> returns result when done")
