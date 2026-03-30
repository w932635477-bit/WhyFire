import { NextRequest, NextResponse } from 'next/server'
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
      .from('users')
      .select('id, display_name, avatar_url, plan, phone, email, created_at')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ code: 404, message: '用户资料不存在' }, { status: 404 })
    }

    return NextResponse.json({ code: 0, data })
  } catch (error) {
    console.error('[Profile API] GET failed:', error)
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (body.display_name !== undefined) updates.display_name = body.display_name
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ code: 500, message: '更新失败' }, { status: 500 })
    }

    return NextResponse.json({ code: 0, data: { updated: true } })
  } catch (error) {
    console.error('[Profile API] PATCH failed:', error)
    return NextResponse.json({ code: 500, message: '服务器错误' }, { status: 500 })
  }
}
