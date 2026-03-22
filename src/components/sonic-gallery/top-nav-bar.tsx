'use client'

import { useState } from 'react'

export function TopNavBar() {
  const [searchQuery, setSearchQuery] = useState('')

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
        {/* Notification Dot */}
        <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
      </button>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {/* Credits Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-emerald-500/10 border border-white/[0.06]">
          <span className="material-symbols-outlined text-violet-400 text-sm">
            diamond
          </span>
          <span className="text-white/70 text-xs font-medium">128 积分</span>
        </div>

        {/* Login Button */}
        <button className="relative overflow-hidden bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-95 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          <span className="relative z-10">微信登录</span>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-emerald-500 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </header>
  )
}
