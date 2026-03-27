"""
Seed-VC 真实版本 - Modal GPU 部署

用途：
- 零样本声音克隆（Rap 歌声转换）
- 使用 seed-uvit-whisper-base 模型（44.1kHz）
- 支持 f0-condition 模式

部署：
  modal deploy modal/seed_vc_real.py

测试：
  modal serve modal/seed_vc_real.py

注意：
- 首次部署会自动下载模型（约 200MB）
- 需要 A10G GPU（推荐）
- 每次推理约 $0.02-0.05
"""

import modal
import os
import tempfile
import time

# 创建 Modal App
app = modal.App("seed-vc-real")

# 定义容器镜像（包含所有依赖）
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "ffmpeg",
        "libsndfile1",
        "git",
        "wget",
    )
    .pip_install(
        # 核心依赖
        "torch>=2.0",
        "torchaudio>=2.0",
        "fastapi>=0.104",
        "python-multipart",
        "httpx",
        "pydantic",
        "numpy",
        "scipy",
        "soundfile",
        "librosa",
        # Seed-VC 依赖
        "transformers>=4.30",
        "diffusers>=0.21",
        "accelerate>=0.24",
        "einops",
        "torchaudio",
        "omegaconf",
        "hydra-core",
        # HuggingFace
        "huggingface_hub",
    )
    .run_commands(
        # 克隆 Seed-VC 仓库（2025-11 归档，但仍然可用）
        "cd /root && git clone https://github.com/Plachtaa/seed-vc.git",
        "cd /root/seed-vc && pip install -e . || true",
    )
)

# 创建 Volume 用于缓存模型
volume = modal.Volume.from_name("seed-vc-models", create_if_missing=True)
MODEL_DIR = "/root/models"


# ============================================================================
# Pydantic 模型
# ============================================================================

from pydantic import BaseModel
from typing import Optional


class ConvertRequest(BaseModel):
    """声音转换请求"""
    source_audio_url: str
    reference_audio_url: str
    f0_condition: Optional[bool] = True  # Rap 模式必须为 True
    fp16: Optional[bool] = True
    diffusion_steps: Optional[int] = 25  # 推荐 30-50 用于歌声转换
    length_adjust: Optional[float] = 1.0
    inference_cfg_rate: Optional[float] = 0.7


class ConvertResponse(BaseModel):
    """声音转换响应"""
    status: str
    task_id: str
    output_audio: Optional[str] = None
    duration: Optional[float] = None
    processing_time: float
    error: Optional[str] = None


# ============================================================================
# Seed-VC 服务类
# ============================================================================

