"""
Seed-VC Mock 版本 - 快速测试 Modal 部署

用途：
- 验证 Modal 部署流程
- 测试 Web Endpoint 配置
- 无需真实模型，快速验证

部署：
  modal deploy modal/seed_vc_mock.py

测试：
  modal serve modal/seed_vc_mock.py
"""

import modal
import os

# 创建 Modal App
app = modal.App("seed-vc-mock")

# 定义容器镜像（轻量级）
image = (
    modal.Image.debian_slim()
    .pip_install("fastapi>=0.104", "python-multipart", "httpx", "pydantic")
)


# ============================================================================
# Web Endpoints - 使用独立函数而不是类方法
# ============================================================================

from pydantic import BaseModel
from typing import Optional


class ConvertRequest(BaseModel):
    """声音转换请求"""
    source_audio_url: str
    reference_audio_url: str
    f0_condition: Optional[bool] = True
    fp16: Optional[bool] = True


class ConvertResponse(BaseModel):
    """声音转换响应"""
    status: str
    task_id: str
    output_audio: str
    duration: float
    processing_time: float


@app.function(image=image, timeout=60, memory=512)
@modal.fastapi_endpoint(method="POST", docs=True)
def convert(request: ConvertRequest) -> ConvertResponse:
    """
    Mock 声音转换

    请求格式：
    {
        "source_audio_url": "https://example.com/source.mp3",
        "reference_audio_url": "https://example.com/reference.mp3",
        "f0_condition": true,
        "fp16": true
    }

    响应格式：
    {
        "status": "completed",
        "task_id": "mock-xxx",
        "output_audio": "...",
        "duration": 30.0,
        "processing_time": 0.1
    }
    """
    # Mock: 直接返回源音频 URL
    task_id = f"mock-{os.urandom(8).hex()}"

    return ConvertResponse(
        status="completed",
        task_id=task_id,
        output_audio=request.source_audio_url,  # Mock: 返回源音频
        duration=30.0,
        processing_time=0.1,
    )


@app.function(image=image)
@modal.fastapi_endpoint(method="GET", docs=True)
def health():
    """健康检查"""
    return {
        "status": "ok",
        "mode": "mock",
        "version": "0.2.0",
        "service": "seed-vc-mock",
    }


@app.function(image=image)
@modal.fastapi_endpoint(method="GET", docs=True)
def status(task_id: str):
    """查询任务状态（Mock 总是返回完成）"""
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

    print("🧪 测试 Mock 服务...")

    # 部署后获取 URL
    print("\n部署完成后，使用以下命令测试：")
    print("  curl https://your-workspace--seed-vc-mock.modal.run/health")
    print("")
    print("或运行验证脚本：")
    print("  npx tsx scripts/verify-modal-api.ts")


# ============================================================================
# 部署指南
# ============================================================================

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║           Seed-VC Mock 部署指南                          ║
╚══════════════════════════════════════════════════════════╝

1. 安装 Modal CLI:
   pip install modal

2. 配置认证:
   modal setup

3. 测试本地运行:
   modal serve modal/seed_vc_mock.py

4. 部署到生产:
   modal deploy modal/seed_vc_mock.py

5. 获取 Web Endpoint URL:
   查看 Actions 日志中的 URL

6. 配置 .env.local:
   MODAL_WEB_ENDPOINT_URL=https://your-workspace--seed-vc-mock.modal.run
   SEEDVC_BACKEND=modal

7. 验证部署:
   npx tsx scripts/verify-modal-api.ts

提示：
- Mock 版本不使用真实模型，仅验证流程
- 真实版本需要配置 GPU 和模型文件
- 参考文档: docs/MODAL_DEPLOYMENT.md
    """)



