"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { User2, LogOut, ChevronDown } from "lucide-react"

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

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    setIsDropdownOpen(false)
    onLogout?.()
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-md bg-background/80",
        className
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            WhyFire
          </span>
        </Link>

        {/* Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/create"
            className="text-foreground/70 hover:text-foreground transition-colors font-medium"
          >
            创作视频
          </Link>
          <Link
            href="/pricing"
            className="text-foreground/70 hover:text-foreground transition-colors font-medium"
          >
            定价
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            // Logged in: Show avatar with dropdown
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-accent transition-colors"
                aria-label="User menu"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User2 className="w-4 h-4 text-primary" />
                  </div>
                )}
                <ChevronDown className="w-4 h-4 text-foreground/60" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-background shadow-lg">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-foreground/60">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Not logged in: Show login button
            <Button onClick={onLogin} variant="default" size="sm">
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
