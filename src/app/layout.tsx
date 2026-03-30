import type { Metadata } from 'next'
import { Poppins, Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'

// 初始化 global-agent，使所有 HTTP 请求自动使用环境变量中的代理配置
if (process.env.NODE_ENV !== 'test') {
  try {
    require('global-agent').bootstrap()
  } catch (error) {
    console.warn('Failed to initialize global-agent:', error)
  }
}

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: true,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: '方言回响 - AI 方言说唱创作平台',
  description: '用 AI 克隆你的音色，在 8 种地道方言中重塑你的嘻哈灵魂。Seed-VC 零样本声音克隆，一键生成方言说唱。',
  keywords: ['AI音乐', '方言说唱', '音色克隆', 'Seed-VC', '方言Rap', 'AI创作'],
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
    <html lang="zh-CN" className={`${poppins.variable} ${inter.variable} ${spaceGrotesk.variable}`} data-scroll-behavior="smooth">
      <head>
        {/* Material Symbols Outlined - 本地字体，不依赖外部 CDN */}
        <link
          rel="preload"
          href="/fonts/material-symbols-outlined.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'Material Symbols Outlined';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: url('/fonts/material-symbols-outlined.woff2') format('woff2');
              }
              .material-symbols-outlined {
                font-family: 'Material Symbols Outlined';
                font-weight: normal;
                font-style: normal;
                font-size: 24px;
                line-height: 1;
                letter-spacing: normal;
                text-transform: none;
                display: inline-block;
                white-space: nowrap;
                word-wrap: normal;
                direction: ltr;
                -webkit-font-smoothing: antialiased;
              }
            `,
          }}
        />
      </head>
      <body className="font-sans bg-dark-900 text-white min-h-screen antialiased pb-8">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
