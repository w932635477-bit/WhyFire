/**
 * Payment Status API
 * 查询支付状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/payments/status
 * 查询订单支付状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: '缺少订单号' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 获取订单信息
    const { data, error } = await supabase
      .from('payment_orders')
      .select('id, status, amount, credits, paid_at')
      .eq('id', orderId)
      .single()

    if (error || !data) {
      console.error('[Payment Status] 订单不存在:', orderId)
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      )
    }

    // 类型断言
    const order = data as {
      id: string
      status: string
      amount: number
      credits: number
      paid_at: string | null
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      credits: order.credits,
      paidAt: order.paid_at,
    })
  } catch (error) {
    console.error('[Payment Status] 错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
