import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyNotification, isConfigured } from '@/lib/payment/wechat-pay-client'

interface OrderRow {
  id: string
  status: string
  credits: number
  user_id: string
}

/**
 * WeChat Pay callback notification endpoint
 * Called by WeChat Pay server when payment succeeds
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // In development without WeChat Pay config, handle manual confirmation
    if (!isConfigured()) {
      console.log('[WechatNotify] WeChat Pay not configured, skipping verification')
      return new NextResponse(
        JSON.stringify({ code: 'SUCCESS', message: 'OK' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verify and decrypt notification
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    const result = await verifyNotification(headers, body)

    if (!result.verified || !result.data) {
      console.error('[WechatNotify] Verification failed')
      return new NextResponse(
        JSON.stringify({ code: 'FAIL', message: 'Verification failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { out_trade_no, trade_state } = result.data

    if (trade_state !== 'SUCCESS') {
      return new NextResponse(
        JSON.stringify({ code: 'SUCCESS', message: 'OK' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Update order status
    const supabase = await createClient()

    // Check if already processed (idempotency)
    const { data: order } = await supabase
      .from('payment_orders')
      .select('id, status, credits, user_id')
      .eq('id', out_trade_no)
      .single()

    const orderData = order as unknown as OrderRow | null

    if (!orderData) {
      console.error('[WechatNotify] Order not found:', out_trade_no)
      return new NextResponse(
        JSON.stringify({ code: 'FAIL', message: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (orderData.status === 'paid') {
      return new NextResponse(
        JSON.stringify({ code: 'SUCCESS', message: 'OK' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Update order to paid
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        wechat_order_id: result.data.transaction_id,
      } as never)
      .eq('id', out_trade_no)

    if (updateError) {
      console.error('[WechatNotify] Order update failed:', updateError)
      return new NextResponse(
        JSON.stringify({ code: 'FAIL', message: 'Update failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Add credits to user
    const { error: creditError } = await (supabase.rpc as any)('add_user_credits', {
      p_user_id: orderData.user_id,
      p_amount: orderData.credits,
      p_type: 'purchase',
      p_description: `购买积分包 ${orderData.credits} 积分`,
      p_order_id: out_trade_no,
      p_package_id: null,
    })

    if (creditError) {
      console.error('[WechatNotify] Credit add failed:', creditError)
      return new NextResponse(
        JSON.stringify({ code: 'FAIL', message: 'Credit add failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.log(`[WechatNotify] Order ${out_trade_no} paid, ${orderData.credits} credits added to user ${orderData.user_id}`)

    return new NextResponse(
      JSON.stringify({ code: 'SUCCESS', message: 'OK' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[WechatNotify] POST failed:', error)
    return new NextResponse(
      JSON.stringify({ code: 'FAIL', message: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
