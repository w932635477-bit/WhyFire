#!/bin/bash
# Modal 手动认证脚本

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           Modal 手动认证                                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 检查是否已认证
if [ -f ~/.modal.toml ]; then
    echo "✓ 已找到 Modal 配置文件"
    echo ""
    echo "验证认证状态..."
    python3 -m modal app list 2>&1 | head -5
    exit 0
fi

echo "⚠ 未找到 Modal 认证配置"
echo ""
echo "请选择认证方式:"
echo ""
echo "1) 自动认证（推荐）"
echo "   - 将打开浏览器"
echo "   - 登录后自动保存 Token"
echo ""
echo "2) 手动认证"
echo "   - 从 Modal 网站获取 Token"
echo "   - 手动保存到配置文件"
echo ""
read -p "请选择 (1 或 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "启动自动认证..."
    echo "请在浏览器中完成登录。"
    echo ""
    python3 -m modal token new

elif [ "$choice" = "2" ]; then
    echo ""
    echo "步骤 1: 打开 Modal Token 页面"
    echo "  URL: https://modal.com/settings/tokens"
    echo ""
    read -p "按回车打开页面..." dummy
    open "https://modal.com/settings/tokens"

    echo ""
    echo "步骤 2: 在网页上点击 'Create Token'"
    echo "  - 输入 Token 名称 (例如: whyfire-cli)"
    echo "  - 点击 'Create'"
    echo "  - 复制生成的 Token (只显示一次)"
    echo ""
    read -p "粘贴你的 Token: " token

    if [ -z "$token" ]; then
        echo "✗ Token 不能为空"
        exit 1
    fi

    echo ""
    echo "步骤 3: 获取 Workspace ID"
    echo "  - 在 Modal 网站右上角可以看到你的 Workspace 名称"
    echo ""
    read -p "输入你的 Workspace ID (例如: your-name): " workspace

    if [ -z "$workspace" ]; then
        echo "✗ Workspace ID 不能为空"
        exit 1
    fi

    echo ""
    echo "保存配置到 ~/.modal.toml..."

    cat > ~/.modal.toml << EOF
[default]
token_id = "$workspace"
token_secret = "$token"
workspace = "$workspace"
EOF

    chmod 600 ~/.modal.toml

    echo "✓ 配置已保存"
    echo ""

    # 验证
    echo "验证认证..."
    if python3 -m modal app list &>/dev/null; then
        echo "✓ 认证成功"
    else
        echo "✗ 认证失败，请检查 Token"
        exit 1
    fi
else
    echo "✗ 无效选择"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "✓ Modal 认证完成"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "下一步:"
echo "  npm run modal:deploy    # 部署 Mock 版本"
echo "  npm run modal:verify    # 验证部署"
