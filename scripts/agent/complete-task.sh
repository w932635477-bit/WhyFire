#!/bin/bash

# Agent 完成任务脚本
# 使用方法: ./scripts/agent/complete-task.sh <agent-name> <task-id> [commit-hash]

AGENT_NAME=${1:-"builder"}
TASK_ID=${2:-""}
COMMIT_HASH=${3:-"$(git rev-parse HEAD)"}
COORDINATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/.coordination"

if [ -z "$TASK_ID" ]; then
    echo "❌ 错误: 需要提供任务ID"
    echo "使用方法: $0 <agent-name> <task-id> [commit-hash]"
    exit 1
fi

# 更新任务状态
jq --arg task "$TASK_ID" --arg commit "$COMMIT_HASH" --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
  (.tasks[] | select(.id == $task)) |= {
    "status": "completed",
    "completed_at": $time,
    "commit": $commit
  } + .
' "$COORDINATION_DIR/task-queue.json" > /tmp/task-queue.tmp && mv /tmp/task-queue.tmp "$COORDINATION_DIR/task-queue.json"

# 更新 Agent 状态
STATUS_FILE="$COORDINATION_DIR/${AGENT_NAME}-status.json"
jq --arg commit "$COMMIT_HASH" --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
  .status = "ready_for_handoff" |
  .current_task = null |
  .last_activity = $time |
  .commits_pending_review += [$commit]
' "$STATUS_FILE" > /tmp/status.tmp && mv /tmp/status.tmp "$STATUS_FILE"

echo "✅ 任务完成: $TASK_ID"
echo "   Commit: $COMMIT_HASH"
echo ""
echo "📦 通知下游 Agent..."
echo "   Builder → Verifier: 代码已就绪"
