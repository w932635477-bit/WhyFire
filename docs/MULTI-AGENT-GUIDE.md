# WhyFire Git Worktrees 多Agent协同开发指南

> 最后更新: 2026-03-18

## 概述

本指南介绍如何使用 Git Worktrees 实现三个 Agent 的并行协同开发：

- **Builder**: 负责编写代码
- **Verifier**: 负责验证代码（运行测试、类型检查）
- **Reviewer**: 负责审查代码（代码质量、最佳实践）

## 为什么选择 Git Worktrees？

| 优势 | 说明 |
|------|------|
| ✅ **隔离性** | 每个 Agent 独立工作区，互不干扰 |
| ✅ **并行性** | 真正的并行开发，无需等待 |
| ✅ **原子性** | 每个 Agent 独立提交，易于回滚 |
| ✅ **低成本** | 共享 .git 目录，磁盘占用小 |
| ✅ **原生的** | Git 原生支持，无需额外工具 |

## 架构图

```
/Users/weilei/WhyFire/
├── .git/                          # 共享的 Git 仓库
├── .worktrees/                    # Worktrees 目录
│   ├── builder/                   # Builder Agent 工作区
│   │   └── (branch: agent/builder)
│   ├── verifier/                  # Verifier Agent 工作区
│   │   └── (branch: agent/verifier)
│   └── reviewer/                  # Reviewer Agent 工作区
│       └── (branch: agent/reviewer)
├── .coordination/                 # 协调中心（共享状态）
│   ├── task-queue.json            # 任务队列
│   ├── builder-status.json        # Builder 状态
│   ├── verifier-status.json       # Verifier 状态
│   ├── reviewer-status.json       # Reviewer 状态
│   └── review-feedback.json       # 审查反馈
└── scripts/                       # 辅助脚本
    ├── setup-worktrees.sh         # 设置 worktrees
    ├── start-agents.sh            # 启动多Agent环境
    └── agent/                     # Agent 工具脚本
        ├── get-task.sh            # 获取任务
        ├── complete-task.sh       # 完成任务
        └── submit-review.sh       # 提交审查
```

## 快速开始

### 1. 一键设置（推荐）

```bash
# 设置 Worktrees 和协调中心
./scripts/setup-worktrees.sh

# 启动多Agent环境（使用 tmux）
./scripts/start-agents.sh
```

### 2. 手动设置

```bash
# 创建 worktrees
mkdir -p .worktrees
git worktree add .worktrees/builder -b agent/builder
git worktree add .worktrees/verifier -b agent/verifier
git worktree add .worktrees/reviewer -b agent/reviewer

# 在三个终端窗口中分别启动
# Terminal 1
cd .worktrees/builder && claude

# Terminal 2
cd .worktrees/verifier && claude

# Terminal 3
cd .worktrees/reviewer && claude
```

## 工作流程

### Pipeline 模式（推荐）

```
┌─────────────────────────────────────────────────────────────────┐
│                    任务: 实现 Button 组件                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段 1: Builder (5-15分钟)                                       │
│                                                                 │
│  1. 获取任务: ./scripts/agent/get-task.sh builder               │
│  2. 编写代码: src/components/ui/Button.tsx                       │
│  3. 编写测试: src/components/ui/Button.test.tsx                  │
│  4. 提交代码: git commit -m "feat: add Button component"         │
│  5. 完成任务: ./scripts/agent/complete-task.sh builder task-001  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段 2: Verifier (2-5分钟)                                       │
│                                                                 │
│  1. 检查状态: cat ../.coordination/builder-status.json | jq      │
│  2. 拉取代码: git fetch origin && git merge origin/agent/builder │
│  3. 运行测试: pnpm test Button.test.tsx                          │
│  4. 类型检查: pnpm tsc --noEmit                                  │
│  5. 更新状态: 更新 verifier-status.json (status: "verified")      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段 3: Reviewer (5-10分钟)                                      │
│                                                                 │
│  1. 检查状态: cat ../.coordination/verifier-status.json | jq     │
│  2. 拉取代码: git fetch origin && git merge origin/agent/builder │
│  3. 代码审查:                                                     │
│     - 检查代码风格                                                │
│     - 验证最佳实践                                                │
│     - 检查安全性                                                  │
│  4. 提交审查: ./scripts/agent/submit-review.sh <commit> true     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 阶段 4: Leader (协调者)                                          │
│                                                                 │
│  1. 检查所有状态                                                  │
│  2. 如果 approved: 合并到 main                                    │
│     git checkout main                                            │
│     git merge agent/builder                                      │
│  3. 如果需要修改: 通知 Builder                                    │
│  4. 更新任务队列                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Watchdog 模式（高级）

Verifier 和 Reviewer 作为"看门狗"，监控 Builder 的提交：

```bash
# Verifier 持续监控脚本
while true; do
  # 检查 Builder 是否有新提交
  NEW_COMMITS=$(git log origin/agent/builder --not origin/agent/verifier --oneline)

  if [ -n "$NEW_COMMITS" ]; then
    echo "🔍 发现新提交，开始验证..."
    git pull origin agent/builder
    pnpm test
    # 更新状态...
  fi

  sleep 30
