'use client'

import { useState, useEffect } from 'react'
import type { CreditPackage } from '@/types/credits'

interface PaymentOrderData {
  orderId: string
  codeUrl?: string
  amount: number
  credits: number
  status?: string
  expiredAt: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPackage: CreditPackage | null
  onPaymentSuccess: () => void
}

/**
 * 支付弹窗组件
 * Payment Modal Component
 */
export function PaymentModal({
  isOpen,
  onClose,
  selectedPackage,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [order, setOrder] = useState<PaymentOrderData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [pollCount, setPollCount] = useState(0)

  // 创建订单并获取支付二维码
  useEffect(() => {
    if (isOpen && selectedPackage && !order) {
      createOrder()
    }
  }, [isOpen, selectedPackage])

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 轮询支付状态
  useEffect(() => {
    if (order && order.status === 'pending' && pollCount < 60) {
      const timer = setTimeout(() => {
        checkPaymentStatus()
        setPollCount(pollCount + 1)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [order, pollCount])

  const createOrder = async () => {
    if (!selectedPackage) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建订单失败')
      }

      setOrder(data)
      // 使用 QR code 服务将 codeUrl 转换为二维码图片
      if (data.codeUrl) {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.codeUrl)}`
        setQrCodeUrl(qrApiUrl)
      }
      setCountdown(300) // 5分钟倒计时
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订单失败')
    } finally {
      setIsLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!order) return

    try {
      const response = await fetch(`/api/payments/status?orderId=${order.orderId}`)
      const data = await response.json()

      if (data.status === 'paid') {
        setOrder({ ...order, status: 'paid' })
        onPaymentSuccess()
      }
    } catch (err) {
      console.error('检查支付状态失败:', err)
    }
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  const totalPrice = selectedPackage ? selectedPackage.price / 100 : 0
  const totalCredits = selectedPackage
    ? selectedPackage.credits + selectedPackage.bonus
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-dark-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-dark-600">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">正在创建订单...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={createOrder}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* 支付二维码 */}
        {!isLoading && !error && order && order.status === 'pending' && (
          <div>
            <h3 className="text-xl font-bold text-white text-center mb-6">
              微信扫码支付
            </h3>

            {/* 套餐信息 */}
            <div className="bg-dark-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">套餐</span>
                <span className="text-white font-medium">{selectedPackage?.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">积分</span>
                <span className="text-white font-medium">
                  {totalCredits.toLocaleString()} 积分
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">支付金额</span>
                <span className="text-primary-400 font-bold text-xl">
                  ¥{totalPrice}
                </span>
              </div>
            </div>

            {/* 二维码 */}
            <div className="bg-white rounded-lg p-4 mb-4">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="微信支付二维码"
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
                  <p className="text-gray-500 text-sm">二维码加载中...</p>
                </div>
              )}
            </div>

            {/* 倒计时和提示 */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">
                请在 <span className="text-primary-400 font-medium">{formatCountdown(countdown)}</span> 内完成支付
              </p>
              <p className="text-gray-500 text-xs">
                支付成功后将自动跳转
              </p>
            </div>
          </div>
        )}

        {/* 支付成功 */}
        {!isLoading && !error && order && order.status === 'paid' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">支付成功</h3>
            <p className="text-gray-400 mb-6">
              已获得 {totalCredits.toLocaleString()} 积分
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
