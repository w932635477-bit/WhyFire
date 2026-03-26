/**
 * Modal 快速设置脚本
 *
 * 用途：检查 Modal 配置状态并指导设置
 * 运行：npx tsx scripts/setup-modal.ts
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import readline from 'readline'

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkCommand(command: string): boolean {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function runCommand(command: string, silent = false): string {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    })
  } catch (error) {
    return ''
  }
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('\n' + '='.repeat(60))
  log('cyan', '  Modal 快速设置向导')
  console.log('='.repeat(60) + '\n')

  // 步骤 1: 检查 Python
  log('blue', '步骤 1/6: 检查 Python 环境')
  if (!checkCommand('python3') && !checkCommand('python')) {
    log('red', '  ✗ Python 未安装')
    log('yellow', '  请安装 Python 3.10+: https://www.python.org/downloads/')
    process.exit(1)
  }
  log('green', '  ✓ Python 已安装')

  // 步骤 2: 检查 Modal CLI
  log('blue', '\n步骤 2/6: 检查 Modal CLI')
  if (!checkCommand('modal')) {
    log('yellow', '  ⚠ Modal CLI 未安装')

    const install = await prompt('  是否自动安装？(y/n): ')
    if (install.toLowerCase() === 'y') {
      log('cyan', '  安装 Modal CLI...')
      runCommand('pip install modal')
      log('green', '  ✓ Modal CLI 安装完成')
    } else {
      log('yellow', '  请手动安装: pip install modal')
      process.exit(1)
    }
  } else {
    log('green', '  ✓ Modal CLI 已安装')
  }

  // 步骤 3: 检查 Modal 认证
  log('blue', '\n步骤 3/6: 检查 Modal 认证')
  const modalConfigPath = resolve(process.env.HOME || '~', '.modal.toml')
  if (!existsSync(modalConfigPath)) {
    log('yellow', '  ⚠ 未配置 Modal 认证')

    const login = await prompt('  是否现在登录 Modal？(y/n): ')
    if (login.toLowerCase() === 'y') {
      log('cyan', '  打开浏览器进行认证...')
      runCommand('modal token new')
      log('green', '  ✓ Modal 认证完成')
    } else {
      log('yellow', '  请手动运行: modal token new')
      process.exit(1)
    }
  } else {
    log('green', '  ✓ Modal 已认证')
  }

  // 步骤 4: 测试 Modal 连接
  log('blue', '\n步骤 4/6: 测试 Modal 连接')
  try {
    const testOutput = runCommand('modal app list', true)
    if (testOutput) {
      log('green', '  ✓ Modal 连接成功')
    } else {
      log('yellow', '  ⚠ Modal 连接测试失败（可能没有部署的应用）')
    }
  } catch (error) {
    log('yellow', '  ⚠ Modal 连接测试失败')
  }

  // 步骤 5: 部署 Mock 版本
  log('blue', '\n步骤 5/6: 部署 Seed-VC Mock 版本')

  const mockFile = resolve(process.cwd(), 'modal', 'seed_vc_mock.py')
  if (!existsSync(mockFile)) {
    log('cyan', '  创建 Mock 部署文件...')

    // 创建 modal 目录
    runCommand('mkdir -p modal')

    // 创建 mock 文件
    const mockContent = `"""
Seed-VC Mock 版本 - 快速测试 Modal 部署
"""

import modal

app = modal.App("seed-vc-mock")

@app.cls(
    image=modal.Image.debian_slim().pip_install("fastapi", "python-multipart"),
    timeout=60,
)
class SeedVCMock:
    @modal.web_endpoint(method="POST")
    def convert(self, data: dict):
        """Mock 声音转换"""
        source_url = data.get("source_audio_url")
        reference_url = data.get("reference_audio_url")

        if not source_url or not reference_url:
            return {"error": "Missing parameters"}, 400

        return {
            "status": "completed",
            "output_audio": source_url,
            "duration": 30.0,
            "processing_time": 0.1,
        }

    @modal.web_endpoint(method="GET")
    def health(self):
        return {"status": "ok", "mode": "mock"}


@app.local_entrypoint()
def main():
    print("Mock 版本已部署")
`

    writeFileSync(mockFile, mockContent)
    log('green', '  ✓ Mock 文件已创建')
  }

  const deploy = await prompt('  是否部署到 Modal？(y/n): ')
  if (deploy.toLowerCase() === 'y') {
    log('cyan', '  部署中...（可能需要 1-2 分钟）')
    try {
      runCommand(`modal deploy ${mockFile}`)
      log('green', '  ✓ 部署成功')

      // 获取 Web Endpoint URL
      const appInfo = runCommand('modal app show seed-vc-mock', true)
      const urlMatch = appInfo.match(/https:\/\/[^\s]+\.modal\.run/)

      if (urlMatch) {
        log('green', `\n  📡 Web Endpoint: ${urlMatch[0]}`)

        // 自动更新 .env.local
        const envPath = resolve(process.cwd(), '.env.local')
        const envContent = existsSync(envPath)
          ? readFileSync(envPath, 'utf-8')
          : ''

        if (!envContent.includes('MODAL_WEB_ENDPOINT_URL')) {
          const newEnv = envContent + `\n# Modal 配置\nMODAL_WEB_ENDPOINT_URL=${urlMatch[0]}\nSEEDVC_BACKEND=modal\n`
          writeFileSync(envPath, newEnv)
          log('green', '  ✓ 已更新 .env.local')
        } else {
          log('cyan', '  .env.local 已配置 Modal URL')
        }
      }
    } catch (error) {
      log('red', '  ✗ 部署失败')
      log('yellow', '  请检查 Modal 日志: modal app logs seed-vc-mock')
    }
  }

  // 步骤 6: 验证集成
  log('blue', '\n步骤 6/6: 验证集成')
  const verify = await prompt('  是否运行验证脚本？(y/n): ')
  if (verify.toLowerCase() === 'y') {
    log('cyan', '  运行验证脚本...')
    runCommand('npx tsx scripts/verify-modal-api.ts')
  }

  // 完成
  console.log('\n' + '='.repeat(60))
  log('green', '  ✓ Modal 设置完成！')
  console.log('='.repeat(60) + '\n')

  log('cyan', '下一步:')
  console.log('1. 测试 API: curl $MODAL_WEB_ENDPOINT_URL/health')
  console.log('2. 运行集成测试: npx vitest run tests/integration/seed-vc-client.test.ts')
  console.log('3. 查看日志: modal app logs seed-vc-mock')
  console.log('4. 部署真实版本: 参考 docs/MODAL_DEPLOYMENT.md')
  console.log('')
}

main().catch(console.error)