@app.cls(
    image=image,
    gpu="A10G",  # 使用 A10G GPU
    timeout=600,  # 10 分钟超时
    memory=16384,  # 16GB 内存
    volumes={MODEL_DIR: volume},
    scaledown_window=120,  # 2 分钟无请求后停止
)
class SeedVC:
    """Seed-VC 声音转换服务"""

    @modal.enter()
    def setup(self):
        """加载模型（容器启动时执行一次）"""
        import sys
        print("🔄 Setting up Seed-VC...")

        # 添加 Seed-VC 到路径
        sys.path.insert(0, "/root/seed-vc")

        # 设置 HuggingFace 镜像（国内网络）
        if not os.environ.get("HF_ENDPOINT"):
            os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

        # 设置模型缓存目录
        os.environ["HF_HOME"] = MODEL_DIR

        self.model_loaded = False
        print("✓ Seed-VC setup complete (model will load on first inference)")

    def _load_model(self, f0_condition: bool = True):
        """延迟加载模型"""
        if self.model_loaded:
            return

        import sys
        sys.path.insert(0, "/root/seed-vc")

        # 模型会在首次推理时自动下载
        print(f"📦 Model will be downloaded on first inference (f0_condition={f0_condition})")
        self.model_loaded = True

    @modal.fastapi_endpoint(method="POST", docs=True)
    def convert(self, request: ConvertRequest) -> ConvertResponse:
        """
        执行声音转换

        请求格式：
        {
            "source_audio_url": "https://example.com/source.wav",
            "reference_audio_url": "https://example.com/reference.wav",
            "f0_condition": true,
            "fp16": true,
            "diffusion_steps": 25
        }

        响应格式：
        {
            "status": "completed",
            "task_id": "xxx",
            "output_audio": "base64 or URL",
            "duration": 30.0,
            "processing_time": 5.2
        }
        """
        import httpx
        import subprocess
        import base64
        from pathlib import Path

        start_time = time.time()
        task_id = f"vc-{int(time.time()*1000)}"

        try:
            # 确保模型已加载
            self._load_model(request.f0_condition)

            with tempfile.TemporaryDirectory() as tmpdir:
                source_path = Path(tmpdir) / "source.wav"
                reference_path = Path(tmpdir) / "reference.wav"
                output_dir = Path(tmpdir) / "output"
                output_dir.mkdir()

                # 下载源音频
                print(f"📥 Downloading source audio: {request.source_audio_url}")
                with httpx.Client(timeout=60) as client:
                    resp = client.get(request.source_audio_url)
                    resp.raise_for_status()
                    source_path.write_bytes(resp.content)

                # 下载参考音频
                print(f"📥 Downloading reference audio: {request.reference_audio_url}")
                with httpx.Client(timeout=60) as client:
                    resp = client.get(request.reference_audio_url)
                    resp.raise_for_status()
                    reference_path.write_bytes(resp.content)

                # 构建 inference 命令
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

                print(f"🎵 Running inference: {' '.join(cmd)}")
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=500,  # 8 分钟超时
                    env={**os.environ, "HF_HOME": MODEL_DIR}
                )

                if result.returncode != 0:
                    print(f"❌ Inference failed: {result.stderr}")
                    return ConvertResponse(
                        status="failed",
                        task_id=task_id,
                        processing_time=time.time() - start_time,
                        error=f"Inference failed: {result.stderr[:500]}"
                    )

                # 查找输出文件
                output_files = list(output_dir.glob("*.wav"))
                if not output_files:
                    return ConvertResponse(
                        status="failed",
                        task_id=task_id,
                        processing_time=time.time() - start_time,
                        error="No output file generated"
                    )

                output_path = output_files[0]
                print(f"✅ Output generated: {output_path}")

                # 读取输出文件并转换为 base64
                output_data = output_path.read_bytes()
                output_base64 = base64.b64encode(output_data).decode()

                # 估算时长（44100Hz, 16bit stereo）
                duration = len(output_data) / (44100 * 2 * 2)

                processing_time = time.time() - start_time
                print(f"⏱️ Total processing time: {processing_time:.2f}s")

                return ConvertResponse(
                    status="completed",
                    task_id=task_id,
                    output_audio=f"data:audio/wav;base64,{output_base64}",
                    duration=duration,
                    processing_time=processing_time,
                )

        except httpx.TimeoutException:
            return ConvertResponse(
                status="failed",
                task_id=task_id,
                processing_time=time.time() - start_time,
                error="Timeout downloading audio files"
            )
        except subprocess.TimeoutExpired:
            return ConvertResponse(
                status="failed",
                task_id=task_id,
                processing_time=time.time() - start_time,
                error="Inference timeout (>500s)"
            )
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return ConvertResponse(
                status="failed",
                task_id=task_id,
                processing_time=time.time() - start_time,
                error=str(e)[:500]
            )

    @modal.fastapi_endpoint(method="GET", docs=True)
    def health(self):
        """健康检查"""
        return {
            "status": "ok",
            "mode": "real",
            "version": "1.0.0",
            "service": "seed-vc-real",
            "model": "seed-uvit-whisper-base",
            "sample_rate": 44100,
        }

    @modal.fastapi_endpoint(method="GET", docs=True)
    def status(self, task_id: str):
        """查询任务状态（简化版，总是返回完成）"""
        return {
            "task_id": task_id,
            "status": "completed",
            "progress": 100,
        }


# ============================================================================
# 本地测试入口
# ============================================================================

@app.local_entrypoint()
def test():
    """本地测试"""
    import httpx

    print("🧪 测试 Seed-VC Real 服务...")
    print("\n部署完成后，使用以下命令测试：")
    print("  curl https://your-workspace--seed-vc-real.modal.run/health")
    print("")
    print("或运行验证脚本：")
    print("  npx tsx scripts/verify-modal-api.ts")


# ============================================================================
# 部署指南
# ============================================================================

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║           Seed-VC Real 部署指南                          ║
╚══════════════════════════════════════════════════════════╝

1. 测试本地运行:
   modal serve modal/seed_vc_real.py

2. 部署到生产:
   modal deploy modal/seed_vc_real.py

3. 获取 Web Endpoint URL:
   modal app show seed-vc-real

4. 配置 .env.local:
   MODAL_WEB_ENDPOINT_URL=https://your-workspace--seed-vc-real.modal.run
   SEEDVC_BACKEND=modal

5. 验证部署:
   curl https://your-workspace--seed-vc-real.modal.run/health

成本估算（每次转换 30 秒音频）：
- GPU A10G: 30s * $0.000603 ≈ $0.018
- 内存 16GB: 30s * 16 * $0.0000231 ≈ $0.011
- 总计: ~$0.03 / 次

提示：
- 首次部署会下载模型（约 200MB）
- 使用 Volume 缓存模型，避免重复下载
- 建议使用 keep_warm=1 保持预热（可选）
    """)