done
```

## Agent 角色详解

### 🔨 Builder（代码编写）

**职责**:
- 根据任务需求编写代码
- 编写单元测试
- 遵循 TDD 原则
- 确保代码可编译

**工作区**: `.worktrees/builder`
**分支**: `agent/builder`

**常用命令**:
```bash
# 获取任务
./scripts/agent/get-task.sh builder

# 查看任务详情
cat ../.coordination/task-queue.json | jq '.tasks[] | select(.id == "task-001")'

# 提交代码
git add . && git commit -m "feat: implement Button component"

# 完成任务
./scripts/agent/complete-task.sh builder task-001
```

**Prompt 模板**:
```
你是 Builder Agent，负责编写代码。

当前任务: <从 task-queue.json 读取>
工作目录: .worktrees/builder
分支: agent/builder

要求:
1. 遵循 TDD 原则：先写测试，再写实现
2. 确保所有测试通过
3. 提交有意义的 commit message
4. 完成后运行: ./scripts/agent/complete-task.sh builder <task-id>
```

### 🔍 Verifier（代码验证）

**职责**:
- 运行单元测试
- 执行类型检查
- 检查代码覆盖率
- 验证功能完整性

**工作区**: `.worktrees/verifier`
**分支**: `agent/verifier`

**常用命令**:
```bash
# 检查 Builder 状态
cat ../.coordination/builder-status.json | jq

# 拉取 Builder 代码
git fetch origin && git merge origin/agent/builder

# 运行测试
pnpm test

# 运行类型检查
pnpm tsc --noEmit

# 更新状态
# 编辑 ../.coordination/verifier-status.json
```

**Prompt 模板**:
```
你是 Verifier Agent，负责验证代码。

当前待验证: <从 builder-status.json 读取>
工作目录: .worktrees/verifier
分支: agent/verifier

验证清单:
1. 运行所有测试: pnpm test
2. 类型检查: pnpm tsc --noEmit
3. 代码覆盖率: pnpm test:coverage
4. Lint 检查: pnpm lint

完成后更新 verifier-status.json:
- status: "verified" 或 "failed"
- test_results: { passed, failed, coverage }
```

### 👀 Reviewer（代码审查）

**职责**:
- 审查代码质量
- 检查最佳实践
- 识别潜在问题
- 提供改进建议

**工作区**: `.worktrees/reviewer`
**分支**: `agent/reviewer`

**常用命令**:
```bash
# 检查 Verifier 状态
cat ../.coordination/verifier-status.json | jq

# 拉取代码
git fetch origin && git merge origin/agent/builder

# 查看变更
git diff main...HEAD

# 提交审查（通过）
./scripts/agent/submit-review.sh <commit> true

# 提交审查（需要修改）
./scripts/agent/submit-review.sh <commit> false feedback.json
```

**Prompt 模板**:
```
你是 Reviewer Agent，负责代码审查。

当前待审查: <从 verifier-status.json 读取>
工作目录: .worktrees/reviewer
分支: agent/reviewer

