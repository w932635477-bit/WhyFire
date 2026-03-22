import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: '方言回响 - AI 方言说唱创作平台',
  description: '用 AI 克隆你的音色，在 8 种地道方言中重塑你的嘻哈灵魂。GPT-SoVITS 音色克隆，一键生成方言说唱。',
  keywords: ['AI音乐', '方言说唱', '音色克隆', 'GPT-SoVITS', '方言Rap', 'AI创作'],
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${poppins.variable} font-sans bg-dark-900 text-white min-h-screen antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
