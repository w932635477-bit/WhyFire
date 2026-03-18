# WhyFire 多Agent 协调中心

## 概述

本目录用于三个Agent之间的状态共享和协调：

- **Builder** (`.worktrees/builder`): 编写代码
- **Verifier** (`.worktrees/verifier`): 验证代码（运行测试）
- **Reviewer** (`.worktrees/reviewer`): 审查代码

## 状态文件

| 文件 | 用途 | 由谁更新 |
|------|------|----------|
| `task-queue.json` | 待办任务队列 | Leader/用户 |
| `builder-status.json` | Builder 当前状态 | Builder |
| `verifier-status.json` | Verifier 当前状态 | Verifier |
| `reviewer-status.json` | Reviewer 当前状态 | Reviewer |
| `review-feedback.json` | 代码审查反馈 | Reviewer |
| `integration-log.json` | 集成日志 | Leader |

## 工作流程

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Task Queue                                   │
│                    (task-queue.json)                                  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │   Builder    │ │  Verifier    │ │   Reviewer   │
            │              │ │              │ │              │
            │ 编写代码      │ │ 运行测试      │ │ 审查代码      │
            │ 提交到分支    │ │ 验证功能      │ │ 提供反馈      │
            └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                   │                │                │
                   ▼                ▼                ▼
            ┌──────────────────────────────────────────────┐
            │              Status Files                     │
            │  builder-status.json                         │
            │  verifier-status.json                        │
            │  reviewer-status.json                        │
            └──────────────────────────────────────────────┘
                                   │
                                   ▼
            ┌──────────────────────────────────────────────┐
            │            Integration (Leader)              │
            │                                              │
            │  1. 检查所有状态                              │
            │  2. 合并验证通过的代码                        │
            │  3. 应用审查反馈                              │
            │  4. 更新任务队列                              │
            └──────────────────────────────────────────────┘
```

## 通信协议

### Builder → Verifier
当 Builder 完成代码时，更新 `builder-status.json`：
```json
{
  "status": "ready_for_verification",
  "branch": "agent/builder",
  "commit": "abc123",
  "files_changed": ["src/components/Button.tsx"],
  "timestamp": "2026-03-18T10:00:00Z"
}
```

### Verifier → Reviewer
当 Verifier 完成验证时，更新 `verifier-status.json`：
```json
{
  "status": "verified",
  "builder_commit": "abc123",
  "tests_passed": true,
  "test_coverage": 85,
  "timestamp": "2026-03-18T10:05:00Z"
}
```

### Reviewer → Leader
当 Reviewer 完成审查时，更新 `review-feedback.json`：
```json
{
  "commit": "abc123",
  "approved": true,
  "issues": [],
  "suggestions": ["考虑添加错误处理"],
  "timestamp": "2026-03-18T10:10:00Z"
}
```
