import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, total_purchased, total_used')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // Credits row might not exist yet
      return NextResponse.json({
        code: 0,
        data: { balance: 0, total_purchased: 0, total_used: 0 },
      })
    }

    return NextResponse.json({ code: 0, data })
  } catch (error) {
    console.error('[Credits API] GET failed:', error)
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 })
  }
}
