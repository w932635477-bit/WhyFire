'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'

interface CreditData {
  balance: number
  totalPurchased: number
  totalUsed: number
}

export function useCredits() {
  const { user } = useAuthContext()
  const [credits, setCredits] = useState<CreditData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/user/credits')
      if (res.ok) {
        const data = await res.json()
        if (data.code === 0 && data.data) {
          setCredits({
            balance: data.data.balance,
            totalPurchased: data.data.total_purchased,
            totalUsed: data.data.total_used,
          })
        }
      }
    } catch {
      // Credits might not be set up yet
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  return { credits, loading, refetch: fetchCredits }
}
