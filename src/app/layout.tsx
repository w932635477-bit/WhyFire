import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WhyFire - AI Rap 视频一键生成',
  description: '输入信息，一键生成创意 Rap 短视频',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-dark-900 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
