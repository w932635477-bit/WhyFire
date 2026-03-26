/**
 * 测试音频代理 API
 * 验证 COEP 兼容性
 */

const OSS_PATH = 'rap/1774512145928-0eki9l.mp3'
const PROXY_URL = `http://localhost:3000/api/audio-proxy?path=${encodeURIComponent(OSS_PATH)}`

async function testAudioProxy() {
  console.log('========================================')
  console.log('音频代理 API 测试')
  console.log('========================================\n')

  console.log(`代理 URL: ${PROXY_URL}\n`)

  // 测试 1: 检查响应头
  console.log('1. 检查响应头...')
  try {
    const res = await fetch(PROXY_URL, { method: 'HEAD' })
    console.log(`   状态码: ${res.status}`)

    const headers = {
      'Content-Type': res.headers.get('content-type'),
      'Cross-Origin-Resource-Policy': res.headers.get('cross-origin-resource-policy'),
      'Access-Control-Allow-Origin': res.headers.get('access-control-allow-origin'),
      'Accept-Ranges': res.headers.get('accept-ranges'),
    }

    console.log('   响应头:')
    for (const [key, value] of Object.entries(headers)) {
      console.log(`   ${key}: ${value || '(未设置)'}`)
    }

    // 验证 CORP 头
    if (headers['Cross-Origin-Resource-Policy'] === 'cross-origin') {
      console.log('\n   ✅ CORP 头已设置，兼容 COEP')
    } else {
      console.log('\n   ❌ CORP 头缺失，COEP 会阻止加载')
    }
  } catch (e) {
    console.log(`   ❌ 请求失败: ${e}`)
    console.log('\n   提示: 请确保 Next.js 开发服务器正在运行 (npm run dev)')
    return
  }

  // 测试 2: 检查 Range 请求（音频 seek 支持）
  console.log('\n2. 测试 Range 请求（音频 seek）...')
  try {
    const res = await fetch(PROXY_URL, {
      headers: { 'Range': 'bytes=0-1023' },
    })
    console.log(`   状态码: ${res.status}`)
    console.log(`   Content-Range: ${res.headers.get('content-range') || '(未设置)'}`)

    if (res.status === 206) {
      console.log('   ✅ 支持 Range 请求')
    } else {
      console.log('   ⚠️ Range 请求返回非 206 状态')
    }
  } catch (e) {
    console.log(`   ❌ 请求失败: ${e}`)
  }

  console.log('\n========================================')
  console.log('测试完成')
  console.log('========================================')
}

testAudioProxy()
