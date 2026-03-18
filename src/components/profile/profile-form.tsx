'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Camera, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface ProfileFormData {
  nickname: string
  bio: string
  avatar?: File
}

interface ProfileFormProps {
  initialData?: {
    nickname: string
    bio: string
    avatarUrl?: string
  }
  onSubmit: (data: ProfileFormData) => Promise<void>
}

export function ProfileForm({ initialData, onSubmit }: ProfileFormProps) {
  const [nickname, setNickname] = useState(initialData?.nickname || '')
  const [bio, setBio] = useState(initialData?.bio || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData?.avatarUrl || null
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ nickname?: string; bio?: string; avatar?: string }>({})
  const [success, setSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateNickname = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Nickname is required'
    }
    if (value.length < 2) {
      return 'Nickname must be at least 2 characters'
    }
    if (value.length > 20) {
      return 'Nickname must be less than 20 characters'
    }
    return undefined
  }

  const validateBio = (value: string): string | undefined => {
    if (value.length > 200) {
      return 'Bio must be less than 200 characters'
    }
    return undefined
  }

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNickname(value)
    const error = validateNickname(value)
    setErrors((prev) => ({ ...prev, nickname: error }))
  }

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setBio(value)
    const error = validateBio(value)
    setErrors((prev) => ({ ...prev, bio: error }))
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, avatar: 'Only JPG and PNG files are allowed' }))
      return
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, avatar: 'File size must be less than 2MB' }))
      return
    }

    // Clear avatar error
    setErrors((prev) => ({ ...prev, avatar: undefined }))

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setAvatarFile(file)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const nicknameError = validateNickname(nickname)
    const bioError = validateBio(bio)

    if (nicknameError || bioError) {
      setErrors({ nickname: nicknameError, bio: bioError })
      return
    }

    setLoading(true)
    setSuccess(false)

    try {
      await onSubmit({
        nickname,
        bio,
        avatar: avatarFile || undefined,
      })
      setSuccess(true)
      // Clear avatar file after successful submit
      setAvatarFile(null)
    } catch (error) {
      console.error('Failed to save profile:', error)
      setErrors({
        nickname: error instanceof Error ? error.message : 'Failed to save profile',
      })
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Avatar Upload */}
      <motion.div variants={itemVariants} className="flex flex-col items-center space-y-4">
        <motion.button
          type="button"
          onClick={handleAvatarClick}
          className="group relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className={cn(
              'h-32 w-32 rounded-full overflow-hidden border-2 border-border',
              'bg-card flex items-center justify-center',
              'transition-all duration-200',
              'group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20'
            )}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-muted" />
            )}
          </div>
          <div
            className={cn(
              'absolute inset-0 rounded-full flex items-center justify-center',
              'bg-black/50 opacity-0 group-hover:opacity-100',
              'transition-opacity duration-200'
            )}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleAvatarChange}
          className="hidden"
          aria-label="Upload avatar"
        />

        <p className="text-sm text-muted">
          Click to upload avatar (JPG/PNG, max 2MB)
        </p>

        {errors.avatar && (
          <p className="text-xs text-error">{errors.avatar}</p>
        )}
      </motion.div>

      {/* Nickname Field */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label htmlFor="nickname" className="block text-sm font-medium text-foreground">
          Nickname <span className="text-error">*</span>
        </label>
        <Input
          id="nickname"
          type="text"
          placeholder="Enter your nickname"
          value={nickname}
          onChange={handleNicknameChange}
          error={errors.nickname}
          disabled={loading}
          maxLength={20}
          icon={User}
        />
        <p className="text-xs text-muted">
          {nickname.length}/20 characters
        </p>
      </motion.div>

      {/* Bio Field */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium text-foreground">
          Bio
        </label>
        <div className="relative">
          <textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={handleBioChange}
            disabled={loading}
            maxLength={200}
            rows={4}
            className={cn(
              'flex w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground',
              'transition-colors placeholder:text-muted',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'resize-none',
              errors.bio ? 'border-error focus:ring-error' : 'border-border'
            )}
          />
        </div>
        {errors.bio && (
          <p className="text-xs text-error">{errors.bio}</p>
        )}
        <p className="text-xs text-muted">
          {bio.length}/200 characters
        </p>
      </motion.div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-success/10 border border-success/20 p-4 text-center"
        >
          <p className="text-sm text-success font-medium">
            Profile saved successfully!
          </p>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </motion.div>

      {/* Error Message */}
      {errors.nickname && !errors.nickname.includes('Nickname') && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-error"
        >
          {errors.nickname}
        </motion.p>
      )}
    </motion.form>
  )
}
