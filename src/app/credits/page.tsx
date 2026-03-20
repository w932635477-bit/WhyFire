'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Coins, History, Package, Sparkles } from 'lucide-react'
import { PackageCard } from '@/components/credits/package-card'
import { PaymentModal } from '@/components/credits/payment-modal'
import type { CreditPackage, UserCredits, CreditTransaction } from '@/types/credits'

const MOCK_PACKAGES: CreditPackage[] = [
  { id: 'pkg-basic', name: '基础包', credits: 100, price: 990, bonus: 0, popular: false, description: '适合轻度使用者', sortOrder: 1, active: true },
  { id: 'pkg-value', name: '超值包', credits: 500, price: 3990, originalPrice: 4950, bonus: 50, popular: true, description: '最受欢迎，性价比之选', sortOrder: 2, active: true },
  { id: 'pkg-pro', name: '专业包', credits: 1000, price: 6990, originalPrice: 9900, bonus: 150, popular: false, description: '适合专业创作者', sortOrder: 3, active: true },
  { id: 'pkg-enterprise', name: '企业包', credits: 5000, price: 29990, originalPrice: 49500, bonus: 1000, popular: false, description: '团队协作首选', sortOrder: 4, active: true },
]

const MOCK_USER_CREDITS: UserCredits = {
  userId: 'demo-user', balance: 258, totalPurchased: 500, totalUsed: 242,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-03-15T00:00:00Z',
}

const MOCK_TRANSACTIONS: CreditTransaction[] = [
  { id: 'tx-1', userId: 'demo-user', type: 'purchase', amount: 500, balance: 500, packageId: 'pkg-value', description: '购买超值包', createdAt: '2024-03-10T10:00:00Z' },
  { id: 'tx-2', userId: 'demo-user', type: 'use', amount: -50, balance: 450, description: '生成视频 #1', createdAt: '2024-03-11T14:30:00Z' },
  { id: 'tx-3', userId: 'demo-user', type: 'use', amount: -100, balance: 350, description: '生成视频 #2', createdAt: '2024-03-12T09:15:00Z' },
  { id: 'tx-4', userId: 'demo-user', type: 'use', amount: -50, balance: 300, description: '生成视频 #3', createdAt: '2024-03-13T16:45:00Z' },
  { id: 'tx-5', userId: 'demo-user', type: 'use', amount: -42, balance: 258, description: '生成视频 #4', createdAt: '2024-03-15T11:20:00Z' },
]

export default function CreditsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [packagesRes, creditsRes, transactionsRes] = await Promise.all([
        fetch('/api/credits/packages'),
        fetch('/api/credits/balance'),
        fetch('/api/credits/transactions'),
      ])

      if (packagesRes.ok) { const data = await packagesRes.json(); setPackages(data.packages || []) }
      else setPackages(MOCK_PACKAGES)

      if (creditsRes.ok) { const data = await creditsRes.json(); setUserCredits(data) }
      else setUserCredits(MOCK_USER_CREDITS)

      if (transactionsRes.ok) { const data = await transactionsRes.json(); setTransactions(data.transactions || []) }
      else setTransactions(MOCK_TRANSACTIONS)
    } catch (error) {
      console.error('加载数据失败:', error)
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
    loadData()
    setTimeout(() => { setShowPaymentModal(false); setSelectedPackage(null) }, 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <main className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-semibold mb-3"
          >
            <span className="gradient-text">积分中心</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400"
          >
            购买积分，解锁更多创作功能
          </motion.p>
        </div>

        {/* 积分余额卡片 */}
        {userCredits && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/20 to-green-500/20 rounded-2xl p-8 mb-10 border border-purple-500/20"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center">
                  <Coins className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">当前积分</p>
                  <p className="text-4xl font-bold text-white">
                    {userCredits.balance.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex gap-10">
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">累计购买</p>
                  <p className="text-white font-semibold text-lg">{userCredits.totalPurchased.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">累计使用</p>
                  <p className="text-white font-semibold text-lg">{userCredits.totalUsed.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'packages' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            购买积分
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'history' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            交易记录
          </button>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 mt-4">加载中...</p>
          </div>
        )}

        {/* 积分包列表 */}
        {!isLoading && activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.filter((pkg) => pkg.active).sort((a, b) => a.sortOrder - b.sortOrder).map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <PackageCard pkg={pkg} onSelect={handleSelectPackage} isSelected={selectedPackage?.id === pkg.id} />
              </motion.div>
            ))}
          </div>
        )}

        {/* 交易记录 */}
        {!isLoading && activeTab === 'history' && (
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">暂无交易记录</div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {transactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{tx.description}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-lg ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">余额: {tx.balance.toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 帮助说明 */}
        <div className="mt-10 bg-white/[0.02] rounded-2xl p-8 border border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            积分说明
          </h3>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
              <span>每次生成视频消耗 50 积分</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
              <span>积分永久有效，不会过期</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
              <span>购买积分包可获得额外赠送积分</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
              <span>如有问题请联系客服</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 支付弹窗 */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedPackage(null) }}
        selectedPackage={selectedPackage}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </main>
  )
}
