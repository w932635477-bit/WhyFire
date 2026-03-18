#!/bin/bash

# WhyFire 多Agent启动脚本
# 使用方法: ./scripts/start-agents.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COORDINATION_DIR="$PROJECT_ROOT/.coordination"

echo "🚀 WhyFire 多Agent协同开发环境"
echo "================================"
echo ""

# 检查 worktrees 是否存在
if [ ! -d "$PROJECT_ROOT/.worktrees/builder" ]; then
    echo "❌ 错误: Worktrees 不存在"
    echo "请先运行: ./scripts/setup-worktrees.sh"
    exit 1
fi

echo "📁 项目结构:"
echo "   主项目:    $PROJECT_ROOT"
echo "   Builder:   $PROJECT_ROOT/.worktrees/builder"
echo "   Verifier:  $PROJECT_ROOT/.worktrees/verifier"
echo "   Reviewer:  $PROJECT_ROOT/.worktrees/reviewer"
echo ""

# 创建 tmux 会话
SESSION_NAME="whyfire-agents"

if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "⚠️  会话 '$SESSION_NAME' 已存在"
    echo "   附加到现有会话: tmux attach -t $SESSION_NAME"
    echo "   或关闭后重试: tmux kill-session -t $SESSION_NAME"
    exit 1
fi

echo "🖥️  创建 tmux 会话..."

# 创建主窗口 - Leader (协调者)
tmux new-session -d -s $SESSION_NAME -c "$PROJECT_ROOT" -n "leader"
tmux send-keys -t $SESSION_NAME:leader "echo '👑 Leader (协调者)' && echo '工作目录: $(pwd)' && echo '' && echo '协调命令:' && echo '  - 查看任务队列: cat .coordination/task-queue.json | jq' && echo '  - 查看所有状态: cat .coordination/*-status.json | jq' && echo '  - 更新任务: edit-task.sh'" C-m

# 创建 Builder 窗口
tmux new-window -t $SESSION_NAME -n "builder" -c "$PROJECT_ROOT/.worktrees/builder"
tmux send-keys -t $SESSION_NAME:builder "echo '🔨 Builder (代码编写)' && echo '工作目录: $(pwd)' && echo '分支: agent/builder' && echo '' && echo '工作流程:' && echo '  1. 获取任务: ./scripts/agent/get-task.sh builder' && echo '  2. 编写代码并提交' && echo '  3. 通知完成: ./scripts/agent/complete-task.sh builder <task-id>' && echo '' && echo '准备启动 Claude Code...' && claude" C-m

# 创建 Verifier 窗口
tmux new-window -t $SESSION_NAME -n "verifier" -c "$PROJECT_ROOT/.worktrees/verifier"
tmux send-keys -t $SESSION_NAME:verifier "echo '🔍 Verifier (代码验证)' && echo '工作目录: $(pwd)' && echo '分支: agent/verifier' && echo '' && echo '工作流程:' && echo '  1. 检查待验证任务: cat ../.coordination/builder-status.json | jq' && echo '  2. 拉取代码: git fetch origin agent/builder && git merge origin/agent/builder' && echo '  3. 运行测试: pnpm test' && echo '  4. 更新状态: ./scripts/agent/update-status.sh verifier <status>' && echo '' && echo '准备启动 Claude Code...' && claude" C-m

# 创建 Reviewer 窗口
tmux new-window -t $SESSION_NAME -n "reviewer" -c "$PROJECT_ROOT/.worktrees/reviewer"
tmux send-keys -t $SESSION_NAME:reviewer "echo '👀 Reviewer (代码审查)' && echo '工作目录: $(pwd)' && echo '分支: agent/reviewer' && echo '' && echo '工作流程:' && echo '  1. 检查待审查代码: cat ../.coordination/verifier-status.json | jq' && echo '  2. 拉取代码: git fetch origin agent/builder && git merge origin/agent/builder' && echo '  3. 审查代码并提供反馈' && echo '  4. 更新状态: ./scripts/agent/submit-review.sh'" C-m

echo ""
echo "✅ tmux 会话创建成功!"
echo ""
echo "📌 会话名称: $SESSION_NAME"
echo ""
echo "🎯 操作方法:"
echo ""
echo "  启动会话:"
echo "    tmux attach -t $SESSION_NAME"
echo ""
echo "  窗口切换 (在 tmux 中):"
echo "    Ctrl+b 0  → Leader (协调者)"
echo "    Ctrl+b 1  → Builder (编写代码)"
echo "    Ctrl+b 2  → Verifier (验证代码)"
echo "    Ctrl+b 3  → Reviewer (审查代码)"
echo ""
echo "  分屏视图 (推荐):"
echo "    Ctrl+b \"  → 垂直分屏"
echo "    Ctrl+b %  → 水平分屏"
echo ""
echo "  退出 tmux (保持后台运行):"
echo "    Ctrl+b d"
echo ""
echo "  关闭会话:"
echo "    tmux kill-session -t $SESSION_NAME"
echo ""

# 自动附加到会话
tmux attach -t $SESSION_NAME
