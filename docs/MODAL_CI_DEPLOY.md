# Modal CI/CD 部署指南

本文档说明如何通过 GitHub Actions 自动部署到 Modal。

## 前置条件

1. Modal 账号（已注册）
2. Modal Token（从 [Modal Tokens](https://modal.com/settings/tokens) 获取）
3. GitHub 仓库管理员权限

## 配置步骤

### 1. 获取 Modal Token

1. 登录 [Modal Dashboard](https://modal.com/settings/tokens)
2. 点击 "Create Token"
3. 输入名称: `whyfire-github-actions`
4. 复制生成的 **Token ID** 和 **Token Secret**

### 2. 配置 GitHub Secrets

1. 打开 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加两个 secrets:

| Name | Value |
|------|-------|
| `MODAL_TOKEN_ID` | `ak-13vkuqDxXwXoQz6PD50m13` |
| `MODAL_TOKEN_SECRET` | 你的 Token Secret（从 Modal 复制） |

### 3. 触发部署

部署会在以下情况自动触发：

- 推送到 `main` 分支且修改了 `modal/` 目录
- 手动触发：**Actions** → **Deploy to Modal** → **Run workflow**

### 4. 验证部署

部署成功后，在 GitHub Actions 日志中查看 Web Endpoint URL：

```
https://<workspace>--seed-vc-mock.modal.run
```

测试部署：

```bash
curl https://<workspace>--seed-vc-mock.modal.run/health
```

预期响应：

```json
{
  "status": "ok",
  "mode": "mock",
  "version": "0.1.0",
  "service": "seed-vc-mock"
}
```

## 工作流文件

`.github/workflows/deploy-modal.yml`:

```yaml
name: Deploy to Modal

on:
  push:
    branches: [main]
    paths:
      - 'modal/**'
      - '.github/workflows/deploy-modal.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install modal
      - name: Configure Modal credentials
        env:
          MODAL_TOKEN_ID: ${{ secrets.MODAL_TOKEN_ID }}
          MODAL_TOKEN_SECRET: ${{ secrets.MODAL_TOKEN_SECRET }}
        run: |
          mkdir -p ~/.modal
          cat > ~/.modal.toml << EOF
          [default]
          token_id = "${MODAL_TOKEN_ID}"
          token_secret = "${MODAL_TOKEN_SECRET}"
          EOF
      - run: modal deploy modal/seed_vc_mock.py
```

## 更新环境变量

部署成功后，更新 `.env.local`:

```bash
# 将 <workspace> 替换为你的 Modal Workspace ID
MODAL_WEB_ENDPOINT_URL=https://<workspace>--seed-vc-mock.modal.run
SEEDVC_BACKEND=modal
```

## 故障排除

### 部署失败

1. 检查 GitHub Secrets 是否正确配置
2. 检查 Modal Token 是否有效
3. 查看 GitHub Actions 日志

### 连接超时

如果 Modal API 超时，可能是网络问题。GitHub Actions 服务器通常有良好的网络连接。

### 认证失败

确保 `MODAL_TOKEN_ID` 和 `MODAL_TOKEN_SECRET` 都正确配置。