审查清单:
1. 代码风格和可读性
2. 错误处理是否完善
3. 安全性问题
4. 性能考虑
5. 测试覆盖率
6. 文档完整性

审查结果:
- approved: true/false
- issues: [...]
- suggestions: [...]

完成后运行: ./scripts/agent/submit-review.sh <commit> <approved>
```

## 通信协议

### 状态文件格式

**任务队列** (`task-queue.json`):
```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "实现 Button 组件",
      "status": "in_progress",
      "assigned_to": "builder",
      "started_at": "2026-03-18T10:00:00Z"
    }
  ]
}
```

**Builder 状态** (`builder-status.json`):
```json
{
  "status": "ready_for_handoff",
  "current_task": null,
  "commits_pending_review": ["abc123"]
}
```

**Verifier 状态** (`verifier-status.json`):
```json
{
  "status": "verified",
  "test_results": {
    "passed": 15,
    "failed": 0,
    "coverage": 85
  }
}
```

**审查反馈** (`review-feedback.json`):
```json
{
  "reviews": [
    {
      "commit": "abc123",
      "approved": true,
      "issues": [],
      "suggestions": ["考虑添加 loading 状态"]
    }
  ]
}
```

## 最佳实践

### 1. 任务粒度

**推荐**:
- 每个任务 1-2 小时可完成
- 单个任务对应一个功能点
- 任务之间依赖明确

**不推荐**:
- 过大的任务（超过 4 小时）
- 模糊的任务描述
- 循环依赖的任务

### 2. 提交策略

```bash
# 每个小步骤一个提交
git commit -m "test: add Button component tests"
git commit -m "feat: implement Button component"
git commit -m "docs: add Button component documentation"
```

### 3. 冲突处理

```bash
# Builder 发生冲突时
git fetch origin
git rebase origin/main

# 解决冲突后
git add .
git rebase --continue
```

### 4. 定期同步

```bash
# 每个 Agent 定期拉取 main 分支更新
git fetch origin main
git merge origin/main
```

## 故障排除

### Q1: Worktree 创建失败

```bash
# 清理已删除的 worktree 引用
git worktree prune

# 重新创建
git worktree add .worktrees/builder -b agent/builder
```

### Q2: 分支已存在

```bash
# 删除旧分支
git branch -D agent/builder

# 或使用现有分支
git worktree add .worktrees/builder agent/builder
```

### Q3: 状态文件冲突

```bash
# 使用 jq 原子更新
jq '.status = "working"' status.json > /tmp/status.tmp && mv /tmp/status.tmp status.json
```

## 清理和重置

```bash
# 删除所有 worktrees
git worktree remove .worktrees/builder
git worktree remove .worktrees/verifier
git worktree remove .worktrees/reviewer

# 删除分支
git branch -D agent/builder
git branch -D agent/verifier
git branch -D agent/reviewer

# 清理协调文件
rm -rf .coordination

# 重新设置
./scripts/setup-worktrees.sh
```

## 进阶技巧

### 1. 使用 tmux 分屏

```bash
# 启动后，在 tmux 中
Ctrl+b "    # 垂直分屏
Ctrl+b %    # 水平分屏
Ctrl+b ←→↑↓ # 切换面板
```

### 2. 自动化脚本

创建 `watch-builder.sh`:
```bash
#!/bin/bash
while true; do
  CHANGED=$(cat ../.coordination/builder-status.json | jq -r '.status')
  if [ "$CHANGED" = "ready_for_handoff" ]; then
    echo "Builder 完成，开始验证..."
    # 自动触发验证流程
  fi
  sleep 10
done
```

### 3. 集成 CI/CD

在 `.github/workflows/agent-review.yml`:
```yaml
name: Agent Review
on:
  push:
    branches: [agent/builder]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: pnpm test
      - name: Type check
        run: pnpm tsc --noEmit
```

---

**相关文档**:
- [TDD 主文档](./TDD.md)
- [测试指南](./TDD-testing.md)
- [PRD 需求文档](./PRD.md)
