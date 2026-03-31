'use client'

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  original_price: number | null
  bonus: number
  popular: boolean
  description: string
}

interface CreditPackageCardProps {
  pkg: CreditPackage
  selected: boolean
  onSelect: (id: string) => void
}

export function CreditPackageCard({ pkg, selected, onSelect }: CreditPackageCardProps) {
  const totalCredits = pkg.credits + pkg.bonus
  const priceYuan = (pkg.price / 100).toFixed(0)
  const originalYuan = pkg.original_price ? (pkg.original_price / 100).toFixed(0) : null
  const perCredit = ((pkg.price / 100) / totalCredits).toFixed(2)

  return (
    <button
      onClick={() => onSelect(pkg.id)}
      className={`
        relative w-full text-left p-6 rounded-[20px] transition-all duration-300
        ${selected
          ? 'bg-[#2C2C2E] ring-2 ring-[#8B5CF6] shadow-[0_0_24px_rgba(139,92,246,0.15)]'
          : 'bg-[#1C1C1E] hover:bg-[#2C2C2E]/60 border border-white/[0.06]'
        }
      `}
    >
      {/* Popular badge */}
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white text-[11px] font-bold px-4 py-1 rounded-full tracking-wide">
            最受欢迎
          </span>
        </div>
      )}

      {/* Package name */}
      <h3 className="text-white text-[17px] font-semibold mb-1">{pkg.name}</h3>

      {/* Credits */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-white text-[28px] font-bold tracking-tight">{totalCredits}</span>
        <span className="text-white/40 text-[13px]">积分</span>
        {pkg.bonus > 0 && (
          <span className="text-[11px] text-[#10B981] font-medium bg-[#10B981]/10 px-2 py-0.5 rounded-full">
            +{pkg.bonus} 赠送
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-white/30 text-[13px] mb-4">{pkg.description}</p>

      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] text-white/50">¥</span>
        <span className="text-white text-[28px] font-bold tracking-tight">{priceYuan}</span>
        {originalYuan && (
          <span className="text-white/20 text-[13px] line-through">¥{originalYuan}</span>
        )}
      </div>

      {/* Per credit */}
      <p className="text-white/20 text-[11px] mt-1">约 ¥{perCredit}/积分</p>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      )}
    </button>
  )
}
