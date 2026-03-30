'use client'

import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
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
          <p className="text-white/40 text-[15px]">
            AI 方言翻唱创作平台
          </p>
        </div>

        {/* Email Login Form */}
        <LoginForm />
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
