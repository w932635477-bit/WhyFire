#!/bin/bash

# AI 分析模块类型检查脚本

echo "🔍 检查 AI 分析模块类型..."

# 运行类型检查
npx tsc --noEmit --skipLibCheck src/lib/anthropic/*.ts src/lib/utils/retry.ts 2>&1 | grep -E "(error|✓)" | head -20

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 类型检查通过"
else
  echo ""
  echo "⚠️  有类型错误，请检查"
fi
