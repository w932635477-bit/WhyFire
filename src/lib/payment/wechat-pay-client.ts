import WxPay from 'wechatpay-node-v3'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

const {
  WECHAT_PAY_MCH_ID: mchId = '',
  WECHAT_PAY_API_V3_KEY: apiV3Key = '',
  WECHAT_PAY_SERIAL_NO: serialNo = '',
  WECHAT_PAY_PRIVATE_KEY_PATH: privateKeyPath = '',
  WECHAT_PAY_APP_ID: appId = '',
  WECHAT_PAY_NOTIFY_URL: notifyUrl = '',
} = process.env

let _client: WxPay | null = null

function getClient(): WxPay {
  if (_client) return _client

  let privateKey: Buffer
  let publicKey: Buffer
  try {
    privateKey = Buffer.from(readFileSync(privateKeyPath, 'utf-8'))
  } catch {
    privateKey = Buffer.from('')
  }
  try {
    // Merchant certificate (apiclient_cert.pem) - used for serial number extraction
    const certPath = privateKeyPath.replace('key', 'cert')
    publicKey = Buffer.from(readFileSync(certPath, 'utf-8'))
  } catch {
    publicKey = Buffer.from('')
  }

  _client = new WxPay({
    appid: appId,
    mchid: mchId,
    publicKey,
    privateKey,
  })

  return _client
}

export interface CreateOrderParams {
  orderId: string
  description: string
  amount: number // in fen (cents)
  userId: string
}

export interface CreateOrderResult {
  prepay_id: string
  code_url?: string // For QR code (Native)
  h5_url?: string // For H5 payment
}

/**
 * Create a WeChat Pay order (Native payment for QR code)
 */
export async function createNativeOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const client = getClient()

  const result: any = await client.transactions_native({
    description: params.description,
    out_trade_no: params.orderId,
    notify_url: notifyUrl,
    amount: {
      total: params.amount,
      currency: 'CNY',
    },
  })

  return {
    prepay_id: result.code_url || '',
    code_url: result.code_url,
  }
}

/**
 * Create a WeChat Pay H5 order (for mobile browser)
 */
export async function createH5Order(
  params: CreateOrderParams,
  _userAgent: string,
  clientIp: string,
): Promise<CreateOrderResult> {
  const client = getClient()

  const result: any = await client.transactions_h5({
    description: params.description,
    out_trade_no: params.orderId,
    notify_url: notifyUrl,
    amount: {
      total: params.amount,
      currency: 'CNY',
    },
    scene_info: {
      payer_client_ip: clientIp,
      h5_info: {
        type: 'Wap',
        app_name: '方言回响 WhyFire',
        app_url: 'https://whyfire.com',
      },
    },
  })

  return {
    prepay_id: '',
    h5_url: result.h5_url,
  }
}

/**
 * Create a WeChat Pay JSAPI order (for in-WeChat browser)
 */
export async function createJsapiOrder(
  params: CreateOrderParams,
  openid: string,
): Promise<CreateOrderResult> {
  const client = getClient()

  const result: any = await client.transactions_jsapi({
    description: params.description,
    out_trade_no: params.orderId,
    notify_url: notifyUrl,
    amount: {
      total: params.amount,
      currency: 'CNY',
    },
    payer: {
      openid,
    },
  })

  return {
    prepay_id: result.prepay_id,
  }
}

/**
 * Query order status by out_trade_no
 */
export async function queryOrder(orderId: string): Promise<{
  trade_state: string
  trade_state_desc: string
  transaction_id?: string
}> {
  const client = getClient()

  const result: any = await client.query({ out_trade_no: orderId } as any)

  return {
    trade_state: result.trade_state,
    trade_state_desc: result.trade_state_desc,
    transaction_id: result.transaction_id,
  }
}

/**
 * Close an unpaid order
 */
export async function closeOrder(orderId: string): Promise<void> {
  const client = getClient()
  await client.close({ out_trade_no: orderId } as any)
}

/**
 * Generate JSAPI pay parameters for WeChat in-app browser
 */
export function generatePayParams(prepayId: string): {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
} {
  const timeStamp = Math.floor(Date.now() / 1000).toString()
  const nonceStr = randomUUID().replace(/-/g, '')
  const packageStr = `prepay_id=${prepayId}`

  return {
    appId,
    timeStamp,
    nonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign: '',
  }
}

/**
 * Verify WeChat Pay callback notification signature
 */
export async function verifyNotification(
  _headers: Record<string, string>,
  body: string,
): Promise<{
  verified: boolean
  data?: {
    out_trade_no: string
    transaction_id: string
    trade_state: string
    amount: { total: number }
  }
}> {
  try {
    const client = getClient()

    const resource = JSON.parse(body).resource
    const decrypted = client.decipher_gcm(
      resource.ciphertext,
      resource.associated_data,
      resource.nonce,
      apiV3Key,
    )

    const data = JSON.parse(decrypted as string)

    return {
      verified: true,
      data: {
        out_trade_no: data.out_trade_no,
        transaction_id: data.transaction_id,
        trade_state: data.trade_state,
        amount: data.amount,
      },
    }
  } catch (error) {
    console.error('[WeChatPay] Notification verification failed:', error)
    return { verified: false }
  }
}

/**
 * Check if WeChat Pay is configured
 */
export function isConfigured(): boolean {
  return !!(mchId && appId && apiV3Key && privateKeyPath)
}
