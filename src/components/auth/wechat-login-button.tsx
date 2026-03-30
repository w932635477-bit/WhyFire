'use client'

import { useState } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'

export function WeChatLoginButton({ className }: { className?: string }) {
  const { signInWithWeChat, loading } = useAuthContext()
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    try {
      await signInWithWeChat()
    } catch (err) {
      console.error('[WeChat Login] failed:', err)
      setPending(false)
    }
  }

  const busy = loading || pending

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`flex items-center justify-center gap-2 font-semibold transition-all active:scale-95 disabled:opacity-50 ${className || ''}`}
    >
      {busy ? (
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.127 6.127 0 0 1-.253-1.72c0-3.571 3.354-6.467 7.502-6.467.256 0 .507.018.76.035C16.626 4.502 12.988 2.188 8.691 2.188zm-2.87 4.401c-.63 0-1.14-.51-1.14-1.14s.51-1.14 1.14-1.14 1.14.51 1.14 1.14-.51 1.14-1.14 1.14zm5.576 0c-.63 0-1.14-.51-1.14-1.14s.51-1.14 1.14-1.14 1.14.51 1.14 1.14-.51 1.14-1.14 1.14zm4.244 3.26c-3.627 0-6.57 2.467-6.57 5.508 0 3.042 2.943 5.508 6.57 5.508a7.96 7.96 0 0 0 2.23-.32.672.672 0 0 1 .557.077l1.496.872a.262.262 0 0 0 .132.042c.129 0 .232-.107.232-.237 0-.058-.023-.115-.038-.17l-.306-1.166a.466.466 0 0 1 .168-.524C21.698 18.878 22.641 17.182 22.641 15.357c0-3.041-2.943-5.508-6.57-5.508h.15zm-2.73 3.367c-.496 0-.898-.402-.898-.898s.402-.898.898-.898.898.402.898.898-.402.898-.898.898zm5.313 0c-.496 0-.898-.402-.898-.898s.402-.898.898-.898.898.402.898.898-.402.898-.898.898z"/>
        </svg>
      )}
      {busy ? '正在跳转...' : '微信登录'}
    </button>
  )
}
