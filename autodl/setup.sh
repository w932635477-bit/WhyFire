#!/bin/bash
# ============================================================================
# Seed-VC AutoDL 一键部署脚本
#
# 使用方法:
#   1. 在 AutoDL 创建实例（推荐: A10 24GB, PyTorch 2.0 镜像）
#   2. 上传 autodl/ 目录到 /root/autodl/
#   3. chmod +x /root/autodl/setup.sh && bash /root/autodl/setup.sh
#
# AutoDL 默认开放端口: 6006
# 公网访问: https://region-xxxx.autodl.pro:6006
# ============================================================================

set -e

echo "============================================"
echo "  Seed-VC AutoDL 部署脚本"
echo "============================================"

# ---- 配置 ----
SEED_VC_DIR="${SEED_VC_DIR:-/root/seed-vc}"
MODEL_DIR="${MODEL_DIR:-/root/models}"
HF_MIRROR="${HF_ENDPOINT:-https://hf-mirror.com}"
PORT="${PORT:-6006}"

echo "[1/6] 安装系统依赖..."
apt-get update -qq
apt-get install -y -qq ffmpeg libsndfile1 wget git > /dev/null 2>&1
echo "  ffmpeg: $(ffmpeg -version 2>/dev/null | head -1 || echo 'installed')"

echo "[2/6] 克隆 Seed-VC..."
if [ ! -d "$SEED_VC_DIR" ]; then
    git clone https://github.com/Plachtaa/seed-vc.git "$SEED_VC_DIR"
else
    echo "  已存在，跳过克隆"
fi

echo "[3/6] 安装 Python 依赖..."
cd "$SEED_VC_DIR"
pip install -e . 2>/dev/null || true
pip install fastapi uvicorn httpx pydantic python-multipart 2>/dev/null
echo "  依赖安装完成"

echo "[4/6] 下载预训练模型..."
export HF_ENDPOINT="$HF_MIRROR"
export HF_HOME="$MODEL_DIR"
mkdir -p "$MODEL_DIR"

# Seed-VC 使用 huggingface_hub 自动下载模型
# 首次推理时会自动下载，这里预下载关键模型
python3 -c "
from huggingface_hub import snapshot_download
import os
os.environ['HF_ENDPOINT'] = '$HF_MIRROR'
os.environ['HF_HOME'] = '$MODEL_DIR'
print('Pre-downloading models...')
try:
    snapshot_download('Plachta/Seed-VC', local_dir='$MODEL_DIR/seed-vc')
    print('Models downloaded successfully')
except Exception as e:
    print(f'Model download: {e}')
    print('Models will be downloaded on first inference')
" 2>&1 || echo "  模型将在首次推理时自动下载"

echo "[5/6] 配置环境..."
# 写入环境变量到 bashrc
grep -q "SEED_VC_DIR" ~/.bashrc 2>/dev/null || {
    cat >> ~/.bashrc <<EOF

# Seed-VC AutoDL 配置
export SEED_VC_DIR="$SEED_VC_DIR"
export MODEL_DIR="$MODEL_DIR"
export HF_ENDPOINT="$HF_MIRROR"
export PORT="$PORT"
EOF
}

echo "[6/6] 启动服务..."
cd /root/autodl 2>/dev/null || cd "$(dirname "$0")"

# 停止已有进程
pkill -f "seed_vc_server.py" 2>/dev/null || true
sleep 1

# 后台启动
nohup python3 seed_vc_server.py > /root/seed-vc-server.log 2>&1 &
SERVER_PID=$!
echo "  服务已启动 (PID: $SERVER_PID)"
echo "  日志: tail -f /root/seed-vc-server.log"

# 等待服务启动
echo "  等待服务就绪..."
for i in $(seq 1 30); do
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo ""
        echo "============================================"
        echo "  部署成功!"
        echo "============================================"
        echo ""
        echo "  健康检查: curl http://localhost:$PORT/health"
        echo "  查看日志: tail -f /root/seed-vc-server.log"
        echo "  停止服务: kill $SERVER_PID"
        echo ""
        echo "  公网地址请在 AutoDL 控制台查看"
        echo "  配置到 .env.local:"
        echo "    SEEDVC_BACKEND=autodl"
        echo "    SEEDVC_AUTODL_URL=https://your-region.autodl.pro:$PORT"
        echo ""
        exit 0
    fi
    sleep 1
done

echo "  警告: 服务启动超时，请检查日志"
echo "  tail -f /root/seed-vc-server.log"
exit 1
