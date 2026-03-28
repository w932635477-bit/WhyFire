# Seed-VC 部署状态

**最后更新**: 2026-03-28

## 概述

Seed-VC 零样本声音克隆提供两个 GPU 后端：

| 后端 | 配置 | 说明 |
|------|------|------|
| **AutoDL**（推荐） | `SEEDVC_BACKEND=autodl` | 自托管 A10 GPU，支付宝付费，约 2 元/小时 |
| Modal | `SEEDVC_BACKEND=modal` | Serverless GPU，需信用卡，$30/月免费额度 |
| Mock | `SEEDVC_BACKEND=mock` | 本地测试，无 GPU |

## AutoDL 部署（推荐）

### 1. 创建实例

- AutoDL 平台: https://www.autodl.com
- 推荐配置: **A10 24GB**，PyTorch 2.0 镜像
- 价格: 约 2 元/小时

### 2. 一键部署

```bash
# 上传 autodl/ 目录到实例 /root/autodl/
chmod +x /root/autodl/setup.sh
bash /root/autodl/setup.sh
```

### 3. 配置

```bash
# .env.local
SEEDVC_BACKEND=autodl
SEEDVC_AUTODL_URL=https://your-region.autodl.pro:6006
```

### 4. 验证

```bash
curl https://your-region.autodl.pro:6006/health
```

## 端点结构

### AutoDL

| 方法 | URL | 说明 |
|------|-----|------|
| POST | `/convert` | 提交转换任务 |
| GET | `/status?task_id=xxx` | 查询任务状态 |
| GET | `/health` | 健康检查 |

### Modal（已废弃）

Modal 使用独立 URL 模式：
- `*-convert.modal.run`
- `*-status.modal.run`
- `*-health.modal.run`

## 安全注意事项

- 不要将 API Token 或密钥提交到代码仓库
- 所有凭证通过环境变量配置
- AutoDL 公网 URL 含认证 token，不要公开分享
