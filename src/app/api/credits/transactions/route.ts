/**
 * Credits Transactions API
 * 获取用户交易记录
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/credits/transactions
 * 获取当前用户交易记录
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // 获取交易记录
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Credits API] 获取交易记录失败:', error)
      return NextResponse.json(
        { error: '获取交易记录失败' },
        { status: 500 }
      )
    }

    // 类型定义
    type TransactionRow = {
      id: string
      user_id: string
      type: string
      amount: number
      balance: number
      package_id: string | null
      order_id: string | null
      description: string
      created_at: string
    }

    // 转换字段名
    const transactions = ((data || []) as TransactionRow[]).map((tx) => ({
      id: tx.id,
      userId: tx.user_id,
      type: tx.type,
      amount: tx.amount,
      balance: tx.balance,
      packageId: tx.package_id,
      orderId: tx.order_id,
      description: tx.description,
      createdAt: tx.created_at,
    }))

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('[Credits API] 错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
