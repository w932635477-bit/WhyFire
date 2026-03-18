'use client'

import { useState } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { PhoneLoginForm } from '@/components/auth/phone-login-form'
import { Mail, Phone } from 'lucide-react'

type LoginTab = 'email' | 'phone'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<LoginTab>('email')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-card px-4">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          WhyFire
        </h1>
      </div>

      {/* Tab Selector */}
      <div className="w-full max-w-md mb-6">
        <div className="flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'email'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-accent'
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
          <button
            onClick={() => setActiveTab('phone')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'phone'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-accent'
            }`}
          >
            <Phone className="h-4 w-4" />
            Phone
          </button>
        </div>
      </div>

      {/* Login Forms */}
      {activeTab === 'email' ? <LoginForm /> : <PhoneLoginForm />}

      {/* Footer */}
      <p className="mt-8 text-xs text-muted">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
