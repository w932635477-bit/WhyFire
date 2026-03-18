#!/bin/bash

# Agent 获取任务脚本
# 使用方法: ./scripts/agent/get-task.sh <agent-name>

AGENT_NAME=${1:-"builder"}
COORDINATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/.coordination"

if [ ! -f "$COORDINATION_DIR/task-queue.json" ]; then
    echo "❌ 错误: 任务队列文件不存在"
    exit 1
fi

# 获取下一个待处理的任务
TASK=$(jq -r '.tasks[] | select(.status == "pending" and .assigned_to == null) | .id' "$COORDINATION_DIR/task-queue.json" | head -1)

if [ -z "$TASK" ]; then
    echo "📭 没有待处理的任务"
    exit 0
fi

# 分配任务
jq --arg agent "$AGENT_NAME" --arg task "$TASK" --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
  (.tasks[] | select(.id == $task)) |= {
    "status": "in_progress",
    "assigned_to": $agent,
    "started_at": $time
  } + .
' "$COORDINATION_DIR/task-queue.json" > /tmp/task-queue.tmp && mv /tmp/task-queue.tmp "$COORDINATION_DIR/task-queue.json"

# 更新 Agent 状态
STATUS_FILE="$COORDINATION_DIR/${AGENT_NAME}-status.json"
jq --arg task "$TASK" --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
  .status = "working" |
  .current_task = $task |
  .last_activity = $time
' "$STATUS_FILE" > /tmp/status.tmp && mv /tmp/status.tmp "$STATUS_FILE"

# 显示任务详情
echo "✅ 已分配任务: $TASK"
echo ""
jq -r ".tasks[] | select(.id == \"$TASK\")" "$COORDINATION_DIR/task-queue.json"
