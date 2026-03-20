'use client'

import { useState } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { PhoneLoginForm } from '@/components/auth/phone-login-form'
import { Mail, Phone, Sparkles } from 'lucide-react'

type LoginTab = 'email' | 'phone'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<LoginTab>('email')

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
          <h1 className="text-4xl font-bold gradient-text mb-2">WhyFire</h1>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Rap 视频创作平台
          </p>
        </div>

        {/* Tab Selector */}
        <div className="w-full max-w-md mb-8">
          <div className="flex rounded-full bg-white/5 p-1">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              邮箱登录
            </button>
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                activeTab === 'phone'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
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
        <p className="text-xs text-gray-600">
          继续即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  )
}
