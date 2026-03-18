#!/bin/bash

# WhyFire Worktrees 设置脚本
# 使用方法: ./scripts/setup-worktrees.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🛠️  WhyFire Worktrees 设置"
echo "=========================="
echo ""

# 检查是否在 git 仓库中
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ 错误: 不在 Git 仓库中"
    exit 1
fi

# 暂存当前更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📦 暂存当前更改..."
    git stash push -m "Auto-stash before worktree setup"
fi

# 创建 worktrees 目录
echo "📁 创建 worktrees..."
mkdir -p "$PROJECT_ROOT/.worktrees"

# 创建三个 Agent 的 worktrees
echo ""
echo "🌳 创建 Builder worktree..."
git worktree add "$PROJECT_ROOT/.worktrees/builder" -b agent/builder 2>/dev/null || {
    echo "⚠️  Builder worktree 已存在,跳过"
}

echo "🌳 创建 Verifier worktree..."
git worktree add "$PROJECT_ROOT/.worktrees/verifier" -b agent/verifier 2>/dev/null || {
    echo "⚠️  Verifier worktree 已存在,跳过"
}

echo "🌳 创建 Reviewer worktree..."
git worktree add "$PROJECT_ROOT/.worktrees/reviewer" -b agent/reviewer 2>/dev/null || {
    echo "⚠️  Reviewer worktree 已存在,跳过"
}

# 创建协调目录
echo ""
echo "🔗 创建协调中心..."
mkdir -p "$PROJECT_ROOT/.coordination"

# 创建初始状态文件(如果不存在)
if [ ! -f "$PROJECT_ROOT/.coordination/task-queue.json" ]; then
    echo "📋 初始化任务队列..."
    cat > "$PROJECT_ROOT/.coordination/task-queue.json" << 'TASKQUEUE'
{
  "tasks": [],
  "metadata": {
    "project": "WhyFire v2.0",
    "sprint": "MVP-01",
    "updated_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }
}
TASKQUEUE
fi

# 初始化状态文件
for agent in builder verifier reviewer; do
    file="$PROJECT_ROOT/.coordination/${agent}-status.json"
    if [ ! -f "$file" ]; then
        echo "📊 初始化 ${agent} 状态..."
        cat > "$file" << STATUS
{
  "agent": "${agent}",
  "worktree": ".worktrees/${agent}",
  "branch": "agent/${agent}",
  "status": "idle",
  "current_task": null,
  "last_activity": null
}
STATUS
    fi
done

# 添加到 .gitignore
echo ""
echo "🙈 更新 .gitignore..."
if ! grep -q ".worktrees/" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    echo -e "\n# Multi-Agent Worktrees\n.worktrees/\n.coordination/" >> "$PROJECT_ROOT/.gitignore"
    echo "✅ 已添加 .worktrees/ 和 .coordination/ 到 .gitignore"
fi

# 显示最终状态
echo ""
echo "✅ 设置完成!"
echo ""
echo "📊 Worktrees 列表:"
git worktree list
echo ""
echo "🎯 下一步:"
echo "   1. 添加任务到 .coordination/task-queue.json"
echo "   2. 启动多Agent环境: ./scripts/start-agents.sh"
echo "   或"
echo "   3. 手动在三个终端窗口中运行:"
echo "      Terminal 1: cd $PROJECT_ROOT/.worktrees/builder && claude"
echo "      Terminal 2: cd $PROJECT_ROOT/.worktrees/verifier && claude"
echo "      Terminal 3: cd $PROJECT_ROOT/.worktrees/reviewer && claude"
