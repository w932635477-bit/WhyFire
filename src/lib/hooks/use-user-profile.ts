'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'

interface UserProfile {
  displayName: string | null
  avatarUrl: string | null
  plan: 'free' | 'lite' | 'pro'
  phone: string | null
  email: string | null
}

export function useUserProfile() {
  const { user, profile: authProfile } = useAuthContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    // Use cached profile from auth provider if available
    if (authProfile) {
      setProfile({
        displayName: authProfile.display_name,
        avatarUrl: authProfile.avatar_url,
        plan: authProfile.plan,
        phone: null,
        email: null,
      })
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        if (data.code === 0 && data.data) {
          setProfile(data.data)
        }
      }
    } catch {
      // Profile might not exist yet
    } finally {
      setLoading(false)
    }
  }, [user, authProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>) => {
    if (!user) return

    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.code === 0) {
        setProfile((prev) => prev ? { ...prev, ...updates } : null)
      }
    }
  }, [user])

  return { profile, loading, updateProfile, refetch: fetchProfile }
}
