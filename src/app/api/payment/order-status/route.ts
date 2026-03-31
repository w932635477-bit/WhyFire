import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')

    if (!orderId) {
      return NextResponse.json({ code: 400, message: '缺少 order_id' }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('payment_orders')
      .select('id, status, amount, credits, created_at, paid_at')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ code: 404, message: '订单不存在' }, { status: 404 })
    }

    return NextResponse.json({ code: 0, data: order })
  } catch (error) {
    console.error('[OrderStatus API] GET failed:', error)
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 })
  }
}
