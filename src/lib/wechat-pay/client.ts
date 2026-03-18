/**
 * WeChat Pay Client
 * 微信支付客户端 (Native Pay)
 */

import * as crypto from 'crypto'
import {
  WechatPayConfig,
  UnifiedOrderRequest,
  UnifiedOrderResponse,
  PaymentCallbackData,
  OrderQueryResponse,
  CloseOrderResponse,
  RefundRequest,
  RefundResponse,
} from './types'

/**
 * WeChat Pay Client Class
 */
export class WechatPayClient {
  private config: WechatPayConfig
  private apiUrl = 'https://api.mch.weixin.qq.com'

  constructor(config: WechatPayConfig) {
    this.config = config
  }

  /**
   * Create Native Payment Order (创建Native支付订单)
   * @param params Order parameters without tradeType
   * @returns Unified order response with QR code URL
   */
  async createNativeOrder(
    params: Omit<UnifiedOrderRequest, 'tradeType' | 'notifyUrl'>
  ): Promise<UnifiedOrderResponse> {
    const request: UnifiedOrderRequest = {
      ...params,
      tradeType: 'NATIVE',
      notifyUrl: this.config.notifyUrl,
    }

    const xmlData = this.buildXmlRequest(request)
    const response = await fetch(`${this.apiUrl}/pay/unifiedorder`, {
      method: 'POST',
      body: xmlData,
      headers: { 'Content-Type': 'application/xml' },
    })

    const responseText = await response.text()
    return this.parseXmlResponse(responseText)
  }

  /**
   * Query Order Status (查询订单状态)
   * @param outTradeNo Merchant order number
   * @returns Order query response or null if not found
   */
  async queryOrder(outTradeNo: string): Promise<OrderQueryResponse | null> {
    const params: Record<string, string | number> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      out_trade_no: outTradeNo,
      nonce_str: this.generateNonceStr(),
    }

    const sign = this.generateSignature(params)
    const xmlData = this.buildXmlRequest({ ...params, sign })

    const response = await fetch(`${this.apiUrl}/pay/orderquery`, {
      method: 'POST',
      body: xmlData,
      headers: { 'Content-Type': 'application/xml' },
    })

    const responseText = await response.text()
    const result = this.parseXmlResponse(responseText)

