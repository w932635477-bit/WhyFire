'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProfileForm, ProfileFormData } from '@/components/profile/profile-form'
import { useAuthContext } from '@/components/providers/auth-provider'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  nickname: string
  bio: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthContext()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile data
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error
      }

      setProfile(data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile(user.id)
    } else if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, fetchProfile, router])

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`)
    }

    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)

    return data.publicUrl
  }

  // Handle form submission
  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    let avatarUrl = profile?.avatar_url

    // Upload new avatar if provided
    if (data.avatar) {
      avatarUrl = await uploadAvatar(user.id, data.avatar)
    }

    // Upsert profile data
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        nickname: data.nickname,
        bio: data.bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    )

    if (error) {
      throw new Error(`Failed to save profile: ${error.message}`)
    }

    // Update local state
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            nickname: data.nickname,
            bio: data.bio,
            avatar_url: avatarUrl ?? null,
          }
        : null
    )
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading profile...</p>
        </motion.div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-card transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <div className="w-full max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold gradient-text mb-2">
                Your Profile
              </h2>
              <p className="text-muted">
                Customize your profile to let others know more about you
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 shadow-soft">
              <ProfileForm
                initialData={
                  profile
                    ? {
                        nickname: profile.nickname || '',
                        bio: profile.bio || '',
                        avatarUrl: profile.avatar_url || undefined,
                      }
                    : undefined
                }
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
