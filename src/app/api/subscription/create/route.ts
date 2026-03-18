/**
 * Subscription Create API
 * 创建订阅
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  credits_per_month: number
}

/**
 * POST /api/subscription/create
 * 创建订阅订单
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId } = body

    if (!planId || planId === 'free') {
      return NextResponse.json(
        { error: '请选择付费计划' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 检查是否已有活跃订阅
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { error: '您已有活跃订阅，请先取消当前订阅' },
        { status: 400 }
      )
    }

    // 获取计划信息
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: '计划不存在' },
        { status: 404 }
      )
    }

    const planData = plan as SubscriptionPlan

    // 生成订阅 ID
    const subscriptionId = crypto.randomUUID()

    // 创建订阅记录
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: createError } = await (supabase as any)
      .from('user_subscriptions')
      .insert({
        id: subscriptionId,
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

    if (createError) {
      console.error('[Subscription] 创建订阅失败:', createError)
      return NextResponse.json(
        { error: '创建订阅失败' },
        { status: 500 }
      )
    }

    // 创建支付记录
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: paymentError } = await (supabase as any)
      .from('subscription_payments')
      .insert({
        subscription_id: subscriptionId,
        user_id: user.id,
        amount: planData.price,
        status: 'pending',
      })

    if (paymentError) {
      console.error('[Subscription] 创建支付记录失败:', paymentError)
    }

    // TODO: 调用微信支付订阅 API
    // 目前返回模拟数据
    return NextResponse.json({
      subscriptionId,
      planId,
      planName: planData.name,
      amount: planData.price,
      credits: planData.credits_per_month,
      // 实际应该返回微信支付二维码 URL
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whyfire_subscribe_${subscriptionId}`,
    })
  } catch (error) {
    console.error('[Subscription] 错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
