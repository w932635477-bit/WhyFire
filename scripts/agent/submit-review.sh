#!/bin/bash

# Reviewer 提交审查反馈脚本
# 使用方法: ./scripts/agent/submit-review.sh <commit> <approved> [feedback-file]

COMMIT_HASH=${1:-""}
APPROVED=${2:-"false"}
FEEDBACK_FILE=${3:-""}
COORDINATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/.coordination"

if [ -z "$COMMIT_HASH" ]; then
    echo "❌ 错误: 需要提供 commit hash"
    echo "使用方法: $0 <commit> <approved> [feedback-file]"
    exit 1
fi

# 读取反馈文件或使用默认反馈
if [ -n "$FEEDBACK_FILE" ] && [ -f "$FEEDBACK_FILE" ]; then
    FEEDBACK=$(cat "$FEEDBACK_FILE")
else
    FEEDBACK="{}"
fi

# 添加审查记录
jq --arg commit "$COMMIT_HASH" --arg approved "$APPROVED" --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson feedback "$FEEDBACK" '
  .reviews += [{
    "commit": $commit,
    "approved": ($approved == "true"),
    "timestamp": $time,
    "feedback": $feedback
  }]
' "$COORDINATION_DIR/review-feedback.json" > /tmp/review.tmp && mv /tmp/review.tmp "$COORDINATION_DIR/review-feedback.json"

# 更新 Reviewer 状态
jq --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
  .status = "review_submitted" |
  .last_activity = $time |
  .stats.reviews_completed += 1 |
  if env.APPROVED == "true" then .stats.approvals += 1 else .stats.rejections += 1 end
' "$COORDINATION_DIR/reviewer-status.json" > /tmp/status.tmp && mv /tmp/status.tmp "$COORDINATION_DIR/reviewer-status.json"

if [ "$APPROVED" = "true" ]; then
    echo "✅ 审查通过: $COMMIT_HASH"
    echo "   准备合并到主分支"
else
    echo "⚠️  需要修改: $COMMIT_HASH"
    echo "   Builder 需要根据反馈进行修改"
fi

echo ""
echo "📋 审查记录已保存到: .coordination/review-feedback.json"
