# API Keys 配置指南

## 概述

WhyFire 项目需要以下 API Keys 才能正常运行：

| API | 状态 | 用途 |
|-----|------|------|
| **Claude API** | ✅ 已配置 | AI 分析功能 (evolink 代理) |
| **YouTube API** | ✅ 已配置 | 海外创意视频 |
| **Apify Token** | ⏳ 待配置 | TikTok 数据（可选） |

---

## 1. Claude API（必选）

### 方式 A：国内代理（推荐国内用户）

使用 [evolink.ai](https://evolink.ai) 等国内代理服务，无需翻墙。

```env
# .env.local
ANTHROPIC_API_KEY=your_evolink_api_key
ANTHropic_BASE_URL=https://api.evolink.ai
```

**获取步骤：**
1. 访问 [evolink.ai](https://evolink.ai)
2. 注册/登录账号
3. 获取 API Key

### 方式 B：官方 API

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-xxxxx
# 不需要设置 ANTHROPIC_BASE_URL
```

**获取步骤：**
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 创建 API Key

---

## 2. YouTube Data API v3（可选）

### 获取步骤

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目
3. 启用 **YouTube Data API v3**
   - 左侧菜单 → APIs & Services → Library
   - 搜索 "YouTube Data API v3" → 启用
4. 创建 API Key
   - 左侧菜单 → APIs & Services → Credentials
   - 创建凭据 → API Key

```env
# .env.local
YOUTUBE_API_KEY=your_youtube_api_key
```

---

## 3. Apify Token（可选 - TikTok 数据）

### 功能说明

- 获取 TikTok 热门视频
- 补充 YouTube 数据源
- 提供更多海外创意内容

### 获取步骤

#### 步骤 1: 注册/登录

1. 访问 [Apify](https://apify.com/)
2. 点击右上角 **Sign up** 注册
   - 支持 Google、GitHub、Email 登录

#### 步骤 2: 获取 API Token

1. 登录后，访问 [API & Integrations](https://console.apify.com/settings/integrations)
2. 滚动到 **API Token** 部分
3. 点击 **Create new token**
4. 设置：
   - **Title**: `WhyFire`
   - **Expiry**: `No expiration`
5. 点击 **Create** 并**立即复制** token（只显示一次！）

#### 步骤 3: 配置

```env
# .env.local
APIFY_TOKEN=your_apify_token
```

### 定价

| 计划 | 价格 | 适用场景 |
|------|------|--------- |
| **Free** | $0/月 | 测试（$5 免费额度） |
| **Personal** | $49/单. 月 | 个人1）

#### 成本参考

- TikTok 爬取 1000 个视频: ~$25-40

---

## 当前配置文件 `.env.local`

```env
# ====== 已配置 ✅ ======
# Claude API (evolink 国内代理)
ANTHROPIC_API_KEY=sk-GeauPYDMriuqyUPluKsftCYKwglSEpkSiNrkh5CA2X3HwbsN
ANTHROPIC_BASE_URL=https://api.evolink.ai

# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSyCvUtUNIrrV6K04ahOwouWyqyqY_CFFKCcI

# ====== 待配置 ⏳ ======
# Apify (TikTok 数据)
APIFY_TOKEN=your_apify_token_here
```

---

## 验证配置

```bash
# 启动开发服务器
pnpm dev

# 测试步骤:
# 1. 访问 http://localhost:3000
# 2. 进入 Step 1 竞品分析
# 3. 输入小红书链接
# 4. 点击分析
```

---

## 故障排除

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `Invalid API Key` | API Key 格式错误 | 复制完整字符串，无空格 |
| `Timeout` | 网络连接问题 | 检查网络/代理设置 |
| `Rate Limit` | 调用频率过高 | 添加请求限流机制 |

---

## 技术支持
- 💖 性能:  AI解决各种关于: <leizhuh9795@gmail.com>,
         微信: "LeiZhu_20 + 2.67 um
