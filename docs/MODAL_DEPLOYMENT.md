# Modal 部署指南

本指南将帮助你在 Modal 上部署 Seed-VC 零样本声音克隆服务。

## 前置要求

- Modal 账号（免费试用）
- Python 3.10+
- Modal CLI

---

## 第一部分：Modal 账号设置（15 分钟）

### 1.1 注册 Modal 账号

```bash
# 访问 Modal 官网
open https://modal.com

# 点击 "Sign Up" 注册
# 可以使用 GitHub 或 Google 账号
```

### 1.2 安装 Modal CLI

```bash
# 安装 Modal Python 包
pip install modal

# 或使用 pipx
pipx install modal
```

### 1.3 配置认证

```bash
# 登录 Modal
modal token new

# 这会打开浏览器，创建 API Token
# Token 会保存在 ~/.modal.toml
```

### 1.4 验证配置

```bash
# 测试 Modal 是否配置成功
python -c "import modal; print(modal.Cls.lookup('modal', 'Example'))"

# 或运行示例
modal run --app-name hello-world <<EOF
import modal

app = modal.App("hello-world")

@app.local_entrypoint()
def main():
    print("Hello from Modal!")
EOF
```

---

## 第二部分：部署 Seed-VC（30 分钟）

### 2.1 创建 Modal 项目

```bash
# 创建项目目录
mkdir -p modal-seedvc
cd modal-seedvc

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安装依赖
pip install modal fastapi python-multipart
```

### 2.2 创建 Seed-VC 函数

创建 `seed_vc_app.py`:

```python
"""
Seed-VC 零样本声音克隆 - Modal 部署

运行：
  modal deploy seed_vc_app.py

测试：
  modal serve seed_vc_app.py
"""

import modal

# 创建 Modal App
app = modal.App("seed-vc")

# 定义容器镜像
image = (
    modal.Image.from_registry("python:3.11-slim")
    .apt_install(
        "ffmpeg",
        "libsndfile1",
        "git",
        "wget",
    )
    .pip_install(
        "torch>=2.0",
        "torchaudio>=2.0",
        "fastapi>=0.104",
        "python-multipart",
        "numpy",
        "scipy",
        "soundfile",
        "librosa",
        "pydub",
        # Seed-VC 依赖
        "transformers>=4.30",
        "diffusers>=0.21",
        "accelerate>=0.24",
        "einops",
        "torchvision",
    )
    .run_commands(
        # 克隆 Seed-VC 仓库
        "cd /root && git clone https://github.com/Plachtaa/seed-vc.git",
        "cd /root/seed-vc && pip install -e .",
        # 下载预训练模型（如果有）
        "cd /root/seed-vc && python -c \"from models import load_model; load_model()\" || true",
    )
)

# 创建卷用于模型缓存
volume = modal.Volume.from_name("seed-vc-models", create_if_missing=True)


@app.cls(
    image=image,
    gpu="A10G",  # 使用 A10G GPU
    timeout=300,  # 5 分钟超时
    volumes={"/root/models": volume},
    memory=16384,  # 16GB 内存
)
class SeedVC:
    @modal.enter()
    def load_model(self):
        """加载模型（容器启动时执行一次）"""
        import sys
        sys.path.insert(0, "/root/seed-vc")

        from models import load_seed_vc_model
        self.model = load_seed_vc_model()
        print("✓ Seed-VC model loaded")

    @modal.web_endpoint(method="POST")
    def convert(self, data: dict):
        """
        执行声音转换

        请求格式：
        {
            "source_audio_url": "https://...",
            "reference_audio_url": "https://...",
            "f0_condition": true,
            "fp16": true
        }
        """
        import tempfile
        import requests
        from pathlib import Path

        # 提取参数
        source_url = data.get("source_audio_url")
        reference_url = data.get("reference_audio_url")
        f0_condition = data.get("f0_condition", True)
        fp16 = data.get("fp16", True)

        if not source_url or not reference_url:
            return {"error": "Missing source_audio_url or reference_audio_url"}, 400

        try:
            # 下载音频文件
            with tempfile.TemporaryDirectory() as tmpdir:
                source_path = Path(tmpdir) / "source.wav"
                reference_path = Path(tmpdir) / "reference.wav"
                output_path = Path(tmpdir) / "output.wav"

                # 下载源音频
                response = requests.get(source_url, timeout=60)
                source_path.write_bytes(response.content)

                # 下载参考音频
                response = requests.get(reference_url, timeout=60)
                reference_path.write_bytes(response.content)

                # 执行转换
                from inference import convert_voice

                convert_voice(
                    source=str(source_path),
                    reference=str(reference_path),
                    output=str(output_path),
                    f0_condition=f0_condition,
                    fp16=fp16,
                )

                # 上传到 Modal Volume 或返回 base64
                # 这里返回临时的 URL 或 base64
                output_data = output_path.read_bytes()

                # 为了简化，我们返回 base64（实际生产应上传到 OSS）
                import base64
                output_base64 = base64.b64encode(output_data).decode()

                return {
                    "status": "completed",
                    "output_audio": f"data:audio/wav;base64,{output_base64}",
                    "duration": len(output_data) / 44100 / 2,  # 粗略估算
                }

        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
            }, 500

    @modal.web_endpoint(method="GET")
    def health(self):
        """健康检查"""
        return {"status": "ok", "model": "seed-vc"}


# 本地测试入口
@app.local_entrypoint()
def test():
    """本地测试函数"""
    import requests

    # 部署后获取 URL
    url = "https://your-workspace--seed-vc.modal.run/convert"

    response = requests.post(url, json={
        "source_audio_url": "https://example.com/source.mp3",
        "reference_audio_url": "https://example.com/reference.mp3",
        "f0_condition": True,
        "fp16": True,
    })

    print(response.json())


# 部署命令
if __name__ == "__main__":
    print("""
    部署步骤：

    1. 测试模式（本地调试）：
       modal serve seed_vc_app.py

    2. 部署到生产：
       modal deploy seed_vc_app.py

    3. 查看日志：
       modal app logs seed-vc

    4. 获取 Web Endpoint URL：
       modal app show seed-vc
    """)
```

