#!/bin/bash

# WhyFire 多Agent协同开发 - 快速演示
# 使用方法: ./scripts/demo.sh

cat << 'EOF'

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║           WhyFire 多Agent协同开发环境 - Git Worktrees                ║
║                                                                      ║
║   🔨 Builder  → 编写代码                                             ║
║   🔍 Verifier → 验证代码                                             ║
║   👀 Reviewer → 审查代码                                             ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

✅ 环境已就绪！

📌 当前状态:
─────────────────────────────────────────────────────────────────────

Worktrees:
  • Builder:   .worktrees/builder  (branch: agent/builder)
  • Verifier:  .worktrees/verifier (branch: agent/verifier)
  • Reviewer:  .worktrees/reviewer (branch: agent/reviewer)

协调文件:
  • 任务队列:     .coordination/task-queue.json
  • Builder 状态: .coordination/builder-status.json
  • Verifier 状态:.coordination/verifier-status.json
  • Reviewer 状态:.coordination/reviewer-status.json

─────────────────────────────────────────────────────────────────────

🚀 启动方式:

方式 1: 使用 tmux (推荐)
─────────────────────────────────────────────────────────────────────
  ./scripts/start-agents.sh

  这将创建一个 tmux 会话，包含 4 个窗口:
  • 窗口 0: Leader (协调者)
  • 窗口 1: Builder (编写代码)
  • 窗口 2: Verifier (验证代码)
  • 窗口 3: Reviewer (审查代码)

  快捷键:
  • Ctrl+b 0-3  切换窗口
  • Ctrl+b d     退出会话(保持后台)
  • Ctrl+b c     创建新窗口


方式 2: 手动启动 (三个终端窗口)
─────────────────────────────────────────────────────────────────────
  Terminal 1: cd .worktrees/builder && claude
  Terminal 2: cd .worktrees/verifier && claude
  Terminal 3: cd .worktrees/reviewer && claude

─────────────────────────────────────────────────────────────────────

📖 工作流程示例:

  1️⃣  Builder 获取任务:
      cd .worktrees/builder
      ./scripts/agent/get-task.sh builder

  2️⃣  Builder 编写代码并提交:
      # 编写代码...
      git add . && git commit -m "feat: implement Button"
      ./scripts/agent/complete-task.sh builder task-001

  3️⃣  Verifier 验证代码:
      cd .worktrees/verifier
      git merge origin/agent/builder
      pnpm test
      # 更新 verifier-status.json

  4️⃣  Reviewer 审查代码:
      cd .worktrees/reviewer
      git merge origin/agent/builder
      # 审查代码...
      ./scripts/agent/submit-review.sh <commit> true

  5️⃣  Leader 合并代码:
      git checkout main
      git merge agent/builder

─────────────────────────────────────────────────────────────────────

📚 详细文档:
  • docs/MULTI-AGENT-GUIDE.md - 完整使用指南
  • .coordination/README.md   - 协调机制说明

─────────────────────────────────────────────────────────────────────

EOF