    if (result.returnCode === 'SUCCESS' && result.resultCode === 'SUCCESS') {
      return result as OrderQueryResponse
    }
    return null
  }

  /**
   * Close Order (关闭订单)
   * @param outTradeNo Merchant order number
   * @returns Close order response
   */
  async closeOrder(outTradeNo: string): Promise<CloseOrderResponse> {
    const params: Record<string, string | number> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      out_trade_no: outTradeNo,
      nonce_str: this.generateNonceStr(),
    }

    const sign = this.generateSignature(params)
    const xmlData = this.buildXmlRequest({ ...params, sign })

    const response = await fetch(`${this.apiUrl}/pay/closeorder`, {
      method: 'POST',
      body: xmlData,
      headers: { 'Content-Type': 'application/xml' },
    })

    const responseText = await response.text()
    return this.parseXmlResponse(responseText)
  }

  /**
   * Create Refund (申请退款)
   * @param params Refund request parameters
   * @returns Refund response
   */
  async createRefund(params: RefundRequest): Promise<RefundResponse> {
    const requestParams: Record<string, string | number | undefined> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      out_trade_no: params.outTradeNo,
      out_refund_no: params.outRefundNo,
      total_fee: params.totalFee,
      refund_fee: params.refundFee,
      refund_desc: params.refundDesc,
      notify_url: params.notifyUrl,
      nonce_str: this.generateNonceStr(),
    }

    const sign = this.generateSignature(requestParams)
    const xmlData = this.buildXmlRequest({ ...requestParams, sign })

    const response = await fetch(`${this.apiUrl}/secapi/pay/refund`, {
      method: 'POST',
      body: xmlData,
      headers: { 'Content-Type': 'application/xml' },
    })

    const responseText = await response.text()
    return this.parseXmlResponse(responseText)
  }

  /**
   * Verify Callback Signature (验证回调签名)
   * @param xmlData XML data from WeChat callback
   * @returns Whether the signature is valid
   */
  verifyCallback(xmlData: string): boolean {
    const data = this.parseXmlResponse(xmlData)
    const { sign, ...params } = data as any

    if (!sign) return false

    const expectedSign = this.generateSignature(params)
    return sign === expectedSign
  }

  /**
   * Parse Callback Data (解析回调数据)
   * @param xmlData XML data from WeChat callback
   * @returns Parsed callback data
   */
  parseCallbackData(xmlData: string): PaymentCallbackData {
    return this.parseXmlResponse(xmlData) as PaymentCallbackData
  }

  /**
   * Generate Signature (生成签名)
   * @param params Parameters to sign
   * @returns MD5 signature
   */
  private generateSignature(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort()
    const stringA = sortedKeys
      .filter(key => params[key] !== undefined && params[key] !== '')
      .map(key => `${this.toSnakeCase(key)}=${params[key]}`)
      .join('&')

    const stringSignTemp = `${stringA}&key=${this.config.apiKey}`
    return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase()
  }

  /**
   * Generate Nonce String (生成随机字符串)
   * @param length Length of the string (default: 32)
   * @returns Random string
   */
  private generateNonceStr(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Build XML Request (构建XML请求)
   * @param params Parameters to convert to XML
   * @returns XML string
   */
  private buildXmlRequest(params: any): string {
    const xmlEntries = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => {
        const snakeKey = this.toSnakeCase(key)
        // CDATA wrapper for string values
        if (typeof value === 'string' && !/^\d+$/.test(value)) {
          return `<${snakeKey}><![CDATA[${value}]]></${snakeKey}>`
        }
        return `<${snakeKey}>${value}</${snakeKey}>`
      })
      .join('')
    return `<xml>${xmlEntries}</xml>`
  }

  /**
   * Parse XML Response (解析XML响应)
   * @param xml XML string to parse
   * @returns Parsed object with camelCase keys
   */
  parseXmlResponse(xml: string): any {
    const result: any = {}
    const regex = /<(\w+)>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/\1>/g
    let match

    while ((match = regex.exec(xml)) !== null) {
      const key = match[1]
      const value = match[2] || match[3] || ''
      // Convert to camelCase
      const camelKey = this.toCamelCase(key)

      // Try to convert numeric values
      if (/^\d+$/.test(value)) {
        result[camelKey] = parseInt(value, 10)
      } else {
        result[camelKey] = value
      }
    }

    return result
  }

  /**
   * Convert snake_case to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
  }

  /**
   * Convert camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}

// Singleton instance
let wechatPayClient: WechatPayClient | null = null

/**
 * Get WeChat Pay Client Instance (获取微信支付客户端实例)
 * @returns WechatPayClient instance
 */
export function getWechatPayClient(): WechatPayClient {
  if (!wechatPayClient) {
    const config: WechatPayConfig = {
      appId: process.env.WECHAT_APP_ID!,
      mchId: process.env.WECHAT_MCH_ID!,
      apiKey: process.env.WECHAT_PAY_API_KEY!,
      apiV3Key: process.env.WECHAT_PAY_API_V3_KEY,
      serialNo: process.env.WECHAT_PAY_SERIAL_NO,
      privateKey: process.env.WECHAT_PAY_PRIVATE_KEY,
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL!,
    }

    // Validate required config
    if (!config.appId || !config.mchId || !config.apiKey || !config.notifyUrl) {
      throw new Error('Missing required WeChat Pay configuration. Please check environment variables.')
    }

    wechatPayClient = new WechatPayClient(config)
  }

  return wechatPayClient
}

/**
 * Reset WeChat Pay Client (重置微信支付客户端)
 * Used for testing or when config changes
 */
export function resetWechatPayClient(): void {
  wechatPayClient = null
}
