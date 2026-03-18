'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthReturn, AuthState } from '@/types/auth'

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
}

export function useAuth(): AuthReturn {
  const [state, setState] = useState<AuthState>(initialState)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: error ?? null,
      })
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error }))
        throw error
      }
    },
    [supabase.auth]
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error }))
        throw error
      }
    },
    [supabase.auth]
  )

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    const { error } = await supabase.auth.signOut()
    if (error) {
      setState((prev) => ({ ...prev, loading: false, error }))
      throw error
    }
  }, [supabase.auth])

  const resetPassword = useCallback(
    async (email: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error }))
        throw error
      }
    },
    [supabase.auth]
  )

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}
