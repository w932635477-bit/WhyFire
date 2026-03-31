import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ code: 500, message: '查询失败' }, { status: 500 })
    }

    return NextResponse.json({ code: 0, data })
  } catch (error) {
    console.error('[Packages API] GET failed:', error)
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 })
  }
}
