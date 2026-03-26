/**
 * 测试 OSS CORS 配置
 * 验证音频文件是否可以被前端跨域访问
 */

const TEST_URL = 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/rap/1774512145928-0eki9l.mp3'

async function testOSSCors() {
  console.log('========================================')
  console.log('OSS CORS 测试')
  console.log('========================================')
  console.log(`测试 URL: ${TEST_URL}\n`)

  // 测试 1: 基本 GET 请求
  console.log('1. 测试基本 GET 请求...')
  try {
    const res = await fetch(TEST_URL, { method: 'HEAD' })
    console.log(`   状态码: ${res.status}`)
    console.log(`   Content-Type: ${res.headers.get('content-type')}`)
    console.log(`   Content-Length: ${res.headers.get('content-length')}`)
  } catch (e) {
    console.log(`   ❌ 请求失败: ${e}`)
  }

  // 测试 2: 检查 CORS 头
  console.log('\n2. 测试 CORS 头...')
  try {
    const res = await fetch(TEST_URL, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000',
      },
    })
    const corsHeaders = {
      'Access-Control-Allow-Origin': res.headers.get('access-control-allow-origin'),
      'Access-Control-Allow-Methods': res.headers.get('access-control-allow-methods'),
      'Access-Control-Allow-Headers': res.headers.get('access-control-allow-headers'),
      'Access-Control-Max-Age': res.headers.get('access-control-max-age'),
    }

    console.log('   CORS 响应头:')
    for (const [key, value] of Object.entries(corsHeaders)) {
      console.log(`   ${key}: ${value || '(未设置)'}`)
    }

    if (!corsHeaders['Access-Control-Allow-Origin']) {
      console.log('\n   ❌ CORS 未配置！需要在 OSS 控制台设置 CORS 规则')
    } else {
      console.log('\n   ✅ CORS 已配置')
    }
  } catch (e) {
    console.log(`   ❌ 请求失败: ${e}`)
  }

  // 测试 3: OPTIONS 预检请求
  console.log('\n3. 测试 OPTIONS 预检请求...')
  try {
    const res = await fetch(TEST_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'range',
      },
    })
    console.log(`   状态码: ${res.status}`)
    console.log(`   Allow-Origin: ${res.headers.get('access-control-allow-origin') || '(未设置)'}`)
  } catch (e) {
    console.log(`   ❌ 请求失败: ${e}`)
  }

  console.log('\n========================================')
  console.log('解决方案：')
  console.log('========================================')
  console.log(`
在阿里云 OSS 控制台配置 CORS 规则：

1. 登录 https://oss.console.aliyun.com
2. 选择 bucket: whyfire-02
3. 进入「权限管理」→「跨域设置(CORS)」
4. 点击「设置」→「创建规则」
5. 填写以下配置：

   来源(AllowedOrigin): *
   允许Methods: GET, HEAD, POST, PUT, DELETE
   允许Headers: *
   暴露Headers: ETag, x-oss-request-id
   缓存时间(MaxAgeSeconds): 3600

6. 点击「确定」保存

配置后，音频文件就可以在前端正常加载了。
`)
}

testOSSCors()
