'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Step = 'email' | 'otp'

/** 错误信息友好化（纯函数，无闭包依赖） */
function getErrorMessage(err: unknown, context: 'email' | 'otp' = 'email'): string {
  const msg = err instanceof Error
    ? err.message.toLowerCase()
    : (typeof err === 'object' && err !== null && 'message' in err)
      ? String((err as { message: unknown }).message).toLowerCase()
      : ''

  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many')) {
    return '请求过于频繁，请稍后再试'
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return '网络连接失败，请检查网络后重试'
  }
  if (context === 'otp') {
    if (msg.includes('invalid') || msg.includes('expired') || msg.includes('otp')) {
      return '验证码错误或已过期，请重新获取'
    }
    return '验证失败，请重试'
  }
  if (msg.includes('invalid') || msg.includes('not found')) {
    return '邮箱格式不正确'
  }
  return msg || '操作失败，请重试'
}

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
  // 用 ref 追踪最新值，避免闭包过期
  const otpRef = useRef(otp)
  const emailRef = useRef(email)
  const loadingRef = useRef(loading)

  // 同步 ref
  otpRef.current = otp
  emailRef.current = email
  loadingRef.current = loading

  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [step])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleVerifyOtp = useCallback(async (code?: string) => {
    const currentOtp = code ?? otpRef.current
    if (currentOtp.length !== 6) return
    if (loadingRef.current) return // 防止重复提交

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailRef.current,
        token: currentOtp,
        type: 'email',
      })

      if (error) throw error

      router.push('/sonic-gallery')
    } catch (err) {
      setError(getErrorMessage(err, 'otp'))
      setOtp('')
    } finally {
      setLoading(false)
    }
  }, [router, supabase.auth])

  const handleSendOtp = useCallback(async () => {
    setError(null)

    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      })

      if (error) throw error

      setStep('otp')
      setOtp('') // 清空旧验证码
      setCountdown(60)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [email, supabase.auth])

  // Auto-submit when OTP reaches 6 digits
  useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleVerifyOtp(otp)
    }
  }, [otp, loading, handleVerifyOtp])

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    if (error) setError(null) // 输入时清除错误
  }

  const handleResend = () => {
    if (countdown === 0 && !loading) {
      setOtp('')  // 清空旧验证码
      setError(null)
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
            <h1 className="text-2xl font-bold text-white">登录方言回响</h1>
            <p className="text-white/40 text-sm">
              输入邮箱，我们将发送 6 位验证码
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                {Mail && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <Mail className="h-4 w-4" />
                  </div>
                )}
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendOtp()
                  }}
                  className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors disabled:opacity-50"
                />
              </div>
              {error && (
                <p className="text-xs text-red-400 px-1">{error}</p>
              )}
            </div>

            <button
              onClick={handleSendOtp}
              disabled={!email || loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white font-semibold text-[15px] shadow-[0_8px_32px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_40px_rgba(139,92,246,0.4)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '发送验证码'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-white">输入验证码</h1>
            <p className="text-white/40 text-sm">
              请在邮件中找到 6 位数字验证码
            </p>
            <p className="text-white font-medium text-sm">{email}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                value={otp}
                onChange={handleOtpChange}
                disabled={loading}
                placeholder="000000"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center text-2xl tracking-[1em] text-white placeholder:tracking-normal placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors disabled:opacity-50"
              />
              {error && (
                <p className="text-center text-xs text-red-400">{error}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={handleBack}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                更换邮箱
              </button>
              <span className="text-white/10">|</span>
              <button
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="text-white/40 hover:text-white/70 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                验证中...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
