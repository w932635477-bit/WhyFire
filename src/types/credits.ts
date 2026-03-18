/**
 * 积分系统类型定义
 * Credit System Type Definitions
 */

/**
 * 积分包配置
 */
export interface CreditPackage {
  id: string
  name: string              // "基础包", "超值包", "专业包"
  credits: number           // 积分数量
  price: number             // 价格（分）
  originalPrice?: number    // 原价（用于显示折扣）
  bonus: number             // 赠送积分
  popular: boolean          // 是否为热门推荐
  description: string       // 描述
  sortOrder: number         // 排序
  active: boolean           // 是否启用
  createdAt?: string
  updatedAt?: string
}

/**
 * 用户积分
 */
export interface UserCredits {
  userId: string
  balance: number           // 当前积分余额
  totalPurchased: number    // 累计购买
  totalUsed: number         // 累计使用
  createdAt: string
  updatedAt: string
}

/**
 * 积分交易类型
 */
export type CreditTransactionType = 'purchase' | 'use' | 'refund' | 'bonus'

/**
 * 积分交易记录
 */
export interface CreditTransaction {
  id: string
  userId: string
  type: CreditTransactionType
  amount: number            // 正数为增加，负数为减少
  balance: number           // 交易后余额
  packageId?: string        // 购买时关联的套餐ID
  orderId?: string          // 关联订单号
  description: string       // 交易描述
  createdAt: string
}

/**
 * 支付订单状态
 */
export type PaymentOrderStatus = 'pending' | 'paid' | 'failed' | 'refunded'

/**
 * 支付订单
 */
export interface PaymentOrder {
  id: string
  userId: string
  packageId: string
  amount: number            // 支付金额（分）
  credits: number           // 获得积分
  status: PaymentOrderStatus
  wechatOrderId?: string    // 微信订单号
  wechatPrepayId?: string   // 微信预支付ID
  paidAt?: string
  createdAt: string
  expiredAt: string
}

/**
 * 购买积分请求
 */
export interface PurchaseCreditsRequest {
  packageId: string
}

/**
 * 购买积分响应
 */
export interface PurchaseCreditsResponse {
  orderId: string
  wechatPrepayId?: string
  amount: number
  credits: number
}

/**
 * 积分使用请求
 */
export interface UseCreditsRequest {
  amount: number
  description: string
  orderId?: string
}

/**
 * 积分使用响应
 */
export interface UseCreditsResponse {
  success: boolean
  transactionId?: string
  balance: number
  error?: string
}

/**
 * 用户积分概览
 */
export interface UserCreditsOverview {
  balance: number
  totalPurchased: number
  totalUsed: number
  totalBonus: number
  recentTransactions: CreditTransaction[]
}

/**
 * 微信支付参数（用于前端调用）
 */
export interface WechatPayParams {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}
