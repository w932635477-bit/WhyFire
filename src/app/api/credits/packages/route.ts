/**
 * Credits Packages API
 * 获取积分包列表
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 模拟数据（开发环境使用）
const MOCK_PACKAGES = [
  {
    id: 'pkg-basic',
    name: '基础包',
    credits: 100,
    price: 990,
    original_price: null,
    bonus: 0,
    popular: false,
    description: '适合轻度使用者',
    sort_order: 1,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pkg-value',
    name: '超值包',
    credits: 500,
    price: 3990,
    original_price: 4990,
    bonus: 50,
    popular: true,
    description: '最受欢迎，性价比之选',
    sort_order: 2,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pkg-pro',
    name: '专业包',
    credits: 1000,
    price: 6990,
    original_price: 9900,
    bonus: 150,
    popular: false,
    description: '适合专业创作者',
    sort_order: 3,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pkg-enterprise',
    name: '企业包',
    credits: 5000,
    price: 29990,
    original_price: 49500,
    bonus: 1000,
    popular: false,
    description: '团队协作首选',
    sort_order: 4,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * GET /api/credits/packages
 * 获取所有启用的积分包
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[Credits API] 获取积分包失败:', error)
      // 返回模拟数据
      return NextResponse.json({ packages: MOCK_PACKAGES })
    }

    // 类型转换
    const packages = (data || []) as typeof MOCK_PACKAGES

    return NextResponse.json({ packages: packages.length > 0 ? packages : MOCK_PACKAGES })
  } catch (error) {
    console.error('[Credits API] 错误:', error)
    // 返回模拟数据
    return NextResponse.json({ packages: MOCK_PACKAGES })
  }
}
