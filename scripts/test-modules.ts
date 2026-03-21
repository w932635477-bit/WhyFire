/**
 * 集成测试脚本
 * 测试各模块功能是否正常
 */

import { config } from 'dotenv'
config()

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60))
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`
  console.log(`  ${status} ${name}`)
  if (details) {
    console.log(`         ${details}`)
  }
}

// 测试结果统计
let totalTests = 0
let passedTests = 0

async function runTests() {
  log('blue', '\n🧪 方言Rap生成系统 - 集成测试\n')

  // 1. 测试缓存模块
  await testCacheModule()

  // 2. 测试加密模块
  await testCryptoModule()

  // 3. 测试安全命令执行
  await testSafeExecModule()

  // 4. 测试方言配置
  await testDialectConfig()

  // 5. 测试认证模块
  await testAuthModule()

  // 打印总结
  printSummary()
}

/**
 * 测试缓存模块
 */
async function testCacheModule() {
  logSection('📦 缓存模块测试')

  try {
    const { getMemoryCache } = await import('../src/lib/cache/memory-cache')
    const cache = getMemoryCache()

    // 测试基本操作
    totalTests++
    const testKey = 'test_key_' + Date.now()
    const testValue = { data: 'test_value', timestamp: Date.now() }

    // Set
    await cache.set(testKey, testValue, { ttl: 60 })
    logTest('缓存 Set 操作', true)

    // Get
    totalTests++
    const retrieved = await cache.get<typeof testValue>(testKey)
    const getPassed = retrieved?.data === testValue.data
    passedTests += getPassed ? 1 : 0
    logTest('缓存 Get 操作', getPassed, getPassed ? `获取到: ${retrieved?.data}` : '未找到数据')

    // Exists
    totalTests++
    const exists = await cache.exists(testKey)
    passedTests += exists ? 1 : 0
    logTest('缓存 Exists 操作', exists)

    // TTL
    totalTests++
    const ttl = await cache.ttl(testKey)
    const ttlPassed = ttl > 0 && ttl <= 60
    passedTests += ttlPassed ? 1 : 0
    logTest('缓存 TTL 操作', ttlPassed, `剩余 ${ttl} 秒`)

    // Delete
    totalTests++
    await cache.delete(testKey)
    const afterDelete = await cache.get(testKey)
    const deletePassed = afterDelete === null
    passedTests += deletePassed ? 1 : 0
    logTest('缓存 Delete 操作', deletePassed)

    // Incr
    totalTests++
    const incrKey = 'incr_test'
    const incrResult = await cache.incr(incrKey)
    const incrPassed = incrResult === 1
    passedTests += incrPassed ? 1 : 0
    logTest('缓存 Incr 操作', incrPassed, `结果: ${incrResult}`)

    // 健康检查
    totalTests++
    const health = await cache.healthCheck()
    const healthPassed = health.status === 'ok'
    passedTests += healthPassed ? 1 : 0
    logTest('缓存健康检查', healthPassed, `延迟: ${health.latency}ms`)

  } catch (error) {
    log('red', `  ✗ 缓存模块错误: ${error}`)
  }
}

/**
 * 测试加密模块
 */
async function testCryptoModule() {
  logSection('🔐 加密模块测试')

  try {
    const { encrypt, decrypt, hash, verifyHash, generateSecureToken } = await import('../src/lib/crypto')

    // 测试加密解密
    totalTests++
    const plaintext = '这是一个测试字符串 with special chars !@#$%'
    const encrypted = encrypt(plaintext)
    const encryptPassed = encrypted !== plaintext && encrypted.length > plaintext.length
    passedTests += encryptPassed ? 1 : 0
    logTest('加密操作', encryptPassed, `原文长度: ${plaintext.length}, 密文长度: ${encrypted.length}`)

    // 测试解密
    totalTests++
    const decrypted = decrypt(encrypted)
    const decryptPassed = decrypted === plaintext
    passedTests += decryptPassed ? 1 : 0
    logTest('解密操作', decryptPassed, decryptPassed ? '原文匹配' : '原文不匹配')

    // 测试哈希
    totalTests++
    const dataToHash = 'password123'
    const hashed = hash(dataToHash)
    const hashPassed = hashed !== dataToHash && hashed.length === 64
    passedTests += hashPassed ? 1 : 0
    logTest('哈希操作', hashPassed, `哈希值: ${hashed.substring(0, 20)}...`)

    // 测试哈希验证
    totalTests++
    const verifyResult = verifyHash(dataToHash, hashed)
    passedTests += verifyResult ? 1 : 0
    logTest('哈希验证', verifyResult)

    // 测试错误哈希验证
    totalTests++
    const wrongVerify = verifyHash('wrong_password', hashed)
    const wrongVerifyPassed = !wrongVerify
    passedTests += wrongVerifyPassed ? 1 : 0
    logTest('错误哈希验证', wrongVerifyPassed, '应该返回 false')

    // 测试安全令牌生成
    totalTests++
    const token = generateSecureToken(32)
    const tokenPassed = token.length === 64 && /^[0-9a-f]+$/.test(token)
    passedTests += tokenPassed ? 1 : 0
    logTest('安全令牌生成', tokenPassed, `令牌: ${token.substring(0, 20)}...`)

  } catch (error) {
    log('red', `  ✗ 加密模块错误: ${error}`)
  }
}

/**
 * 测试安全命令执行
 */
async function testSafeExecModule() {
  logSection('🛡️ 安全命令执行测试')

  try {
    const { safeExec, validatePath, validateUserId, escapeShellArg } = await import('../src/lib/utils/safe-exec')

    // 测试路径验证
    totalTests++
    const validPath = validatePath('/tmp/test/audio.wav')
    passedTests += validPath ? 1 : 0
    logTest('有效路径验证', validPath, '/tmp/test/audio.wav')

    totalTests++
    const invalidPath = validatePath('../../../etc/passwd')
    const pathTraversalBlocked = !invalidPath
    passedTests += pathTraversalBlocked ? 1 : 0
    logTest('路径遍历防护', pathTraversalBlocked, '../../../etc/passwd 被阻止')

    totalTests++
    const cmdInjectionPath = validatePath('/tmp/test$(whoami).wav')
    const cmdInjectionBlocked = !cmdInjectionPath
    passedTests += cmdInjectionBlocked ? 1 : 0
    logTest('命令注入防护', cmdInjectionBlocked, '$(whoami) 被阻止')

    // 测试用户 ID 验证
    totalTests++
    const validUserId = validateUserId('user_123')
    passedTests += validUserId ? 1 : 0
    logTest('有效用户 ID', validUserId, 'user_123')

    totalTests++
    const invalidUserId = validateUserId('user;rm -rf /')
    const invalidUserIdBlocked = !invalidUserId
    passedTests += invalidUserIdBlocked ? 1 : 0
    logTest('恶意用户 ID 防护', invalidUserIdBlocked, 'user;rm -rf / 被阻止')

    // 测试 Shell 参数转义
    totalTests++
    const escaped = escapeShellArg("test'value")
    const escapedCorrectly = escaped.includes("\\'")
    passedTests += escapedCorrectly ? 1 : 0
    logTest('Shell 参数转义', escapedCorrectly, `转义后: ${escaped}`)

    // 测试安全执行 (echo 命令)
    totalTests++
    const result = await safeExec('echo', ['hello', 'world'])
    const echoPassed = result.success && result.stdout === 'hello world'
    passedTests += echoPassed ? 1 : 0
    logTest('安全命令执行 (echo)', echoPassed, `输出: ${result.stdout}`)

  } catch (error) {
    log('red', `  ✗ 安全命令执行模块错误: ${error}`)
  }
}

/**
 * 测试方言配置
 */
async function testDialectConfig() {
  logSection('🌍 方言配置测试')

  try {
    const { DIALECT_CONFIGS_V2, DIALECT_CODES_V2, isValidDialectCodeV2, getEnabledDialectsV2 } = await import('../src/types/dialect-v2')

    // 测试方言数量
    totalTests++
    const dialectCount = DIALECT_CODES_V2.length
    const countPassed = dialectCount === 8
    passedTests += countPassed ? 1 : 0
    logTest('方言数量', countPassed, `共 ${dialectCount} 种方言`)

    // 测试方言代码
    totalTests++
    const expectedDialects = ['mandarin', 'cantonese', 'sichuan', 'dongbei', 'shandong', 'shanghai', 'henan', 'hunan']
    const codesMatch = JSON.stringify(DIALECT_CODES_V2.sort()) === JSON.stringify(expectedDialects.sort())
    passedTests += codesMatch ? 1 : 0
    logTest('方言代码匹配', codesMatch, expectedDialects.join(', '))

    // 测试验证函数
    totalTests++
    const validCode = isValidDialectCodeV2('cantonese')
    passedTests += validCode ? 1 : 0
    logTest('有效方言代码验证', validCode, 'cantonese')

    totalTests++
    const invalidCode = !isValidDialectCodeV2('minnan')  // 闽南语不在列表中
    passedTests += invalidCode ? 1 : 0
    logTest('无效方言代码拒绝', invalidCode, 'minnan 被拒绝')

    // 测试获取启用的方言
    totalTests++
    const enabledDialects = getEnabledDialectsV2()
    const allEnabled = enabledDialects.length === 8 && enabledDialects.every(d => d.enabled)
    passedTests += allEnabled ? 1 : 0
    logTest('获取启用的方言', allEnabled, `共 ${enabledDialects.length} 种`)

    // 测试 CosyVoice ID 配置
    totalTests++
    const hasCosyVoiceIds = Object.values(DIALECT_CONFIGS_V2).every(d => d.cosyVoiceId)
    passedTests += hasCosyVoiceIds ? 1 : 0
    logTest('CosyVoice ID 配置', hasCosyVoiceIds)

  } catch (error) {
    log('red', `  ✗ 方言配置模块错误: ${error}`)
  }
}

/**
 * 测试认证模块
 */
async function testAuthModule() {
  logSection('👤 认证模块测试')

  try {
    const { getGuestManager } = await import('../src/lib/auth/guest-manager')
    const manager = getGuestManager()

    // 测试创建游客会话
    totalTests++
    const session = await manager.createGuestSession('test_fingerprint')
    const sessionCreated = !!session.sessionId && !!session.accessToken
    passedTests += sessionCreated ? 1 : 0
    logTest('创建游客会话', sessionCreated, `会话ID: ${session.sessionId?.substring(0, 20)}...`)

    // 测试获取会话
    totalTests++
    const retrieved = await manager.getGuestSession(session.sessionId)
    const sessionRetrieved = !!retrieved && retrieved.sessionId === session.sessionId
    passedTests += sessionRetrieved ? 1 : 0
    logTest('获取游客会话', sessionRetrieved)

    // 测试续期会话
    totalTests++
    const renewed = await manager.renewGuestSession(session.sessionId)
    const sessionRenewed = !!renewed
    passedTests += sessionRenewed ? 1 : 0
    logTest('续期游客会话', sessionRenewed)

    // 测试删除会话
    totalTests++
    await manager.deleteGuestSession(session.sessionId)
    const afterDelete = await manager.getGuestSession(session.sessionId)
    const sessionDeleted = afterDelete === null
    passedTests += sessionDeleted ? 1 : 0
    logTest('删除游客会话', sessionDeleted)

    // 测试过期检查
    totalTests++
    const isExpired = manager.isSessionExpired({
      ...session,
      expiresAt: new Date(Date.now() - 1000)  // 1秒前过期
    })
    passedTests += isExpired ? 1 : 0
    logTest('会话过期检查', isExpired)

  } catch (error) {
    log('red', `  ✗ 认证模块错误: ${error}`)
  }
}

/**
 * 打印测试总结
 */
function printSummary() {
  logSection('📊 测试总结')

  const percentage = Math.round((passedTests / totalTests) * 100)
  const status = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red'

  console.log(`\n  总测试数: ${totalTests}`)
  console.log(`  通过: ${colors.green}${passedTests}${colors.reset}`)
  console.log(`  失败: ${colors.red}${totalTests - passedTests}${colors.reset}`)
  console.log(`  通过率: ${colors[status]}${percentage}%${colors.reset}`)

  if (percentage >= 80) {
    log('green', '\n  ✅ 测试通过！系统状态良好。\n')
  } else if (percentage >= 60) {
    log('yellow', '\n  ⚠️  部分测试失败，需要检查。\n')
  } else {
    log('red', '\n  ❌ 测试失败率较高，需要修复。\n')
  }

  // 环境建议
  log('blue', '\n  📝 环境配置建议:')
  console.log('  ─────────────────────────────────────')
  console.log('  1. Redis 配置 (可选):')
  console.log('     REDIS_URL=redis://localhost:6379')
  console.log('     CACHE_PROVIDER=redis')
  console.log('')
  console.log('  2. 加密密钥 (生产环境必须):')
  console.log('     ENCRYPTION_KEY=<32字节的hex字符串>')
  console.log('')
  console.log('  3. 微信登录 (可选):')
  console.log('     WECHAT_APP_ID=<your_app_id>')
  console.log('     WECHAT_APP_SECRET=<your_secret>')
  console.log('  ─────────────────────────────────────\n')
}

// 运行测试
runTests().catch(console.error)
