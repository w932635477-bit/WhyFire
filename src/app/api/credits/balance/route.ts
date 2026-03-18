/**
 * Credits Balance API
 * 获取用户积分余额
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/credits/balance
 * 获取当前用户积分余额
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 获取用户积分
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Credits API] 获取积分失败:', error)
      return NextResponse.json(
        { error: '获取积分失败' },
        { status: 500 }
      )
    }

    // 如果用户没有积分记录，返回初始值
    if (!data) {
      return NextResponse.json({
        userId: user.id,
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // 类型断言
    const credits = data as {
      user_id: string
      balance: number
      total_purchased: number
      total_used: number
      created_at: string
      updated_at: string
    }

    return NextResponse.json({
      userId: credits.user_id,
      balance: credits.balance,
      totalPurchased: credits.total_purchased,
      totalUsed: credits.total_used,
      createdAt: credits.created_at,
      updatedAt: credits.updated_at,
    })
  } catch (error) {
    console.error('[Credits API] 错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
