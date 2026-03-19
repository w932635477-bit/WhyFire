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
  title: 'WhyFire - AI Rap 视频一键生成',
  description: '输入信息，一键生成创意 Rap 短视频。电商推广、搞笑洗脑、IP混剪、日常Vlog，四种场景任你选。',
  keywords: ['AI视频生成', 'Rap视频', '短视频创作', '电商推广', 'AI写词', 'AI配乐'],
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
