/**
 * Subscription Callback API
 * 订阅支付回调
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUCCESS_RESPONSE = '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
const FAIL_RESPONSE = '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[ERROR]]></return_msg></xml>'

/**
 * POST /api/subscription/callback
 * 微信支付订阅回调
 */
export async function POST(request: NextRequest) {
  try {
    const xmlData = await request.text()

    console.log('[Subscription Callback] Received:', xmlData.substring(0, 500))

    // TODO: 验证微信支付签名
    // const wechatPay = getWechatPayClient()
    // if (!wechatPay.verifyCallback(xmlData)) {
    //   return new NextResponse(FAIL_RESPONSE, { status: 200, headers: { 'Content-Type': 'application/xml' } })
    // }

    // 解析回调数据（简化版，实际需要 XML 解析）
    // const data = wechatPay.parseCallbackData(xmlData)

    const supabase = await createClient()

    // 从回调中提取订阅 ID（模拟）
    const subscriptionIdMatch = xmlData.match(/<out_trade_no><!\[CDATA\[(.+?)\]\]><\/out_trade_no>/)
    const subscriptionId = subscriptionIdMatch ? subscriptionIdMatch[1] : null

    if (!subscriptionId) {
      console.error('[Subscription Callback] 缺少订阅ID')
      return new NextResponse(FAIL_RESPONSE, { status: 200, headers: { 'Content-Type': 'application/xml' } })
    }

    // 获取订阅信息
    const { data, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('id', subscriptionId)
      .single()

    if (subError || !data) {
      console.error('[Subscription Callback] 订阅不存在:', subscriptionId)
      return new NextResponse(SUCCESS_RESPONSE, { status: 200, headers: { 'Content-Type': 'application/xml' } })
    }

    // 类型断言
    const subscription = data as {
      id: string
      status: string
      user_id: string
      plan: { credits_per_month: number; name: string } | null
    }

    // 检查是否已激活
    if (subscription.status === 'active') {
      console.log('[Subscription Callback] 订阅已激活:', subscriptionId)
      return new NextResponse(SUCCESS_RESPONSE, { status: 200, headers: { 'Content-Type': 'application/xml' } })
    }

    // 激活订阅
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('user_subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('[Subscription Callback] 激活订阅失败:', updateError)
      return new NextResponse(FAIL_RESPONSE, { status: 200, headers: { 'Content-Type': 'application/xml' } })
    }

    // 更新支付状态
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('subscription_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId)

    // 添加积分
    const plan = subscription.plan as { credits_per_month: number; name: string } | null
    if (plan) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('add_user_credits', {
        p_user_id: subscription.user_id,
        p_amount: plan.credits_per_month,
        p_type: 'bonus',
        p_description: `订阅${plan.name}赠送积分`,
      })
    }

    console.log('[Subscription Callback] 订阅激活成功:', {
      subscriptionId,
      userId: subscription.user_id,
      credits: plan?.credits_per_month,
    })

    return new NextResponse(SUCCESS_RESPONSE, { status: 200, headers: { 'Content-Type': 'application/xml' } })
  } catch (error) {
    console.error('[Subscription Callback] 错误:', error)
    return new NextResponse(FAIL_RESPONSE, { status: 200, headers: { 'Content-Type': 'application/xml' } })
  }
}
