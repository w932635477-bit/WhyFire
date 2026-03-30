'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TopNavBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  // 首页使用不同的导航样式
  const isHomePage = pathname === '/sonic-gallery'

  if (isHomePage) {
    // 首页导航：Logo + 导航链接 + CTA
    return (
      <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/sonic-gallery" className="group flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
              style={{ boxShadow: '2px 2px 0 rgba(139,92,246,0.8)' }}
            >
              <span className="text-black font-black text-lg italic">W</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-base block tracking-tight" style={{ textShadow: '1px 1px 0 rgba(139,92,246,0.6)' }}>
                方言回响
              </span>
              <span className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-medium">WhyFire</span>
            </div>
          </Link>

          {/* Right Section: Search + Nav + Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar - Compact */}
            <div className="hidden md:flex items-center bg-white/[0.04] px-3 py-2 rounded-full border border-white/[0.06] hover:border-white/[0.1] transition-colors group focus-within:border-violet-500/30">
              <span className="material-symbols-outlined text-base text-white/40 mr-2">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm text-white focus:ring-0 w-32 lg:w-40 placeholder:text-white/30"
                placeholder="搜索..."
              />
            </div>

            {/* Nav Links */}
            <Link href="#works" className="hidden lg:block text-white/60 hover:text-white text-sm font-medium transition-colors">
              作品库
            </Link>

            {/* Login & CTA */}
            <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
              <span className="material-symbols-outlined text-base">chat</span>
              微信登录
            </button>

            <Link
              href="/sonic-gallery/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-white/90 hover:scale-[1.02] transition-all"
              style={{ boxShadow: '3px 3px 0 rgba(139,92,246,0.8)' }}
            >
              <span className="material-symbols-outlined text-base">mic</span>
              <span className="hidden sm:inline">开始创作</span>
            </Link>
          </div>
        </nav>
      </header>
    )
  }

  // 其他页面：原有导航样式
  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-18rem)] h-16 bg-[#0a0a0a]/60 backdrop-blur-2xl flex justify-end items-center px-6 lg:px-8 gap-5 z-40 border-b border-white/[0.04]">
      {/* Search Bar */}
      <div className="relative flex items-center bg-white/[0.04] px-4 py-2 rounded-full border border-white/[0.06] hover:border-white/[0.1] transition-colors duration-300 group focus-within:border-violet-500/30 focus-within:bg-white/[0.06]">
        <span className="material-symbols-outlined text-base text-white/40 mr-2 group-focus-within:text-white/60 transition-colors">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-sm text-white focus:ring-0 w-48 lg:w-56 placeholder:text-white/30 font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
          placeholder="搜索节奏..."
        />
      </div>

      {/* Notifications */}
      <button className="relative text-white/50 hover:text-white/90 transition-colors duration-300 group">
        <span className="material-symbols-outlined group-hover:scale-110 transition-transform duration-300">
          notifications
        </span>
        <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
      </button>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <span className="material-symbols-outlined text-violet-400 text-sm">diamond</span>
          <span className="text-white/70 text-xs font-medium">128 积分</span>
        </div>

        <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-95 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          微信登录
        </button>
      </div>
    </header>
  )
}
