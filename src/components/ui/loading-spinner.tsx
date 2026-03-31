'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-5 h-5 border-[1.5px]',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
}

/**
 * 全局统一加载旋转器
 * Apple HIG 风格: 白色半透明环，渐变色旋转
 */
export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full border-white/10 border-t-gradient-start animate-spin ${className}`}
      style={{
        borderImage: 'none',
        borderTopColor: 'rgb(139, 92, 246)',
      }}
    />
  )
}

/**
 * 全屏居中加载页面
 */
export function FullPageLoader({ text }: { text?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <LoadingSpinner size="lg" />
      {text && (
        <p className="mt-4 text-white/30 text-[13px] animate-pulse">{text}</p>
      )}
    </div>
  )
}

/**
 * 行内加载指示器 (按钮内等)
 */
export function InlineLoader({ className = '' }: { className?: string }) {
  return <LoadingSpinner size="sm" className={className} />
}
