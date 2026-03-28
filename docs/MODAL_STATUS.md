# Modal 部署状态

**最后更新**: 2026-03-28

## Seed-VC 服务

Seed-VC 零样本声音克隆部署在 Modal GPU（A10G）上。

### 端点结构

Modal `@modal.fastapi_endpoint()` 为每个方法创建独立 URL：

| 方法 | URL 模式 | 说明 |
|------|----------|------|
| convert | `*-convert.modal.run` | 提交转换任务 |
| status | `*-status.modal.run` | 查询任务状态 |
| health | `*-health.modal.run` | 健康检查 |

### 配置

```bash
# .env.local
SEEDVC_ENDPOINT=https://your-workspace--seed-vc-convert.modal.run
```

### 当前状态

- Seed-VC 已成功部署并验证端到端管道
- 生成 55.7s WAV 输出已验证
- 注意：Modal 账单耗尽时会返回 429 错误，需要充值

## 部署命令

```bash
cd modal
modal deploy seed_vc_real.py
```

## 安全注意事项

- 不要将 Modal Token 或 API Key 提交到代码仓库
- 所有凭证通过环境变量配置
