'use client'

import { useState, useEffect, useCallback } from 'react'

export interface UserEntitlements {
  planId: string
  planName: string
  maxResolution: string
  hasWatermark: boolean
  dialects: string[]
  priorityQueue: boolean
  isLoading: boolean
}

const DEFAULT_ENTITLEMENTS: UserEntitlements = {
  planId: 'free',
  planName: '免费版',
  maxResolution: '720p',
  hasWatermark: true,
  dialects: ['mandarin'],
  priorityQueue: false,
  isLoading: true,
}

/**
 * 获取用户权益的 Hook
 */
export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<UserEntitlements>(DEFAULT_ENTITLEMENTS)

  const fetchEntitlements = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        const plan = data.plan || { id: 'free', name: '免费版' }

        setEntitlements({
          planId: plan.id,
          planName: plan.name,
          maxResolution: plan.max_resolution || '720p',
          hasWatermark: plan.has_watermark ?? true,
          dialects: plan.dialects || ['mandarin'],
          priorityQueue: plan.priority_queue ?? false,
          isLoading: false,
        })
      } else {
        setEntitlements((prev) => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('[useEntitlements] 获取权益失败:', error)
      setEntitlements((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    fetchEntitlements()
  }, [fetchEntitlements])

  const canExport1080p = entitlements.maxResolution === '1080p'
  const canUseAllDialects = entitlements.dialects.length >= 4
  const canUseCantonese = entitlements.dialects.includes('cantonese')
  const canUseDongbei = entitlements.dialects.includes('dongbei')
  const canUseSichuan = entitlements.dialects.includes('sichuan')

  return {
    ...entitlements,
    canExport1080p,
    canUseAllDialects,
    canUseCantonese,
    canUseDongbei,
    canUseSichuan,
    refetch: fetchEntitlements,
  }
}
