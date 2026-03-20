'use client'

import { cn } from '@/lib/utils'
import type { DialectType } from '@/types'

interface DialectOption {
  id: DialectType
  name: string
  flag: string
  available: boolean
}

const dialects: DialectOption[] = [
  { id: 'mandarin', name: '普通话', flag: '🇨🇳', available: true },
  { id: 'cantonese', name: '粤语', flag: '🇭🇰', available: true },
  { id: 'english', name: 'English', flag: '🇺🇸', available: true },
]

interface DialectSelectorProps {
  value?: DialectType
  onChange: (dialect: DialectType) => void
  showPremium?: boolean
}

export function DialectSelector({
  value,
  onChange,
  showPremium = true,
}: DialectSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {dialects.map((dialect) => (
        <button
          key={dialect.id}
          onClick={() => dialect.available && onChange(dialect.id)}
          disabled={!dialect.available}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
            'border-2',
            value === dialect.id
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-card hover:border-primary/50',
            !dialect.available && 'cursor-not-allowed opacity-50'
          )}
        >
          <span>{dialect.flag}</span>
          <span>{dialect.name}</span>
          {!dialect.available && showPremium && (
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
              PRO
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
