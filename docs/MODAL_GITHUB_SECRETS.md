# GitHub Secrets 配置指南

## 概述

配置 GitHub Secrets 后，每次推送 `modal/` 目录的更改都会自动部署到 Modal。

## 配置步骤

### 1. 获取 Modal Token

1. 登录 [Modal Dashboard](https://modal.com/settings/tokens)
2. 点击 **"Create Token"**
3. 输入名称: `whyfire-github-actions`
4. 点击 **"Create"**
5. **立即复制** Token ID 和 Token Secret（Token Secret 只显示一次！）

### 2. 配置 GitHub Secrets

1. 打开 GitHub 仓库: https://github.com/w932635477-bit/WhyFire
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **"New repository secret"**

添加以下两个 secrets:

#### Secret 1: MODAL_TOKEN_ID

| 字段 | 值 |
|------|-----|
| Name | `MODAL_TOKEN_ID` |
| Secret | `ak-13vkuqDxXwXoQz6PD50m13` |

#### Secret 2: MODAL_TOKEN_SECRET

| 字段 | 值 |
|------|-----|
| Name | `MODAL_TOKEN_SECRET` |
| Secret | 从 Modal 网站复制的 Token Secret |

### 3. 验证配置

配置完成后，Secrets 列表应显示:

```
MODAL_TOKEN_ID      Updated just now
MODAL_TOKEN_SECRET  Updated just now
```

### 4. 触发部署

有两种方式触发部署:

#### 方式 1: 手动触发

1. 进入 **Actions** → **Deploy to Modal**
2. 点击 **"Run workflow"**
3. 选择 `main` 分支
4. 点击绿色的 **"Run workflow"** 按钮

#### 方式 2: 自动触发

修改 `modal/` 目录下的任何文件并推送到 main:

```bash
# 做一个小修改
echo "# Modal deployment" >> modal/README.md
git add modal/
git commit -m "trigger: modal deployment"
git push
```

### 5. 查看部署状态

1. 进入 **Actions** 页面
2. 点击最新的 workflow run
3. 查看日志确认部署成功

成功输出示例:

```
🚀 Deploying Seed-VC Mock to Modal...
✅ Deployment complete!
Web Endpoint URL: https://ac-l85cvzxpz5kmbbnuoo6iyx--seed-vc-mock.modal.run
```

### 6. 更新环境变量

部署成功后，更新 `.env.local`:

```bash
# 取消注释并设置 Modal 后端
MODAL_WEB_ENDPOINT_URL=https://ac-l85cvzxpz5kmbbnuoo6iyx--seed-vc-mock.modal.run
SEEDVC_BACKEND=modal
```

然后重启开发服务器:

```bash
npm run dev
```

---

## 故障排除

### 错误: "Could not authenticate with Modal"

**原因**: Token 无效或过期

**解决**: 重新生成 Token 并更新 GitHub Secrets

### 错误: "MODAL_TOKEN_SECRET not found"

**原因**: Secret 未正确配置

**解决**: 确保 Secret 名称完全匹配（区分大小写）

### 部署成功但测试失败

**原因**: Modal 服务需要时间启动

**解决**: 等待 30 秒后重试健康检查

---

## 当前 Token 信息

| 项目 | 值 |
|------|-----|
| Token ID | `ak-13vkuqDxXwXoQz6PD50m13` |
| Workspace ID | `ac-L85CVZXpz5kMbbNUoO6IYx` |
| 预期 Web URL | `https://ac-l85cvzxpz5kmbbnuoo6iyx--seed-vc-mock.modal.run` |

---

## 下一步

1. 配置 GitHub Secrets
2. 手动触发部署
3. 验证健康检查
4. 更新 `.env.local` 切换到 Modal 后端
5. 运行完整流程测试
