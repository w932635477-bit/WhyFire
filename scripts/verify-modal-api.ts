/**
 * Modal API 端点验证脚本
 *
 * 用途：验证 Modal Web Endpoint 的正确调用方式
 * 运行：npx tsx scripts/verify-modal-api.ts
 *
 * 验证内容：
 * 1. 检查环境变量配置
 * 2. 测试 Modal 连通性
 * 3. 验证 API 响应格式
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

// ============================================================================
// 类型定义
// ============================================================================

interface VerifyResult {
  step: string
  success: boolean
  message: string
  details?: Record<string, unknown>
}

// ============================================================================
// 验证函数
// ============================================================================

async function verifyEnvironment(): Promise<VerifyResult> {
  const baseUrl = process.env.MODAL_WEB_ENDPOINT_URL
  const apiToken = process.env.MODAL_API_TOKEN

  if (!baseUrl) {
    return {
      step: '环境变量检查',
      success: false,
      message: 'MODAL_WEB_ENDPOINT_URL 未配置',
      details: {
        hint: '在 .env.local 中设置 MODAL_WEB_ENDPOINT_URL',
        example: 'MODAL_WEB_ENDPOINT_URL=https://your-workspace--seed-vc.modal.run',
      },
    }
  }

  return {
    step: '环境变量检查',
    success: true,
    message: '环境变量已配置',
    details: {
      baseUrl: baseUrl,
      hasToken: !!apiToken,
    },
  }
}

async function testModalConnectivity(): Promise<VerifyResult> {
  const baseUrl = process.env.MODAL_WEB_ENDPOINT_URL!

  try {
    // 测试 1: 直接访问基础 URL（可能返回 404 或欢迎页面）
    console.log(`\n[测试 1] 访问基础 URL: ${baseUrl}`)
    const rootResponse = await fetch(baseUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    })

    console.log(`  状态码: ${rootResponse.status}`)
    console.log(`  Content-Type: ${rootResponse.headers.get('content-type')}`)

    const rootText = await rootResponse.text()
    console.log(`  响应长度: ${rootText.length} 字节`)

    return {
      step: 'Modal 连通性测试',
      success: true,
      message: `成功连接到 Modal (状态码: ${rootResponse.status})`,
      details: {
        statusCode: rootResponse.status,
        contentType: rootResponse.headers.get('content-type'),
        responsePreview: rootText.substring(0, 200),
      },
    }
  } catch (error) {
    return {
      step: 'Modal 连通性测试',
      success: false,
      message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

async function discoverEndpointStructure(): Promise<VerifyResult> {
  const baseUrl = process.env.MODAL_WEB_ENDPOINT_URL!
  const testEndpoints = [
    { method: 'POST', path: '/convert', desc: '同步转换端点' },
    { method: 'POST', path: '/', desc: '根路径 POST' },
    { method: 'GET', path: '/health', desc: '健康检查端点' },
    { method: 'GET', path: '/docs', desc: 'API 文档端点' },
    { method: 'POST', path: '/api/convert', desc: '/api 前缀端点' },
  ]

  const results: Array<{ endpoint: string; status: number; success: boolean }> = []

  console.log('\n[测试 2] 端点结构探测')

  for (const endpoint of testEndpoints) {
    const url = `${baseUrl}${endpoint.path}`
    console.log(`  ${endpoint.method} ${endpoint.path} (${endpoint.desc})...`)

    try {
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.method === 'POST' ? JSON.stringify({ test: true }) : undefined,
        signal: AbortSignal.timeout(10000),
      })

      const success = response.status !== 404
      results.push({
        endpoint: endpoint.path,
        status: response.status,
        success,
      })

      console.log(`    → ${response.status} ${success ? '✓' : '✗'}`)
    } catch (error) {
      results.push({
        endpoint: endpoint.path,
        status: 0,
        success: false,
      })
      console.log(`    → 错误: ${error instanceof Error ? error.message : '未知'}`)
    }
  }

  const validEndpoints = results.filter(r => r.success)

  return {
    step: '端点结构探测',
    success: validEndpoints.length > 0,
    message: `发现 ${validEndpoints.length}/${testEndpoints.length} 个有效端点`,
    details: {
      results,
      validEndpoints: validEndpoints.map(r => r.endpoint),
    },
  }
}

async function testActualInference(): Promise<VerifyResult> {
  const baseUrl = process.env.MODAL_WEB_ENDPOINT_URL!

  console.log('\n[测试 3] 实际推理测试（可选）')
  console.log('  这将发送一个真实的转换请求到 Modal')

  // 使用测试音频 URL
  const testRequest = {
    source_audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    reference_audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    f0_condition: true,
    fp16: true,
  }

  const testEndpoints = [
    `${baseUrl}/convert`,
    `${baseUrl}/`,
    `${baseUrl}/api/convert`,
  ]

  for (const url of testEndpoints) {
    console.log(`\n  尝试: ${url}`)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest),
        signal: AbortSignal.timeout(30000), // 30 秒超时
      })

      console.log(`  状态码: ${response.status}`)

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        const result = await response.json()
        console.log(`  响应:`, JSON.stringify(result, null, 2).substring(0, 500))

        return {
          step: '实际推理测试',
          success: true,
          message: `推理成功 (状态码: ${response.status})`,
          details: {
            endpoint: url,
            response: result,
          },
        }
      }

      const errorText = await response.text()
      console.log(`  错误: ${errorText.substring(0, 200)}`)
    } catch (error) {
      console.log(`  异常: ${error instanceof Error ? error.message : '未知'}`)
    }
  }

  return {
    step: '实际推理测试',
    success: false,
    message: '所有端点测试失败',
    details: {
      hint: '请检查 Modal 函数是否正确部署',
    },
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('Modal API 端点验证')
  console.log('='.repeat(60))

  // 1. 环境变量检查
  const envResult = await verifyEnvironment()
  console.log(`\n[步骤 1] ${envResult.step}: ${envResult.success ? '✓' : '✗'}`)
  console.log(`  ${envResult.message}`)
  if (envResult.details) {
    console.log(`  详情:`, envResult.details)
  }

  if (!envResult.success) {
    console.log('\n❌ 请先配置环境变量后再运行此脚本')
    process.exit(1)
  }

  // 2. 连通性测试
  const connResult = await testModalConnectivity()
  console.log(`\n[步骤 2] ${connResult.step}: ${connResult.success ? '✓' : '✗'}`)
  console.log(`  ${connResult.message}`)

  // 3. 端点结构探测
  const endpointResult = await discoverEndpointStructure()
  console.log(`\n[步骤 3] ${endpointResult.step}: ${endpointResult.success ? '✓' : '✗'}`)
  console.log(`  ${endpointResult.message}`)

  // 4. 实际推理测试（可选）
  console.log('\n是否要运行实际推理测试？这会消耗 GPU 时间。')
  console.log('如果只想测试连通性，可以跳过此步骤。')

  // 自动跳过推理测试（需要用户手动启用）
  const skipInferenceTest = process.env.SKIP_MODAL_INFERENCE_TEST === 'true' || true

  if (!skipInferenceTest) {
    const inferenceResult = await testActualInference()
    console.log(`\n[步骤 4] ${inferenceResult.step}: ${inferenceResult.success ? '✓' : '✗'}`)
    console.log(`  ${inferenceResult.message}`)
  } else {
    console.log('\n[步骤 4] 实际推理测试: 已跳过')
    console.log('  要启用，请设置环境变量: SKIP_MODAL_INFERENCE_TEST=false')
  }

  // 汇总
  console.log('\n' + '='.repeat(60))
  console.log('验证完成')
  console.log('='.repeat(60))

  const allResults = [envResult, connResult, endpointResult]
  const allPassed = allResults.every(r => r.success)

  if (allPassed) {
    console.log('\n✅ 所有基础验证通过')
    console.log('\n下一步建议:')
    console.log('1. 检查端点探测结果，确定正确的 API 路径格式')
    console.log('2. 更新 src/lib/serverless/modal-client.ts 中的 URL 构建逻辑')
    console.log('3. 运行完整集成测试验证 Seed-VC 功能')
  } else {
    console.log('\n⚠️ 部分验证未通过，请检查上述错误信息')
  }
}

main().catch(console.error)
