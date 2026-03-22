'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  icon: string
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: 'home', label: '首页', href: '/sonic-gallery' },
  { icon: 'add_circle', label: '创作', href: '/sonic-gallery/create' },
  { icon: 'graphic_eq', label: '节奏', href: '/sonic-gallery/beats' },
  { icon: 'person', label: '我的', href: '/sonic-gallery/profile' },
]

export function SideNavBar() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)

  // 首页不需要侧边栏 logo（顶部导航已有）
  const isHomePage = pathname === '/sonic-gallery'

  return (
    <>
      {/* Hover Trigger Zone - Left edge */}
      <div
        className="fixed left-0 top-0 h-full w-4 z-[60] hidden lg:block"
        onMouseEnter={() => setIsVisible(true)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 border-r border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-2xl flex flex-col p-6 z-50 hidden lg:flex transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseLeave={() => setIsVisible(false)}
      >
        {/* Logo Area - Hidden on homepage */}
        {!isHomePage && (
          <Link href="/sonic-gallery" className="flex items-center gap-3 mb-10 group">
            <div
              className="w-10 h-10 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform"
              style={{ boxShadow: '2px 2px 0 rgba(139,92,246,0.8)' }}
            >
              <span className="text-black font-black text-lg italic">W</span>
            </div>
            <div>
              <span className="text-white font-bold text-base block tracking-tight">
                方言回响
              </span>
              <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-medium">
                WhyFire
              </span>
            </div>
          </Link>
        )}

        {/* Navigation */}
        <nav className={`flex flex-col gap-1.5 ${isHomePage ? 'pt-4' : ''}`}>
          {navItems.map((item, index) => {
            const isActive = pathname === item.href ||
              (item.href !== '/sonic-gallery' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ease-out ${
                  isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-violet-500 to-emerald-500 rounded-full" />
                )}

                {/* Background Glow for Active */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-emerald-500/5 rounded-xl" />
                )}

                <span className={`relative material-symbols-outlined text-[22px] transition-all duration-300 ${
                  isActive ? 'text-white' : 'group-hover:scale-110'
                }`}>
                  {item.icon}
                </span>
                <span className="relative text-[15px] tracking-tight font-medium">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto pt-6 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/60 text-lg">
                settings
              </span>
            </div>
            <span className="text-white/40 text-sm">
              设置
            </span>
          </div>
        </div>
      </aside>

      {/* Visible Indicator - Small bar on left edge when hidden */}
      <div
        className={`fixed left-0 top-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-violet-500/50 to-emerald-500/50 rounded-r-full z-40 hidden lg:block transition-opacity duration-300 ${
          isVisible ? 'opacity-0' : 'opacity-100'
        }`}
        onMouseEnter={() => setIsVisible(true)}
      />
    </>
  )
}
