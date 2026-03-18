/**
 * 用户权益管理
 * User Entitlements Management
 */

import type { SubscriptionPlan, SubscriptionBenefit, PlanType } from '@/types/subscription'

/**
 * 计划对应的权益配置
 */
export const PLAN_ENTITLEMENTS: Record<PlanType, SubscriptionBenefit> = {
  free: {
    credits: 2,
    creditsResetPeriod: 'daily',
    scenesAccess: 'basic',
    hasWatermark: true,
    videoResolution: '720p',
    dialectSupport: 'none',
    priorityQueue: false,
    features: ['每日 2 积分', '基础场景', '720p 视频分辨率', '视频带水印'],
  },
  lite: {
    credits: 60,
    creditsResetPeriod: 'monthly',
    scenesAccess: 'all',
    hasWatermark: false,
    videoResolution: '1080p',
    dialectSupport: 'limited',
    priorityQueue: false,
    features: ['每月 60 积分', '全部场景', '1080p 视频分辨率', '无水印', '2种方言支持'],
  },
  pro: {
    credits: 200,
    creditsResetPeriod: 'monthly',
    scenesAccess: 'all',
    hasWatermark: false,
    videoResolution: '1080p',
    dialectSupport: 'all',
    priorityQueue: true,
    features: ['每月 200 积分', '全部场景', '1080p 视频分辨率', '无水印', '全部方言支持', '优先生成队列'],
  },
}

/**
 * 检查用户是否有特定权益
 */
export function checkEntitlement(
  planId: PlanType,
  entitlement: '1080p' | 'noWatermark' | 'allDialects' | 'priorityQueue'
): boolean {
  const benefits = PLAN_ENTITLEMENTS[planId]
  if (!benefits) return false

  switch (entitlement) {
    case '1080p':
      return benefits.videoResolution === '1080p'
    case 'noWatermark':
      return !benefits.hasWatermark
    case 'allDialects':
      return benefits.dialectSupport === 'all'
    case 'priorityQueue':
      return benefits.priorityQueue
    default:
      return false
  }
}

/**
 * 获取用户可用的分辨率选项
 */
export function getAvailableResolutions(planId: PlanType): Array<{ value: string; label: string; available: boolean }> {
  const supports1080p = checkEntitlement(planId, '1080p')

  return [
    { value: '720p', label: '720p', available: true },
    { value: '1080p', label: '1080p (需要订阅)', available: supports1080p },
  ]
}

/**
 * 获取用户可用的方言列表
 */
export function getAvailableDialects(planId: PlanType): Array<{ value: string; label: string; available: boolean }> {
  const benefits = PLAN_ENTITLEMENTS[planId]
  if (!benefits) return [{ value: 'mandarin', label: '普通话', available: true }]

  const allDialects = [
    { value: 'mandarin', label: '普通话' },
    { value: 'cantonese', label: '粤语' },
    { value: 'dongbei', label: '东北话' },
    { value: 'sichuan', label: '四川话' },
  ]

  const availableDialects = benefits.dialectSupport
  const limitedDialects = ['mandarin', 'cantonese']

  return allDialects.map((dialect) => ({
    ...dialect,
    available: availableDialects === 'all' || limitedDialects.includes(dialect.value),
  }))
}

/**
 * 检查视频导出是否需要添加水印
 */
export function shouldAddWatermark(planId: PlanType): boolean {
  const benefits = PLAN_ENTITLEMENTS[planId]
  return benefits?.hasWatermark ?? true
}

/**
 * 获取用户每日/每月免费积分
 */
export function getFreeCredits(planId: PlanType): number {
  const benefits = PLAN_ENTITLEMENTS[planId]
  return benefits?.credits ?? 0
}
