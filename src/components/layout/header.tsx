"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User2, LogOut, ChevronDown, Sparkles } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface HeaderProps {
  user?: User | null
  onLogin?: () => void
  onLogout?: () => void
  className?: string
}

export function Header({ user, onLogin, onLogout, className }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold gradient-text">WhyFire</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/templates"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            模板库
          </Link>
          <Link
            href="/my-videos"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            我的作品
          </Link>
          <Link
            href="/subscription"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            定价
          </Link>
        </nav>

        {/* Actions - Suno style with prominent Create */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Create button - prominent like Suno */}
              <Link
                href="/create"
                className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full
                         bg-gradient-to-r from-purple-500 to-green-500 text-white text-sm font-semibold
                         hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                创作
              </Link>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <User2 className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#141414] shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          onLogout?.()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400
                                 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/create"
                className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full
                         bg-gradient-to-r from-purple-500 to-green-500 text-white text-sm font-semibold
                         hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                创作
              </Link>
              <Button onClick={onLogin} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                登录
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
