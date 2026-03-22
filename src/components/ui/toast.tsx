'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Toast 类型
type ToastType = 'success' | 'error' | 'warning' | 'info'

// Toast 配置
interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// Context 类型
interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

// 创建 Context
const ToastContext = createContext<ToastContextType | null>(null)

// Provider 组件
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    }

    setToasts(prev => [...prev, newToast])

    // 自动关闭
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, newToast.duration)
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }, [showToast])

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message })
  }, [showToast])

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message })
  }, [showToast])

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  )
}

// Hook
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast 容器
function ToastContainer({ toasts, dismissToast }: { toasts: Toast[]; dismissToast: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  )
}

// 单个 Toast 组件
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const iconMap: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }

  const colorMap: Record<ToastType, string> = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    error: 'text-red-400 bg-red-500/10 border-red-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm animate-slide-up ${colorMap[toast.type]}`}
      role="alert"
    >
      <span className="material-symbols-outlined text-lg flex-shrink-0">
        {iconMap[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-white/60 mt-0.5 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-white/40 hover:text-white/60 transition-colors flex-shrink-0"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  )
}
