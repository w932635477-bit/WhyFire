/**
 * Credit Service - Server-side credit operations via Supabase
 */

import { createClient } from '@/lib/supabase/server'

export interface CreditBalance {
  balance: number
  total_purchased: number
  total_used: number
}

export interface CreditTransaction {
  id: string
  type: 'purchase' | 'use' | 'refund' | 'bonus'
  amount: number
  balance: number
  description: string
  created_at: string
}

export async function getCredits(userId: string): Promise<CreditBalance | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance, total_purchased, total_used')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as CreditBalance
}

export async function deductCredits(userId: string, amount: number, description: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('deduct_user_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
  })

  if (error) {
    console.error('[CreditService] deduct failed:', error)
    return false
  }
  return data as boolean
}

export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'use' | 'refund' | 'bonus',
  description: string,
  orderId?: string,
  packageId?: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('add_user_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_order_id: orderId ?? null,
    p_package_id: packageId ?? null,
  })

  if (error) {
    console.error('[CreditService] add failed:', error)
    throw error
  }
}

export async function hasSufficientCredits(userId: string, amount: number): Promise<boolean> {
  const credits = await getCredits(userId)
  return credits ? credits.balance >= amount : false
}

export async function getTransactions(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ transactions: CreditTransaction[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const [transactionsRes, countRes] = await Promise.all([
    supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('credit_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  return {
    transactions: (transactionsRes.data as CreditTransaction[]) || [],
    total: countRes.count || 0,
  }
}
