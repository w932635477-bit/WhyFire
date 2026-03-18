/**
 * WeChat Pay Type Definitions
 * 微信支付类型定义
 */

/**
 * WeChat Pay Configuration
 */
export interface WechatPayConfig {
  appId: string           // 公众号ID
  mchId: string           // 商户号
  apiKey: string          // API密钥（V2）
  apiV3Key?: string       // APIv3密钥
  serialNo?: string       // 证书序列号
  privateKey?: string     // 商户私钥
  notifyUrl: string       // 回调地址
}

/**
 * Unified Order Request (统一下单请求)
 */
export interface UnifiedOrderRequest {
  outTradeNo: string      // 商户订单号
  body: string            // 商品描述
  totalFee: number        // 金额（分）
  spbillCreateIp: string  // 终端IP
  notifyUrl: string       // 回调地址
  tradeType: 'NATIVE' | 'JSAPI' | 'APP' | 'H5'
  openid?: string         // 用户标识(JSAPI必填)
  productId?: string      // 商品ID
  attach?: string         // 附加数据
  timeStart?: string      // 交易起始时间
  timeExpire?: string     // 交易结束时间
  goodsTag?: string       // 商品标记
  limitPay?: string       // 指定支付方式
}

/**
 * Unified Order Response (统一下单响应)
 */
export interface UnifiedOrderResponse {
  returnCode: string      // 返回状态码
  returnMsg: string       // 返回信息
  resultCode?: string     // 业务结果
  errCode?: string        // 错误代码
  errCodeDes?: string     // 错误描述
  prepayId?: string       // 预支付交易会话标识
  codeUrl?: string        // 二维码链接(NATIVE)
  mwebUrl?: string        // 跳转链接(H5)
  appId?: string          // 公众号ID
  mchId?: string          // 商户号
  nonceStr?: string       // 随机字符串
  sign?: string           // 签名
  tradeType?: string      // 交易类型
}

/**
 * Payment Callback Data (支付回调数据)
 */
export interface PaymentCallbackData {
  returnCode: string      // 返回状态码
  resultCode: string      // 业务结果
  appId: string           // 公众号ID
  mchId: string           // 商户号
  nonceStr: string        // 随机字符串
  sign: string            // 签名
  outTradeNo: string      // 商户订单号
  transactionId: string   // 微信支付订单号
  totalFee: number        // 支付金额（分）
  feeType: string         // 货币种类
  bankType: string        // 付款银行
  cashFee: number         // 现金支付金额
  cashFeeType: string     // 现金支付货币类型
  timeEnd: string         // 支付完成时间
  attach?: string         // 附加数据
  openid: string          // 用户标识
  tradeType: string       // 交易类型
  bankBillNo?: string     // 银行订单号
}

/**
 * Order Query Request (订单查询请求)
 */
export interface OrderQueryRequest {
  outTradeNo?: string     // 商户订单号
  transactionId?: string  // 微信订单号
}

/**
 * Order Query Response (订单查询响应)
 */
export interface OrderQueryResponse {
  returnCode: string
  returnMsg: string
  resultCode?: string
  errCode?: string
  errCodeDes?: string
  tradeState?: string     // 交易状态
  tradeStateDesc?: string // 交易状态描述
  outTradeNo?: string
  transactionId?: string
  totalFee?: number
  timeEnd?: string
}

/**
 * Close Order Response (关闭订单响应)
 */
export interface CloseOrderResponse {
  returnCode: string
  returnMsg: string
  resultCode?: string
  errCode?: string
  errCodeDes?: string
}

/**
 * Refund Request (退款请求)
 */
export interface RefundRequest {
  outTradeNo: string      // 商户订单号
  outRefundNo: string     // 商户退款单号
  totalFee: number        // 订单总金额
  refundFee: number       // 退款金额
  refundDesc?: string     // 退款原因
  notifyUrl?: string      // 退款回调地址
}

/**
 * Refund Response (退款响应)
 */
export interface RefundResponse {
  returnCode: string
  returnMsg: string
  resultCode?: string
  errCode?: string
  errCodeDes?: string
  refundId?: string       // 微信退款单号
  outRefundNo?: string    // 商户退款单号
  refundFee?: number      // 退款金额
  cashRefundFee?: number  // 现金退款金额
}

/**
 * Trade State Enum (交易状态)
 */
export type TradeState =
  | 'SUCCESS'       // 支付成功
  | 'REFUND'        // 转入退款
  | 'NOTPAY'        // 未支付
  | 'CLOSED'        // 已关闭
  | 'REVOKED'       // 已撤销
  | 'USERPAYING'    // 用户支付中
  | 'PAYERROR'      // 支付失败

/**
 * Create Payment API Response
 */
export interface CreatePaymentResponse {
  orderId: string
  codeUrl: string
  amount: number
  credits: number
  expiredAt: string
}
