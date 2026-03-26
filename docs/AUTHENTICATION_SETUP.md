# API 认证配置指南

本文档说明如何配置 WhyFire API 的认证机制。

## 快速开始

### 1. 生成安全密钥

```bash
# 生成 API Key（32 字节）
openssl rand -hex 32

# 生成 Bearer Token（32 字节）
openssl rand -hex 32
```

示例输出：
```
9d29cc578b0665ff9e17e661477fae8733379a27ecf23b5f24eb433be0929e8d
```

### 2. 配置环境变量

在 `.env.local` 文件中添加：

```bash
# API 认证（生产环境必须配置）
API_KEYS=your-generated-api-key-here
BEARER_TOKENS=your-generated-bearer-token-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**多个密钥配置**（用逗号分隔）：
```bash
API_KEYS=key1,key2,key3
BEARER_TOKENS=token1,token2,token3
```

### 3. 使用认证

#### 方式一：API Key

```bash
curl https://your-api.com/api/rap/generate-v2 \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"userId":"user123","dialect":"original","referenceAudioId":"ref-123"}'
```

#### 方式二：Bearer Token

```bash
curl https://your-api.com/api/rap/generate-v2 \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-bearer-token" \
  -d '{"userId":"user123","dialect":"original","referenceAudioId":"ref-123"}'
```

## 已保护的 API 端点

以下端点需要认证（生产环境）：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/rap/generate-v2` | POST | Rap 生成 |
| `/api/voice/reference` | POST | 上传参考音频 |
| `/api/voice/reference` | GET | 查询参考音频 |

## 开发环境

在开发环境（`NODE_ENV=development`）中，认证会被自动跳过，方便本地调试。

## 安全特性

### 1. 时序攻击防护

使用 Node.js `crypto.timingSafeEqual()` 进行常量时间字符串比较，防止时序攻击。

### 2. 来源验证

可选的来源域名检查，防止跨站请求伪造（CSRF）。

配置允许的来源：
```bash
NEXT_PUBLIC_APP_URL=https://your-frontend.com
```

### 3. 速率限制

支持基于 IP 或 API Key 的速率限制（可选）：

```typescript
import { withAuthAndRateLimit } from '@/lib/middleware/auth'

export const POST = withAuthAndRateLimit(
  async (request: NextRequest) => {
    // 处理器逻辑
  },
  {
    maxRequests: 100,    // 每个 IP/API Key 每分钟最多 100 次请求
    windowMs: 60000,     // 时间窗口：1 分钟
  }
)
```

### 4. 认证日志

所有认证尝试都会被记录，包括：
- 时间戳
- 请求 ID
- 客户端 IP
- User-Agent
- 认证类型
- 成功/失败状态

示例日志：
```
[Auth] ✓ {"timestamp":"2026-03-26T10:30:00Z","requestId":"req_123","method":"POST","path":"/api/rap/generate-v2","success":true,"authType":"api-key","ip":"1.2.3.4"}
```

## 生产环境部署清单

- [ ] 生成安全的 API Keys 和 Bearer Tokens
- [ ] 配置 `.env.local` 中的认证变量
- [ ] 确保 `NODE_ENV=production`
- [ ] 配置 `NEXT_PUBLIC_APP_URL` 为实际域名
- [ ] 启用 HTTPS
- [ ] 配置防火墙规则
- [ ] 设置日志监控和告警

## 故障排查

### 401 Unauthorized

**原因**：
- 缺少认证头
- API Key 或 Token 无效

**解决**：
```bash
# 检查请求头
curl -v https://your-api.com/api/rap/generate-v2

# 验证 API Key
echo $API_KEYS | grep "your-key"
```

### 429 Too Many Requests

**原因**：超过速率限制

**解决**：
- 等待时间窗口重置（默认 1 分钟）
- 联系管理员提高限额
- 使用不同的 API Key

### 认证在开发环境失败

**原因**：`NODE_ENV` 不是 `development`

**解决**：
```bash
# 确认环境
echo $NODE_ENV

# 设置开发环境
export NODE_ENV=development
```

## 最佳实践

1. **定期轮换密钥**：建议每 90 天更换一次 API Keys
2. **使用环境变量**：永远不要在代码中硬编码密钥
3. **最小权限原则**：为不同的客户端使用不同的 API Key
4. **监控异常**：关注认证失败日志，及时发现异常访问
5. **HTTPS 强制**：确保所有 API 调用都通过 HTTPS
6. **密钥管理**：使用密钥管理服务（如 AWS Secrets Manager）存储密钥

## 示例：客户端集成

### JavaScript/TypeScript

```typescript
const API_KEY = process.env.WHYFIRE_API_KEY

async function generateRap(params: RapGenerationParams) {
  const response = await fetch('https://api.whyfire.com/api/rap/generate-v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed: Invalid API Key')
    }
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
```

### Python

```python
import os
import requests

API_KEY = os.getenv('WHYFIRE_API_KEY')

def generate_rap(params):
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
    }

    response = requests.post(
        'https://api.whyfire.com/api/rap/generate-v2',
        json=params,
        headers=headers
    )

    if response.status_code == 401:
        raise Exception('Authentication failed: Invalid API Key')

    response.raise_for_status()
    return response.json()
```

## 支持

如有问题，请联系：
- GitHub Issues: https://github.com/your-repo/whyfire/issues
- Email: support@whyfire.com