### 2.3 创建简化版 Mock 函数（快速测试）

如果还没有 Seed-VC 模型，可以先部署一个 Mock 版本测试流程：

创建 `seed_vc_mock.py`:

```python
"""
Seed-VC Mock 版本 - 用于快速测试 Modal 部署流程
"""

import modal

app = modal.App("seed-vc-mock")

@app.cls(
    image=modal.Image.debian_slim().pip_install("fastapi", "python-multipart"),
    timeout=60,
)
class SeedVCMock:
    @modal.web_endpoint(method="POST")
    def convert(self, data: dict):
        """Mock 声音转换"""
        source_url = data.get("source_audio_url")
        reference_url = data.get("reference_audio_url")

        if not source_url or not reference_url:
            return {"error": "Missing parameters"}, 400

        # Mock: 直接返回源音频
        return {
            "status": "completed",
            "output_audio": source_url,  # Mock: 返回源音频
            "duration": 30.0,
            "processing_time": 0.1,
        }

    @modal.web_endpoint(method="GET")
    def health(self):
        return {"status": "ok", "mode": "mock"}


@app.local_entrypoint()
def main():
    print("部署 Mock 版本：modal deploy seed_vc_mock.py")
```

### 2.4 部署函数

```bash
# 测试 Mock 版本（推荐先测试）
modal serve seed_vc_mock.py

# 部署 Mock 版本
modal deploy seed_vc_mock.py

# 查看部署状态
modal app show seed-vc-mock

# 获取 Web Endpoint URL
# 输出示例：https://your-workspace--seed-vc-mock.modal.run
```

---

## 第三部分：配置 WhyFire 项目（10 分钟）

### 3.1 获取 Modal Web Endpoint URL

```bash
# 查看部署的 App
modal app show seed-vc-mock

# 或
modal app list

# 复制 Web Endpoint URL
# 示例：https://your-workspace--seed-vc-mock.modal.run
```

### 3.2 生成 API Token

