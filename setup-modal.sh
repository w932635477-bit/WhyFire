#!/bin/bash
# Modal 快速设置脚本
# 使用: ./setup-modal.sh

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           Modal 快速部署向导                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 未安装"
    echo "  请安装 Python 3.10+: https://www.python.org/downloads/"
    exit 1
fi
echo "✓ Python 已安装"

# 检查 Modal CLI
if ! command -v modal &> /dev/null; then
    echo "⚠ Modal CLI 未安装"
    read -p "  是否自动安装？(y/n) " install
    if [ "$install" = "y" ]; then
        pip install modal
        echo "✓ Modal CLI 安装完成"
    else
        echo "  请手动安装: pip install modal"
        exit 1
    fi
else
    echo "✓ Modal CLI 已安装"
fi

# 检查 Modal 认证
if [ ! -f ~/.modal.toml ]; then
    echo "⚠ 未配置 Modal 认证"
    read -p "  是否现在登录？(y/n) " login
    if [ "$login" = "y" ]; then
        modal token new
        echo "✓ Modal 认证完成"
    else
        echo "  请手动运行: modal token new"
        exit 1
    fi
else
    echo "✓ Modal 已认证"
fi

# 部署 Mock 版本
echo ""
read -p "是否部署 Mock 版本到 Modal？(y/n) " deploy
if [ "$deploy" = "y" ]; then
    echo "部署中..."
    modal deploy modal/seed_vc_mock.py
    echo "✓ 部署成功"

    # 获取 URL
    echo ""
    echo "查看 Web Endpoint URL:"
    echo "  modal app show seed-vc-mock"
    echo ""
    echo "配置 .env.local:"
    echo "  MODAL_WEB_ENDPOINT_URL=https://your-workspace--seed-vc-mock.modal.run"
    echo "  SEEDVC_BACKEND=modal"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "✓ Modal 设置完成"
echo "╚══════════════════════════════════════════════════════════╝"
