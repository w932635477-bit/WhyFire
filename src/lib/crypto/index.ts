/**
 * 加密工具
 * 用于加密敏感数据如 Access Token
 */

import crypto from 'crypto'

/**
 * 加密算法配置
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

/**
 * 获取加密密钥
 * 从环境变量获取，确保是 32 字节（256 位）
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    // 开发环境使用默认密钥（生产环境必须设置）
    console.warn('[Crypto] WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!')
    return crypto.scryptSync('dialect-rap-default-key', 'salt', 32)
  }

  // 如果密钥是 hex 编码的 64 字符字符串
  if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) {
    return Buffer.from(key, 'hex')
  }

  // 否则使用 scrypt 派生密钥
  return crypto.scryptSync(key, 'salt', 32)
}

/**
 * 加密数据
 * @param plaintext 明文
 * @returns 加密后的字符串（hex 编码）
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)

  // 使用 salt 派生最终密钥
  const derivedKey = crypto.hkdfSync(
    'sha256',
    key,
    salt,
    Buffer.from('dialect-rap-encryption'),
    32
  )

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // 格式: salt (32) + iv (16) + authTag (16) + encrypted
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ])

  return combined.toString('hex')
}

/**
 * 解密数据
 * @param encryptedData 加密后的字符串（hex 编码）
 * @returns 解密后的明文
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedData, 'hex')

    // 提取各部分
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)

    // 使用 salt 派生最终密钥
    const derivedKey = crypto.hkdfSync(
      'sha256',
      key,
      salt,
      Buffer.from('dialect-rap-encryption'),
      32
    )

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error)
    throw new Error('Decryption failed')
  }
}

/**
 * 哈希数据（单向）
 * @param data 要哈希的数据
 * @param salt 可选的 salt
 * @returns 哈希后的字符串
 */
export function hash(data: string, salt?: string): string {
  const actualSalt = salt || process.env.HASH_SALT || 'default-salt'
  return crypto
    .createHmac('sha256', actualSalt)
    .update(data)
    .digest('hex')
}

/**
 * 验证哈希
 * @param data 原始数据
 * @param hashedData 哈希后的数据
 * @param salt 可选的 salt
 * @returns 是否匹配
 */
export function verifyHash(data: string, hashedData: string, salt?: string): boolean {
  const computedHash = hash(data, salt)
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(hashedData, 'hex')
  )
}

/**
 * 生成安全的随机令牌
 * @param length 字节长度（默认 32）
 * @returns hex 编码的随机字符串
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * 生成基于时间的令牌（用于短期验证）
 * @param secret 密钥
 * @param validitySeconds 有效期（秒）
 * @returns 令牌
 */
export function generateTimedToken(secret: string, validitySeconds: number = 300): string {
  const expiresAt = Math.floor(Date.now() / 1000) + validitySeconds
  const payload = `${expiresAt}:${secret}`
  const signature = hash(payload)
  return Buffer.from(`${expiresAt}:${signature}`).toString('base64url')
}

/**
 * 验证基于时间的令牌
 * @param token 令牌
 * @param secret 密钥
 * @returns 是否有效
 */
export function verifyTimedToken(token: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [expiresAtStr, signature] = decoded.split(':')
    const expiresAt = parseInt(expiresAtStr, 10)

    // 检查是否过期
    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return false
    }

    // 验证签名
    const expectedSignature = hash(`${expiresAt}:${secret}`)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}
