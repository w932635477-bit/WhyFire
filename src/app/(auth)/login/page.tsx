'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { PhoneLoginForm } from '@/components/auth/phone-login-form'
import { WeChatLoginButton } from '@/components/auth/wechat-login-button'
import { Sparkles } from 'lucide-react'

type LoginTab = 'wechat' | 'email' | 'phone'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<LoginTab>('wechat')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white mx-auto mb-4 flex items-center justify-center shadow-lg" style={{ boxShadow: '3px 3px 0 rgba(139,92,246,0.8)' }}>
            <span className="text-black font-black text-2xl italic">W</span>
          </div>
          <h1 className="text-[28px] font-bold text-white mb-1 tracking-tight">方言回响</h1>
          <p className="text-white/40 text-[15px] flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI 方言翻唱创作平台
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-md mb-4 p-4 rounded-2xl bg-red-500/10 text-red-300 text-[13px] text-center">
            {error === 'auth_callback_failed' ? '登录失败，请重试' : '发生错误，请重试'}
          </div>
        )}

        {/* WeChat Login - Primary */}
        <div className="w-full max-w-md mb-6">
          <WeChatLoginButton className="w-full py-4 rounded-2xl bg-[#07C160] text-white text-[15px] font-bold shadow-[0_8px_32px_rgba(7,193,96,0.25)] hover:shadow-[0_12px_40px_rgba(7,193,96,0.35)] hover:bg-[#06AD56] active:scale-[0.98] transition-all" />
        </div>

        {/* Divider */}
        <div className="w-full max-w-md flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-white/20 text-[12px]">或使用其他方式</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Tab Selector */}
        <div className="w-full max-w-md mb-6">
          <div className="flex rounded-2xl bg-[#1C1C1E] p-1">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all ${
                activeTab === 'email'
                  ? 'bg-[#2C2C2E] text-white shadow-lg'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              邮箱登录
            </button>
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all ${
                activeTab === 'phone'
                  ? 'bg-[#2C2C2E] text-white shadow-lg'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              手机登录
            </button>
          </div>
        </div>

        {/* Login Forms */}
        <div className="w-full max-w-md">
          {activeTab === 'email' ? <LoginForm /> : <PhoneLoginForm />}
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center">
        <p className="text-[12px] text-white/25">
          继续即表示您同意我们的
          <a href="/sonic-gallery/terms" className="text-white/40 hover:text-white/60 transition-colors">服务条款</a>
          和
          <a href="/sonic-gallery/privacy" className="text-white/40 hover:text-white/60 transition-colors">隐私政策</a>
        </p>
      </div>
    </div>
  )
}