```bash
# 方法 1: 使用 Modal CLI
modal token list

# 方法 2: 在 Modal Web UI 创建
open https://modal.com/settings/tokens
# 点击 "Create new token"
# 复制 Token（只显示一次）
```

### 3.3 配置 .env.local

```bash
# 编辑 .env.local
nano .env.local

# 添加以下配置
MODAL_WEB_ENDPOINT_URL=https://your-workspace--seed-vc-mock.modal.run
MODAL_API_TOKEN=your_modal_token_here
SEEDVC_BACKEND=modal
```

### 3.4 验证配置

```bash
# 运行验证脚本
npx tsx scripts/verify-modal-api.ts

# 期望输出：
# ✓ 环境变量已配置
# ✓ Modal 连通性测试: 成功
# ✓ 发现有效端点: /convert
```

### 3.5 运行集成测试

```bash
# 运行 Seed-VC 客户端测试
npx vitest run tests/integration/seed-vc-client.test.ts

# 运行完整流程测试
npx vitest run tests/integration/pipeline-steps.test.ts
```

---

## 第四部分：生产优化（可选）

### 4.1 使用 GPU

修改 `seed_vc_mock.py`:

```python
@app.cls(
    image=...,
    gpu="A10G",  # 添加 GPU
    timeout=300,  # 增加超时
    memory=16384,  # 增加内存
)
```

### 4.2 添加认证

```python
from fastapi import HTTPException, Header

@modal.web_endpoint(method="POST")
def convert(
    self,
    data: dict,
    authorization: str = Header(None),
):
    # 验证 API Token
    expected_token = os.environ.get("MODAL_API_TOKEN")
    if authorization != f"Bearer {expected_token}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 处理请求...
```

### 4.3 添加监控

```python
import modal

# 添加日志
@app.cls(...)
class SeedVC:
    @modal.enter()
    def setup(self):
        self.logger = modal.logger()

    def convert(self, data: dict):
        self.logger.info(f"Processing: {data.get('source_audio_url')}")
        # ...
```

### 4.4 配置自动扩缩容

```python
@app.cls(
    ...,
    concurrency_limit=10,  # 最大并发
    keep_warm=1,  # 保持 1 个实例预热
    allow_concurrent_inputs=5,  # 每个实例允许 5 个并发请求
)
```

---

## 常见问题

### Q1: Modal 部署失败

```bash
# 检查日志
modal app logs seed-vc-mock

# 常见错误：
# 1. Docker 构建失败 - 检查 apt_install 和 pip_install
# 2. 内存不足 - 增加 memory 参数
# 3. 超时 - 增加 timeout 参数
```

### Q2: 无法连接到 Web Endpoint

```bash
# 检查 URL 是否正确
echo $MODAL_WEB_ENDPOINT_URL

# 测试连接
curl https://your-workspace--seed-vc-mock.modal.run/health

# 检查防火墙设置
# Modal 默认允许公网访问
```

### Q3: 转换失败

```bash
# 查看详细错误
npx tsx scripts/verify-modal-api.ts

# 检查音频 URL 是否可访问
curl -I https://your-audio-url.mp3

# 检查 Modal 日志
modal app logs seed-vc-mock --follow
```

### Q4: 成本问题

```
Modal 定价（2024）：
- CPU: $0.000231 / vCPU-second
- GPU A10G: $0.000603 / GPU-second
- 内存: $0.0000231 / GB-second

估算（每次转换 30 秒）：
- GPU: 30s * $0.000603 = $0.018
- 内存（16GB）: 30s * 16 * $0.0000231 = $0.011
- 总计: ~$0.03 / 次

免费额度：$30/月（新用户）
```

---

## 下一步

1. **测试 Mock 版本** - 验证流程是否正确
2. **部署真实版本** - 添加 Seed-VC 模型
3. **配置 GPU** - 提升转换速度
4. **添加监控** - 跟踪使用情况
5. **优化成本** - 调整并发和预热设置

---

## 参考资源

- [Modal 官方文档](https://modal.com/docs)
- [Seed-VC GitHub](https://github.com/Plachtaa/seed-vc)
- [Modal 快速开始](https://modal.com/docs/guide)
- [Modal 定价](https://modal.com/pricing)
