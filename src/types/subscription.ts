/**
 * WhyFire 订阅系统类型定义
 */

/**
 * 订阅计划类型
 */
export type PlanType = 'free' | 'lite' | 'pro';

/**
 * 订阅状态
 */
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

/**
 * 订阅权益
 */
export interface SubscriptionBenefit {
  /** 每日/每月积分数量 */
  credits: number;
  /** 积分重置周期 */
  creditsResetPeriod: 'daily' | 'monthly';
  /** 可用场景范围 */
  scenesAccess: 'basic' | 'all';
  /** 是否有水印 */
  hasWatermark: boolean;
  /** 视频分辨率 */
  videoResolution: '720p' | '1080p';
  /** 方言支持 */
  dialectSupport: 'none' | 'limited' | 'all';
  /** 是否优先队列 */
  priorityQueue: boolean;
  /** 功能列表 */
  features: string[];
}

/**
 * 订阅计划
 */
export interface SubscriptionPlan {
  /** 计划ID */
  id: PlanType;
  /** 计划名称 */
  name: string;
  /** 计划显示名称 */
  displayName: string;
  /** 价格（分） */
  price: number;
  /** 货币 */
  currency: string;
  /** 计费周期 */
  billingCycle: 'monthly' | 'yearly' | 'none';
  /** 计划描述 */
  description: string;
  /** 权益详情 */
  benefits: SubscriptionBenefit;
  /** 是否为推荐计划 */
  isRecommended?: boolean;
  /** 是否启用 */
  isEnabled: boolean;
  /** 排序权重 */
  sortOrder: number;
}

/**
 * 预定义的订阅计划配置
 */
export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: '免费版',
    price: 0,
    currency: 'CNY',
    billingCycle: 'none',
    description: '体验 WhyFire 的基础功能',
    benefits: {
      credits: 2,
      creditsResetPeriod: 'daily',
      scenesAccess: 'basic',
      hasWatermark: true,
      videoResolution: '720p',
      dialectSupport: 'none',
      priorityQueue: false,
      features: [
        '每日 2 积分',
        '基础场景',
        '720p 视频分辨率',
        '视频带水印',
      ],
    },
    isEnabled: true,
    sortOrder: 1,
  },
  lite: {
    id: 'lite',
    name: 'lite',
    displayName: '轻量版',
    price: 8900, // 89.00 元（单位：分）
    currency: 'CNY',
    billingCycle: 'monthly',
    description: '适合个人创作者和轻度使用者',
    benefits: {
      credits: 60,
      creditsResetPeriod: 'monthly',
      scenesAccess: 'all',
      hasWatermark: false,
      videoResolution: '1080p',
      dialectSupport: 'limited',
      priorityQueue: false,
      features: [
        '每月 60 积分',
        '全部场景',
        '1080p 视频分辨率',
        '无水印',
        '2种方言支持',
      ],
    },
    isRecommended: true,
    isEnabled: true,
    sortOrder: 2,
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: '专业版',
    price: 13900, // 139.00 元（单位：分）
    currency: 'CNY',
    billingCycle: 'monthly',
    description: '适合专业创作者和团队使用',
    benefits: {
      credits: 200,
      creditsResetPeriod: 'monthly',
      scenesAccess: 'all',
      hasWatermark: false,
      videoResolution: '1080p',
      dialectSupport: 'all',
      priorityQueue: true,
      features: [
        '每月 200 积分',
        '全部场景',
        '1080p 视频分辨率',
        '无水印',
        '全部方言支持',
        '优先生成队列',
      ],
    },
    isEnabled: true,
    sortOrder: 3,
  },
};

/**
 * 用户订阅记录
 */
export interface UserSubscription {
  /** 订阅记录ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 订阅计划类型 */
  planId: PlanType;
  /** 订阅状态 */
  status: SubscriptionStatus;
  /** 开始时间 */
  startDate: Date;
  /** 结束时间 */
  endDate: Date;
  /** 取消时间（如果已取消） */
  cancelledAt?: Date;
  /** 取消原因 */
  cancelReason?: string;
  /** 是否自动续费 */
  autoRenew: boolean;
  /** 当前积分余额 */
  creditsBalance: number;
  /** 已使用积分 */
  creditsUsed: number;
  /** 积分重置时间 */
  creditsResetAt: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 支付状态
 */
export type PaymentStatus =
  | 'pending'     // 待支付
  | 'processing'  // 处理中
  | 'completed'   // 已完成
  | 'failed'      // 失败
  | 'refunded'    // 已退款
  | 'cancelled';  // 已取消

/**
 * 支付方式
 */
export type PaymentMethod = 'alipay' | 'wechat' | 'stripe' | 'other';

/**
 * 订阅支付记录
 */
export interface SubscriptionPayment {
  /** 支付记录ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 订阅记录ID */
  subscriptionId: string;
  /** 订阅计划类型 */
  planId: PlanType;
  /** 订单号 */
  orderNo: string;
  /** 第三方交易号 */
  transactionId?: string;
  /** 支付金额（分） */
  amount: number;
  /** 货币 */
  currency: string;
  /** 支付方式 */
  paymentMethod: PaymentMethod;
  /** 支付状态 */
  status: PaymentStatus;
  /** 支付时间 */
  paidAt?: Date;
  /** 退款金额（分） */
  refundAmount?: number;
  /** 退款时间 */
  refundedAt?: Date;
  /** 退款原因 */
  refundReason?: string;
  /** 支付备注 */
  note?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 订阅变更记录
 */
export interface SubscriptionChangeLog {
  /** 记录ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 订阅记录ID */
  subscriptionId: string;
  /** 变更类型 */
  changeType: 'upgrade' | 'downgrade' | 'renew' | 'cancel' | 'reactivate';
  /** 原计划 */
  fromPlan?: PlanType;
  /** 新计划 */
  toPlan?: PlanType;
  /** 变更原因 */
  reason?: string;
  /** 变更时间 */
  createdAt: Date;
}

/**
 * 获取计划价格的辅助函数
 */
export function getPlanPrice(planId: PlanType): number {
  return SUBSCRIPTION_PLANS[planId]?.price ?? 0;
}

/**
 * 获取计划显示名称的辅助函数
 */
export function getPlanDisplayName(planId: PlanType): string {
  return SUBSCRIPTION_PLANS[planId]?.displayName ?? '未知';
}

/**
 * 格式化价格为字符串
 */
export function formatPrice(price: number, currency: string = 'CNY'): string {
  const yuan = price / 100;
  return `¥${yuan.toFixed(2)}`;
}
