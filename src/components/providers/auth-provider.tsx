'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  plan: 'free' | 'lite' | 'pro'
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, display_name, avatar_url, plan')
        .eq('id', userId)
        .single()
      if (data) {
        setProfile(data as unknown as UserProfile)
      }
    } catch {
      setProfile(null)
    }
  }, [supabase])

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchProfile])

  const signInWithEmail = async (email: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLoading(false)
      throw error
    }
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    signInWithEmail,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
