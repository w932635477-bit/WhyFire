/**
 * Payment Callback API Route
 * 微信支付回调 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWechatPayClient } from '@/lib/wechat-pay/client'
import { createClient } from '@/lib/supabase/server'

/**
 * Success response XML
 */
const SUCCESS_RESPONSE = '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'

/**
 * Fail response XML
 */
const FAIL_RESPONSE = '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[ERROR]]></return_msg></xml>'

/**
 * POST /api/payments/callback
 * WeChat Pay callback handler
 */
export async function POST(request: NextRequest) {
  try {
    const xmlData = await request.text()

    // Log callback for debugging (remove in production)
    console.log('[WeChat Pay Callback] Received:', xmlData.substring(0, 500))

    const wechatPay = getWechatPayClient()

    // Verify signature
    if (!wechatPay.verifyCallback(xmlData)) {
      console.error('[WeChat Pay Callback] Signature verification failed')
      return new NextResponse(FAIL_RESPONSE, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    // Parse callback data
    const data = wechatPay.parseCallbackData(xmlData)

    // Check payment result
    if (data.returnCode !== 'SUCCESS' || data.resultCode !== 'SUCCESS') {
      console.error('[WeChat Pay Callback] Payment failed:', data)
      return new NextResponse(FAIL_RESPONSE, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    const supabase = await createClient()

    // Get order by merchant order number
    const { data: existingOrder, error: queryError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', data.outTradeNo)
      .single()

    if (queryError || !existingOrder) {
      console.error('[WeChat Pay Callback] Order not found:', data.outTradeNo)
      // Still return SUCCESS to avoid repeated callbacks
      return new NextResponse(SUCCESS_RESPONSE, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    const order = existingOrder as {
      status: string
      amount: number
      user_id: string
      credits: number
    }

    // Check if already paid (idempotency)
    if (order.status === 'paid') {
      console.log('[WeChat Pay Callback] Order already paid:', data.outTradeNo)
      return new NextResponse(SUCCESS_RESPONSE, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    // Verify amount matches
    if (order.amount !== data.totalFee) {
      console.error('[WeChat Pay Callback] Amount mismatch:', {
        expected: order.amount,
        received: data.totalFee,
      })
      return new NextResponse(FAIL_RESPONSE, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    // Update order status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        wechat_order_id: data.transactionId,
      })
      .eq('id', data.outTradeNo)
      .eq('status', 'pending')

    if (updateError) {
      console.error('[WeChat Pay Callback] Failed to update order:', updateError)
      return new NextResponse(FAIL_RESPONSE, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    // Add credits to user account using RPC function
    const { error: creditError } = await (supabase as any).rpc('add_user_credits', {
      p_user_id: order.user_id,
      p_amount: order.credits,
      p_type: 'purchase',
      p_description: `购买${order.credits}积分`,
      p_order_id: data.outTradeNo,
    })

    if (creditError) {
      console.error('[WeChat Pay Callback] Failed to add credits:', creditError)
      // Note: Order is already marked as paid, manual intervention may be needed
      // In production, you might want to implement a reconciliation process
    }

    console.log('[WeChat Pay Callback] Payment processed successfully:', {
      orderId: data.outTradeNo,
      transactionId: data.transactionId,
      userId: order.user_id,
      credits: order.credits,
    })

    return new NextResponse(SUCCESS_RESPONSE, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  } catch (error) {
    console.error('[WeChat Pay Callback] Error:', error)
    return new NextResponse(FAIL_RESPONSE, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  }
}

/**
 * GET /api/payments/callback
 * Health check endpoint
 */
export async function GET() {
  return new NextResponse(
    '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>',
    {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    }
  )
}
