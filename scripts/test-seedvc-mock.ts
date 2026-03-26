/**
 * Seed-VC 快速测试（无需 Modal）
 *
 * 这个脚本测试本地的 Seed-VC 客户端集成
 * 使用 Mock 后端，不需要实际部署 Modal
 *
 * 运行：npx tsx scripts/test-seedvc-mock.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('  Seed-VC Mock 模式测试')
  console.log('='.repeat(60) + '\n')

  // 步骤 1: 配置环境
  console.log('📋 步骤 1: 配置环境')
  process.env.SEEDVC_BACKEND = 'mock'
  console.log('  ✓ 设置 SEEDVC_BACKEND=mock\n')

  // 步骤 2: 导入客户端
  console.log('📦 步骤 2: 导入 Seed-VC 客户端')
  const { getSeedVCClient, SeedVCMockClient } = await import('../src/lib/audio/seed-vc-client')
  const client = getSeedVCClient()

  if (!(client instanceof SeedVCMockClient)) {
    console.error('  ✗ 客户端类型错误')
    process.exit(1)
  }
  console.log('  ✓ 客户端已加载: SeedVCMockClient\n')

  // 步骤 3: 测试可用性
  console.log('🔍 步骤 3: 测试服务可用性')
  const available = await client.isAvailable()
  if (!available) {
    console.error('  ✗ 服务不可用')
    process.exit(1)
  }
  console.log('  ✓ 服务可用\n')

  // 步骤 4: 测试转换
  console.log('🎵 步骤 4: 测试声音转换')
  console.log('  输入:')
  console.log('    - 源音频: https://example.com/source.mp3')
  console.log('    - 参考音频: https://example.com/reference.mp3')
  console.log('    - F0 条件: true (Rap 模式)')
  console.log('')

  const startTime = Date.now()
  const result = await client.convert({
    sourceAudio: 'https://example.com/source.mp3',
    referenceAudio: 'https://example.com/reference.mp3',
    f0Condition: true,
    fp16: true,
  })
  const duration = Date.now() - startTime

  console.log('  输出:')
  console.log(`    - Task ID: ${result.taskId}`)
  console.log(`    - 状态: ${result.status}`)
  console.log(`    - 输出音频: ${result.outputAudio}`)
  console.log(`    - 处理时间: ${duration}ms\n`)

  if (result.status !== 'completed') {
    console.error('  ✗ 转换失败')
    process.exit(1)
  }
  console.log('  ✓ 转换成功\n')

  // 步骤 5: 测试状态查询
  console.log('📊 步骤 5: 测试状态查询')
  const status = await client.getStatus(result.taskId!)
  console.log(`    - Task ID: ${status.taskId}`)
  console.log(`    - 状态: ${status.status}\n`)

  if (status.status !== 'completed') {
    console.error('  ✗ 状态查询失败')
    process.exit(1)
  }
  console.log('  ✓ 状态查询成功\n')

  // 完成
  console.log('='.repeat(60))
  console.log('  ✅ 所有测试通过！')
  console.log('='.repeat(60) + '\n')

  console.log('📝 总结:')
  console.log('  - Mock 客户端工作正常')
  console.log('  - 声音转换功能可用')
  console.log('  - 状态查询功能可用')
  console.log('')
  console.log('🚀 下一步:')
  console.log('  1. 配置 Modal 认证: python3 -m modal token new')
  console.log('  2. 部署 Mock 版本: modal deploy modal/seed_vc_mock.py')
  console.log('  3. 切换到 Modal 后端: SEEDVC_BACKEND=modal')
  console.log('')
}

main().catch((error) => {
  console.error('\n❌ 测试失败:', error)
  process.exit(1)
})
