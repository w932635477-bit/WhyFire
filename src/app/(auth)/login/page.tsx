import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-card px-4">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          WhyFire
        </h1>
      </div>

      {/* Login Form */}
      <LoginForm />

      {/* Footer */}
      <p className="mt-8 text-xs text-muted">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
