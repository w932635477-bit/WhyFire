'use client'

import { StepIndicator } from '@/components/create/step-indicator'

export default function CreateLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2">
              <div className="text-2xl">🔥</div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                WhyFire
              </span>
            </a>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <span className="hidden sm:block text-sm text-muted-foreground">
              AI Rap 视频创作
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (confirm('确定要退出创作吗？当前进度将会丢失。')) {
                  window.location.href = '/'
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              退出创作
            </button>
          </div>
        </div>
      </header>

      {/* 步骤指示器 */}
      <div className="border-b bg-background/50">
        <StepIndicator />
      </div>

      {/* 主要内容区域 */}
      <main className="container py-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* 底部信息 */}
      <footer className="border-t py-6 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 WhyFire. 让每个人都能创作自己的 Rap 视频</p>
        </div>
      </footer>
    </div>
  )
}
