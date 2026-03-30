import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isConfigured, createNativeOrder, createH5Order, createJsapiOrder } from '@/lib/payment/wechat-pay-client'

interface PackageRow {
  id: string
  name: string
  credits: number
  price: number
  original_price: number | null
  bonus: number
  popular: boolean
  description: string
}

interface UserRow {
  wechat_openid: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { package_id } = body

    if (!package_id) {
      return NextResponse.json({ code: 400, message: '缺少 package_id' }, { status: 400 })
    }

    // Fetch package
    const { data: pkg, error: pkgError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', package_id)
      .eq('active', true)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ code: 404, message: '套餐不存在' }, { status: 404 })
    }

    const pkgData = pkg as unknown as PackageRow

    // Create order row
    const orderId = crypto.randomUUID()
    const totalCredits = pkgData.credits + pkgData.bonus

    const { error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        id: orderId,
        user_id: user.id,
        package_id: pkgData.id,
        amount: pkgData.price,
        credits: totalCredits,
        status: 'pending',
      } as any)

    if (orderError) {
      console.error('[CreateOrder] Insert failed:', orderError)
      return NextResponse.json({ code: 500, message: '创建订单失败' }, { status: 500 })
    }

    // Check if WeChat Pay is configured
    if (!isConfigured()) {
      return NextResponse.json({
        code: 0,
        data: {
          order_id: orderId,
          amount: pkgData.price,
          credits: totalCredits,
          status: 'pending',
          mode: 'dev',
          message: '微信支付未配置，请手动确认订单',
        },
      })
    }

    // Detect payment type
    const userAgent = request.headers.get('user-agent') || ''
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    const isWeChatBrowser = /MicroMessenger/i.test(userAgent)
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent)

    const orderParams = {
      orderId,
      description: `${pkgData.name} - ${totalCredits} 积分`,
      amount: pkgData.price,
      userId: user.id,
    }

    let payResult: { prepay_id: string; code_url?: string; h5_url?: string } | null = null

    if (isWeChatBrowser) {
      const { data: profile } = await supabase
        .from('users')
        .select('wechat_openid')
        .eq('id', user.id)
        .single()

      const profileData = profile as unknown as UserRow | null
      if (profileData?.wechat_openid) {
        payResult = await createJsapiOrder(orderParams, profileData.wechat_openid)
      }
    } else if (isMobile) {
      payResult = await createH5Order(orderParams, userAgent, clientIp)
    } else {
      payResult = await createNativeOrder(orderParams)
    }

    return NextResponse.json({
      code: 0,
      data: {
        order_id: orderId,
        amount: pkgData.price,
        credits: totalCredits,
        status: 'pending',
        pay_params: payResult,
        pay_type: isWeChatBrowser ? 'jsapi' : isMobile ? 'h5' : 'native',
      },
    })
  } catch (error) {
    console.error('[CreateOrder] POST failed:', error)
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 })
  }
}
