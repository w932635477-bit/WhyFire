/**
 * Create Payment API Route
 * 创建支付订单 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWechatPayClient } from '@/lib/wechat-pay/client'
import { createClient } from '@/lib/supabase/server'
import type { CreatePaymentResponse } from '@/lib/wechat-pay/types'

// Inline types for credit package and payment order
interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  bonus: number
  active: boolean
}

interface PaymentOrderInsert {
  id: string
  user_id: string
  package_id: string
  amount: number
  credits: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  expired_at: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get credit package info
    const { data, error: pkgError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('active', true)
      .single()

    const pkg = data as CreditPackage | null

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: 'Package not found or inactive' },
        { status: 404 }
      )
    }

    // Generate unique order ID
    const orderId = `ORD${Date.now()}${crypto.getRandomValues(new Uint32Array(1))[0].toString(16).slice(0, 8)}`

    // Set expiration time (30 minutes from now)
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // Create payment order in database
    const orderData: PaymentOrderInsert = {
      id: orderId,
      user_id: user.id,
      package_id: packageId,
      amount: pkg.price,
      credits: pkg.credits + (pkg.bonus || 0),
      status: 'pending',
      expired_at: expiredAt,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: orderError } = await (supabase as any)
      .from('payment_orders')
      .insert(orderData)

    if (orderError) {
      console.error('Failed to create order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1'

    // Call WeChat Pay API
    const wechatPay = getWechatPayClient()
    const result = await wechatPay.createNativeOrder({
      outTradeNo: orderId,
      body: `WhyFire积分-${pkg.name}`,
      totalFee: pkg.price,
      spbillCreateIp: clientIp,
    })

    // Check if WeChat Pay call was successful
    if (result.returnCode !== 'SUCCESS' || result.resultCode !== 'SUCCESS') {
      console.error('WeChat Pay error:', result)

      // Update order status to failed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('payment_orders')
        .update({ status: 'failed' })
        .eq('id', orderId)

      return NextResponse.json(
        {
          error: result.errCodeDes || 'Failed to create payment',
          errCode: result.errCode,
        },
        { status: 400 }
      )
    }

    // Update order with WeChat Pay info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('payment_orders')
      .update({
        wechat_prepay_id: result.prepayId,
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order:', updateError)
    }

    // Return payment response
    const response: CreatePaymentResponse = {
      orderId,
      codeUrl: result.codeUrl || '',
      amount: pkg.price,
      credits: pkg.credits + (pkg.bonus || 0),
      expiredAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payments/create
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Payment creation API is ready',
  })
}
