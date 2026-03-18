'use client'

import { useState, useEffect } from 'react'
import { PackageCard } from '@/components/credits/package-card'
import { PaymentModal } from '@/components/credits/payment-modal'
import type { CreditPackage, UserCredits, CreditTransaction } from '@/types/credits'

// 模拟积分包数据（实际应从API获取）
const MOCK_PACKAGES: CreditPackage[] = [
  {
    id: 'pkg-basic',
    name: '基础包',
    credits: 100,
    price: 990,
    bonus: 0,
    popular: false,
    description: '适合轻度使用者',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'pkg-value',
    name: '超值包',
    credits: 500,
    price: 3990,
    originalPrice: 4950,
    bonus: 50,
    popular: true,
    description: '最受欢迎，性价比之选',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'pkg-pro',
    name: '专业包',
    credits: 1000,
    price: 6990,
    originalPrice: 9900,
    bonus: 150,
    popular: false,
    description: '适合专业创作者',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'pkg-enterprise',
    name: '企业包',
    credits: 5000,
    price: 29990,
    originalPrice: 49500,
    bonus: 1000,
    popular: false,
    description: '团队协作首选',
    sortOrder: 4,
    active: true,
  },
]

// 模拟用户积分数据
const MOCK_USER_CREDITS: UserCredits = {
  userId: 'demo-user',
  balance: 258,
  totalPurchased: 500,
  totalUsed: 242,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-03-15T00:00:00Z',
}

// 模拟交易记录
const MOCK_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx-1',
    userId: 'demo-user',
    type: 'purchase',
    amount: 500,
    balance: 500,
    packageId: 'pkg-value',
    description: '购买超值包',
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'tx-2',
    userId: 'demo-user',
    type: 'use',
    amount: -50,
    balance: 450,
    description: '生成视频 #1',
    createdAt: '2024-03-11T14:30:00Z',
  },
  {
    id: 'tx-3',
    userId: 'demo-user',
    type: 'use',
    amount: -100,
    balance: 350,
    description: '生成视频 #2',
    createdAt: '2024-03-12T09:15:00Z',
  },
  {
    id: 'tx-4',
    userId: 'demo-user',
    type: 'use',
    amount: -50,
    balance: 300,
    description: '生成视频 #3',
    createdAt: '2024-03-13T16:45:00Z',
  },
  {
    id: 'tx-5',
    userId: 'demo-user',
    type: 'use',
    amount: -42,
    balance: 258,
    description: '生成视频 #4',
    createdAt: '2024-03-15T11:20:00Z',
  },
]

/**
 * 积分购买页面
 * Credits Purchase Page
 */
export default function CreditsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages')

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // 并行请求积分包和用户积分
      const [packagesRes, creditsRes, transactionsRes] = await Promise.all([
        fetch('/api/credits/packages'),
        fetch('/api/credits/balance'),
        fetch('/api/credits/transactions'),
      ])

      if (packagesRes.ok) {
        const data = await packagesRes.json()
        setPackages(data.packages || [])
      } else {
        // 使用模拟数据
        setPackages(MOCK_PACKAGES)
      }

      if (creditsRes.ok) {
        const data = await creditsRes.json()
        setUserCredits(data)
      } else {
        // 使用模拟数据
        setUserCredits(MOCK_USER_CREDITS)
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions || [])
      } else {
        // 使用模拟数据
        setTransactions(MOCK_TRANSACTIONS)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      // 使用模拟数据
      setPackages(MOCK_PACKAGES)
      setUserCredits(MOCK_USER_CREDITS)
      setTransactions(MOCK_TRANSACTIONS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    // 刷新用户积分
    loadData()
    // 3秒后关闭弹窗
    setTimeout(() => {
      setShowPaymentModal(false)
      setSelectedPackage(null)
    }, 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: '购买',
      use: '使用',
      refund: '退款',
      bonus: '赠送',
    }
    return labels[type] || type
  }

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      purchase: 'text-secondary',
      use: 'text-red-400',
      refund: 'text-yellow-400',
      bonus: 'text-primary-400',
    }
    return colors[type] || 'text-gray-400'
  }

  return (
    <main className="min-h-screen bg-dark-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">积分中心</h1>
          <p className="text-gray-400">购买积分，解锁更多创作功能</p>
        </div>

        {/* 积分余额卡片 */}
        {userCredits && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-primary-200 text-sm mb-1">当前积分</p>
                <p className="text-4xl font-bold text-white">
                  {userCredits.balance.toLocaleString()}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-8">
                <div className="text-center">
                  <p className="text-primary-200 text-xs mb-1">累计购买</p>
                  <p className="text-white font-semibold">
                    {userCredits.totalPurchased.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-primary-200 text-xs mb-1">累计使用</p>
                  <p className="text-white font-semibold">
                    {userCredits.totalUsed.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 切换 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'packages'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            购买积分
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            交易记录
          </button>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 mt-4">加载中...</p>
          </div>
        )}

        {/* 积分包列表 */}
        {!isLoading && activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages
              .filter((pkg) => pkg.active)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onSelect={handleSelectPackage}
                  isSelected={selectedPackage?.id === pkg.id}
                />
              ))}
          </div>
        )}

        {/* 交易记录 */}
        {!isLoading && activeTab === 'history' && (
          <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无交易记录</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-600">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 flex items-center justify-between hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{tx.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          tx.amount > 0 ? 'text-secondary' : 'text-red-400'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        余额: {tx.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 帮助说明 */}
        <div className="mt-8 bg-dark-800 rounded-xl p-6 border border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-4">积分说明</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>每次生成视频消耗 50 积分</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>积分永久有效，不会过期</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>购买积分包可获得额外赠送积分</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>如有问题请联系客服</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 支付弹窗 */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedPackage(null)
        }}
        selectedPackage={selectedPackage}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </main>
  )
}
