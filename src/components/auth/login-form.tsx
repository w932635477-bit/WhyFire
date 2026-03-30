'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Step = 'email' | 'otp'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const otpInputRef = useRef<HTMLInputElement>(null)

  // Focus OTP input when step changes to OTP
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [step])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Auto-submit when OTP is complete (6 digits)
  useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleVerifyOtp()
    }
  }, [otp])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendOtp = useCallback(async () => {
    setError(null)

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setStep('otp')
      setCountdown(60) // 60 second countdown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }, [email, supabase.auth])

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (error) throw error

      // Redirect to /create on success
      router.push('/sonic-gallery')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
      setOtp('') // Clear OTP on error
    } finally {
      setLoading(false)
    }
  }, [email, otp, router, supabase.auth])

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
  }

  const handleResend = () => {
    if (countdown === 0) {
      handleSendOtp()
    }
  }

  const handleBack = () => {
    setStep('email')
    setOtp('')
    setError(null)
    setCountdown(0)
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {step === 'email' ? (
        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Login to WhyFire</h1>
            <p className="text-muted text-sm">
              Enter your email to receive a verification code
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              error={error || undefined}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendOtp()
                }
              }}
            />

            <Button
              onClick={handleSendOtp}
              loading={loading}
              disabled={!email || loading}
              className="w-full"
              size="lg"
            >
              Send Verification Code
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Enter Verification Code</h1>
            <p className="text-muted text-sm">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={loading}
                  placeholder="000000"
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-center text-2xl tracking-[1em] text-foreground transition-colors placeholder:tracking-normal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              {error && (
                <p className="text-center text-xs text-error">{error}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={handleBack}
                className="text-muted hover:text-foreground transition-colors"
              >
                Change email
              </button>
              <span className="text-border">|</span>
              <button
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="text-muted hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </div>

            {loading && (
              <p className="text-center text-xs text-muted">Verifying...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
