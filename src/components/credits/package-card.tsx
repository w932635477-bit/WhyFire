'use client'

import type { CreditPackage } from '@/types/credits'

interface PackageCardProps {
  pkg: CreditPackage
  onSelect: (pkg: CreditPackage) => void
  isSelected?: boolean
  isProcessing?: boolean
}

/**
 * 积分包卡片组件
 * Credit Package Card Component
 */
export function PackageCard({
  pkg,
  onSelect,
  isSelected = false,
  isProcessing = false,
}: PackageCardProps) {
  const totalPrice = pkg.price / 100 // 转换为元
  const originalPrice = pkg.originalPrice ? pkg.originalPrice / 100 : null
  const discount = originalPrice ? Math.round((1 - pkg.price / pkg.originalPrice!) * 100) : 0
  const totalCredits = pkg.credits + pkg.bonus

  return (
    <div
      onClick={() => !isProcessing && onSelect(pkg)}
      className={`
        relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20'
          : 'border-dark-600 bg-dark-800 hover:border-primary-500/50 hover:bg-dark-700'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* 热门标签 */}
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold rounded-full shadow-lg">
          最受欢迎
        </div>
      )}

      {/* 折扣标签 */}
      {discount > 0 && !pkg.popular && (
        <div className="absolute -top-2 -right-2 w-14 h-14 flex items-center justify-center bg-secondary text-white text-xs font-bold rounded-full shadow-lg transform rotate-12">
          -{discount}%
        </div>
      )}

      {/* 套餐名称 */}
      <h3 className="text-lg font-bold text-white mb-2">{pkg.name}</h3>

      {/* 积分数量 */}
      <div className="mb-4">
        <span className="text-4xl font-bold text-primary-400">{pkg.credits.toLocaleString()}</span>
        <span className="text-gray-400 ml-1">积分</span>
        {pkg.bonus > 0 && (
          <span className="ml-2 text-secondary text-sm">
            +{pkg.bonus.toLocaleString()} 赠送
          </span>
        )}
      </div>

      {/* 描述 */}
      <p className="text-sm text-gray-400 mb-4 min-h-[2.5rem]">{pkg.description}</p>

      {/* 价格 */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-white">¥{totalPrice}</span>
        {originalPrice && (
          <span className="text-sm text-gray-500 line-through">¥{originalPrice}</span>
        )}
      </div>

      {/* 单价 */}
      <div className="text-xs text-gray-500 mb-4">
        约 ¥{(totalPrice / totalCredits).toFixed(3)}/积分
      </div>

      {/* 购买按钮 */}
      <button
        disabled={isProcessing}
        className={`
          w-full py-3 rounded-lg font-medium transition-all
          ${isSelected
            ? 'bg-primary-500 text-white'
            : 'bg-dark-600 text-gray-300 hover:bg-dark-500 hover:text-white'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isProcessing ? '处理中...' : '立即购买'}
      </button>
    </div>
  )
}
