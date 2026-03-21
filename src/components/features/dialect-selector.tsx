'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { DIALECT_CONFIGS, getEnabledDialects, type DialectCode } from '@/types/dialect'

interface DialectSelectorProps {
  value?: DialectCode
  onChange: (dialect: DialectCode) => void
  showPremium?: boolean
  showAll?: boolean  // 是否显示所有方言（包括非推荐）
  compact?: boolean  // 紧凑模式（仅显示推荐方言）
}

// 推荐方言（首次展示）
const RECOMMENDED_DIALECTS: DialectCode[] = [
  'mandarin',    // 普通话
  'cantonese',   // 粤语
  'sichuan',     // 四川话
  'dongbei',     // 东北话
  'henan',       // 河南话
  'shaanxi',     // 陕西话
  'english',     // 英语
]

// 方言分组
const DIALECT_GROUPS = {
  popular: {
    name: '热门方言',
    dialects: ['mandarin', 'cantonese', 'sichuan', 'dongbei', 'english'] as DialectCode[],
  },
  mandarin: {
    name: '官话方言',
    dialects: ['shandong', 'henan', 'shaanxi', 'lanyin', 'jianghuai', 'xinan', 'jiaoliao', 'zhongyuan'] as DialectCode[],
  },
  nonMandarin: {
    name: '非官话方言',
    dialects: ['wu', 'minnan', 'hakka', 'xiang', 'gan', 'jin'] as DialectCode[],
  },
}

export function DialectSelector({
  value,
  onChange,
  showPremium = true,
  showAll: initialShowAll = false,
  compact = false,
}: DialectSelectorProps) {
  const [showAll, setShowAll] = useState(initialShowAll)

  const enabledDialects = getEnabledDialects()

  // 获取方言配置
  const getDialectInfo = (code: DialectCode) => {
    const config = DIALECT_CONFIGS[code]
    return {
      id: code,
      name: config.name,
      region: config.region,
      available: config.enabled,
      isRecommended: RECOMMENDED_DIALECTS.includes(code),
    }
  }

  // 紧凑模式：仅显示推荐方言
  if (compact) {
    const recommendedDialects = RECOMMENDED_DIALECTS.map(getDialectInfo)

    return (
      <div className="flex flex-wrap gap-2">
        {recommendedDialects.map((dialect) => (
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

  // 展开模式：显示所有方言（分组）
  const displayDialects = showAll
    ? enabledDialects
    : enabledDialects.filter(d => RECOMMENDED_DIALECTS.includes(d.code))

  return (
    <div className="space-y-4">
      {/* 热门方言 */}
      {showAll ? (
        <>
          {Object.entries(DIALECT_GROUPS).map(([groupKey, group]) => {
            const groupDialects = group.dialects
              .map(code => getDialectInfo(code))
              .filter(d => d.available)

            if (groupDialects.length === 0) return null

            return (
              <div key={groupKey} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {group.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {groupDialects.map((dialect) => (
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
                      <span>{dialect.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {dialect.region}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayDialects.map((dialect) => (
            <button
              key={dialect.code}
              onClick={() => onChange(dialect.code)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                'border-2',
                value === dialect.code
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card hover:border-primary/50'
              )}
            >
              <span>{dialect.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 展开/收起按钮 */}
      <button
        onClick={() => setShowAll(!showAll)}
        className="text-sm text-primary hover:text-primary/80 transition-colors"
      >
        {showAll ? '收起 ← 显示推荐' : `展开全部 ${enabledDialects.length} 种方言 →`}
      </button>
    </div>
  )
}

// 简化版方言选择器（用于小空间）
export function DialectSelectorCompact({
  value,
  onChange,
}: {
  value?: DialectCode
  onChange: (dialect: DialectCode) => void
}) {
  const recommendedDialects = RECOMMENDED_DIALECTS.map(code => ({
    code,
    name: DIALECT_CONFIGS[code].name,
  }))

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as DialectCode)}
      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="" disabled>选择方言</option>
      {recommendedDialects.map((dialect) => (
        <option key={dialect.code} value={dialect.code}>
          {dialect.name}
        </option>
      ))}
    </select>
  )
}
