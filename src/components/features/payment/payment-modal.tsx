'use client'

import { useState, useEffect, useCallback } from 'react'

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

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'select' | 'paying' | 'success' | 'error'

export function PaymentModal({ open, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<Step>('select')
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [h5Url, setH5Url] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch packages
  useEffect(() => {
    if (!open) return
    fetch('/api/payment/packages')
      .then(res => res.json())
      .then(res => {
        if (res.code === 0) {
          setPackages(res.data)
          // Auto-select popular package
          const popular = res.data.find((p: CreditPackage) => p.popular)
          if (popular) setSelectedPkg(popular.id)
          else if (res.data.length > 0) setSelectedPkg(res.data[0].id)
        }
      })
      .catch(() => setError('获取套餐失败'))
  }, [open])

  // Poll order status
  const pollOrderStatus = useCallback(async (id: string) => {
    let attempts = 0
    const maxAttempts = 120 // 2 minutes at 1s interval

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        setStep('error')
        setError('支付超时，请重试')
        return
      }

      attempts++

      try {
        const res = await fetch(`/api/payment/order-status?order_id=${id}`)
        const data = await res.json()

        if (data.code === 0 && data.data.status === 'paid') {
          setStep('success')
          onSuccess?.()
          return
        }
      } catch {
        // Network error, continue polling
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      return poll()
    }

    return poll()
  }, [onSuccess])

  // Handle confirm payment
  const handlePay = async () => {
    if (!selectedPkg) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: selectedPkg }),
      })

      const data = await res.json()

      if (data.code !== 0) {
        setError(data.message || '创建订单失败')
        setLoading(false)
        return
      }

      setOrderId(data.data.order_id)

      if (data.data.mode === 'dev') {
        // Dev mode: simulate success after 1s
        setStep('paying')
        setTimeout(() => {
          setStep('success')
          onSuccess?.()
        }, 1500)
        return
      }

      // Handle different payment types
      const payType = data.data.pay_type
      const payParams = data.data.pay_params

      if (payType === 'native' && payParams?.code_url) {
        setQrUrl(payParams.code_url)
        setStep('paying')
        pollOrderStatus(data.data.order_id)
      } else if (payType === 'h5' && payParams?.h5_url) {
        // Redirect to H5 payment page
        window.location.href = payParams.h5_url
      } else if (payType === 'jsapi' && payParams?.prepay_id) {
        // WeChat JSAPI payment (handled by WeChat JS-SDK)
        setStep('paying')
        pollOrderStatus(data.data.order_id)
      } else {
        setError('支付方式不可用')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  // Reset state on close
  const handleClose = () => {
    setStep('select')
    setOrderId(null)
    setError(null)
    setQrUrl(null)
    setH5Url(null)
    setLoading(false)
    onClose()
  }

  if (!open) return null

  const selectedPackage = packages.find(p => p.id === selectedPkg)

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full sm:max-w-md bg-[#1C1C1E] sm:rounded-[24px] rounded-t-[24px] max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1C1C1E] z-10 px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-[20px] font-bold">
              {step === 'select' && '购买积分'}
              {step === 'paying' && '支付中'}
              {step === 'success' && '支付成功'}
              {step === 'error' && '支付失败'}
            </h2>
            <button onClick={handleClose} className="text-white/30 hover:text-white/60 transition-colors p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Step: Select package */}
          {step === 'select' && (
            <>
              <div className="space-y-3 mb-6">
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`
                      relative w-full text-left p-5 rounded-[16px] transition-all
                      ${selectedPkg === pkg.id
                        ? 'bg-[#2C2C2E] ring-2 ring-[#8B5CF6]/60'
                        : 'bg-[#0a0a0a] hover:bg-[#2C2C2E]/40 border border-white/[0.04]'
                      }
                    `}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                        最受欢迎
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-[15px] font-semibold">{pkg.name}</p>
                        <p className="text-white/30 text-[13px] mt-0.5">
                          {pkg.credits + pkg.bonus} 积分
                          {pkg.bonus > 0 && <span className="text-[#10B981] ml-1">(+{pkg.bonus} 赠送)</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-[22px] font-bold">¥{(pkg.price / 100).toFixed(0)}</p>
                        {pkg.original_price && (
                          <p className="text-white/20 text-[12px] line-through">¥{(pkg.original_price / 100).toFixed(0)}</p>
                        )}
                      </div>
                    </div>

                    {selectedPkg === pkg.id && (
                      <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={!selectedPkg || loading}
                className={`
                  w-full py-4 rounded-full text-[15px] font-semibold transition-all active:scale-[0.97]
                  ${selectedPkg && !loading
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white shadow-[0_8px_32px_rgba(139,92,246,0.3)]'
                    : 'bg-white/10 text-white/20 cursor-not-allowed'
                  }
                `}
              >
                {loading ? '创建订单中...' : selectedPackage ? `确认支付 ¥${(selectedPackage.price / 100).toFixed(0)}` : '请选择套餐'}
              </button>

              {error && (
                <p className="text-red-400 text-[13px] text-center mt-3">{error}</p>
              )}
            </>
          )}

          {/* Step: Paying */}
          {step === 'paying' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#2C2C2E] flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-white text-[17px] font-semibold mb-2">等待支付</p>
              <p className="text-white/30 text-[13px]">
                {qrUrl ? '请使用微信扫描二维码支付' : '请在微信中完成支付'}
              </p>

              {/* QR Code placeholder */}
              {qrUrl && (
                <div className="mt-6 p-4 bg-white rounded-[16px] inline-block">
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-[12px]">
                    微信扫码支付
                  </div>
                </div>
              )}

              <button
                onClick={handleClose}
                className="mt-6 text-white/30 hover:text-white/60 text-[13px] transition-colors"
              >
                取消支付
              </button>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-white text-[20px] font-bold mb-2">支付成功</p>
              <p className="text-white/30 text-[14px] mb-8">
                {selectedPackage ? `${selectedPackage.credits + selectedPackage.bonus} 积分已到账` : '积分已到账'}
              </p>
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white text-[15px] font-semibold shadow-[0_8px_32px_rgba(139,92,246,0.3)] transition-all active:scale-[0.97]"
              >
                开始创作
              </button>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#2C2C2E] flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <p className="text-white text-[17px] font-semibold mb-2">支付失败</p>
              <p className="text-white/30 text-[14px] mb-6">{error || '请重试'}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('select'); setError(null) }}
                  className="flex-1 py-3.5 rounded-full bg-[#2C2C2E] text-white text-[15px] font-semibold transition-all active:scale-[0.97]"
                >
                  重新选择
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3.5 rounded-full bg-white/10 text-white/60 text-[15px] font-semibold transition-all active:scale-[0.97]"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
