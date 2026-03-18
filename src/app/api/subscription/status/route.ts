/**
 * Subscription Status API
 * 查询订阅状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/subscription/status
 * 获取当前用户订阅状态
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 获取用户活跃订阅
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .order('current_period_end', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Subscription Status] 查询失败:', error)
      return NextResponse.json(
        { error: '查询失败' },
        { status: 500 }
      )
    }

    // 如果没有订阅，返回免费版
    if (!data) {
      const { data: freePlanData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', 'free')
        .single()

      return NextResponse.json({
        hasSubscription: false,
        plan: freePlanData,
        status: 'free',
      })
    }

    // 类型断言
    const subscription = data as {
      id: string
      status: string
      current_period_start: string
      current_period_end: string
      cancel_at_period_end: boolean
      plan: unknown
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      plan: subscription.plan,
    })
  } catch (error) {
    console.error('[Subscription Status] 错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
