'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Step = 'phone' | 'otp'

export function PhoneLoginForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
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

  const validatePhoneNumber = (phone: string): boolean => {
    // Support international format: +[country code][number]
    // Examples: +8613800138000, +1234567890
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    const phoneRegex = /^\+?[1-9]\d{6,14}$/
    return phoneRegex.test(cleanPhone)
  }

  const formatPhoneNumber = (phone: string): string => {
    // Remove spaces, dashes, parentheses for storage/sending
    return phone.replace(/[\s\-\(\)]/g, '')
  }

  const handleSendOtp = useCallback(async () => {
    setError(null)

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number with country code (e.g., +86)')
      return
    }

    setSendingCode(true)
    try {
      const response = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formatPhoneNumber(phoneNumber)
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setStep('otp')
      setCountdown(60) // 60 second countdown

      // In development, log the code
      if (data.code) {
        console.log('Verification code:', data.code)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code')
    } finally {
      setSendingCode(false)
    }
  }, [phoneNumber])

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        phoneNumber: formatPhoneNumber(phoneNumber),
        code: otp
      })

      const response = await fetch(`/api/auth/sms?${params}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      // Success - redirect to /create
      router.push('/create')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
      setOtp('') // Clear OTP on error
    } finally {
      setLoading(false)
    }
  }, [phoneNumber, otp, router])

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
    setStep('phone')
    setOtp('')
    setError(null)
    setCountdown(0)
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {step === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Login with Phone</h1>
            <p className="text-muted text-sm">
              Enter your phone number with country code
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="+86 138 0013 8000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              icon={Phone}
              error={error || undefined}
              disabled={sendingCode}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendOtp()
                }
              }}
            />

            <Button
              onClick={handleSendOtp}
              loading={sendingCode}
              disabled={!phoneNumber || sendingCode}
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
              We sent a 6-digit code to <span className="font-medium text-foreground">{phoneNumber}</span>
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
                Change phone
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
