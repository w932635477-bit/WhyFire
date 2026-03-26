/**
 * Modal Token 配置工具
 *
 * 用于在获取 Modal Token 后进行配置
 */

import * as readline from 'readline'
import { writeFileSync, existsSync, readFileSync, appendFileSync } from 'fs'
import { resolve } from 'path'
import { homedir } from 'os'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('  Modal Token 配置工具')
  console.log('='.repeat(60) + '\n')

  // 步骤 1: 检查现有配置
  const modalConfigPath = resolve(homedir(), '.modal.toml')
  if (existsSync(modalConfigPath)) {
    console.log('✓ 发现现有 Modal 配置')
    const content = readFileSync(modalConfigPath, 'utf-8')
    if (content.includes('token_id') && content.includes('token_secret')) {
      console.log('✓ Token 已配置\n')
      rl.close()
      return
    }
  }

  // 步骤 2: 引导获取 Token
  console.log('📋 获取 Modal Token:\n')
  console.log('1. 访问: https://modal.com/settings/tokens')
  console.log('2. 点击 "Create new token"')
  console.log('3. 输入 Token 名称（如: whyfire-local）')
  console.log('4. 点击 "Create token"')
  console.log('5. 复制显示的 Token（只显示一次）\n')

  const tokenInput = await question('请粘贴 Token ID 和 Secret (格式: token_id:token_secret): ')

  if (!tokenInput.includes(':')) {
    console.log('\n✗ Token 格式错误，应该是 token_id:token_secret')
    rl.close()
    process.exit(1)
  }

  const [tokenId, tokenSecret] = tokenInput.split(':')

  if (!tokenId || !tokenSecret) {
    console.log('\n✗ Token ID 或 Secret 为空')
    rl.close()
    process.exit(1)
  }

  // 步骤 3: 写入配置
  const configContent = `
[default]
token_id = "${tokenId}"
token_secret = "${tokenSecret}"
`

  writeFileSync(modalConfigPath, configContent.trim() + '\n')
  console.log(`\n✓ Token 已保存到: ${modalConfigPath}\n`)

  // 步骤 4: 验证
  console.log('🔍 验证 Token...')
  const { execSync } = require('child_process')
  try {
    execSync('python3 -m modal app list', { stdio: 'pipe' })
    console.log('✓ Token 验证成功\n')
  } catch (error) {
    console.log('⚠ Token 可能无效，请检查\n')
  }

  console.log('='.repeat(60))
  console.log('  ✅ Modal 配置完成')
  console.log('='.repeat(60) + '\n')

  console.log('下一步:')
  console.log('  1. 部署 Mock: npm run modal:deploy')
  console.log('  2. 验证 API: npm run modal:verify')
  console.log('')

  rl.close()
}

main().catch(console.error)
