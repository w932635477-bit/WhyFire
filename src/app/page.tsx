import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-purple-primary/10" />

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent-gradient mb-6 shadow-glow">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 2L2 7v6c0 5.55 4.28 10.74 10 12 5.72-1.26 10-6.45 10-12V7l-10-5z" />
              </svg>
            </div>

            <h1 className="text-5xl font-bold mb-4">
              <span className="gradient-text">WhyFire</span>
            </h1>
            <p className="text-xl text-text-secondary mb-2">
              小红书 0-1万粉博主的 AI 教练
            </p>
            <p className="text-text-tertiary max-w-2xl mx-auto">
              告诉你为什么他能火，你不火。粘贴链接，秒级分析，找出爆款密码
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link
              href="/step1-competitor"
              className="px-8 py-4 bg-accent-gradient text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              开始分析
            </Link>
            <button className="px-8 py-4 bg-bg-card border border-border-default text-text-primary font-semibold text-lg rounded-xl hover:border-border-strong transition-all">
              观看演示
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-bg-card border border-border-default rounded-xl p-6 hover:border-border-strong transition-all">
              <div className="w-12 h-12 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-text-primary mb-2">竞品分析</h3>
              <p className="text-sm text-text-secondary">
                分析爆款笔记，拆解成功要素
              </p>
            </div>

            <div className="bg-bg-card border border-border-default rounded-xl p-6 hover:border-border-strong transition-all">
              <div className="w-12 h-12 rounded-lg bg-purple-primary/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-text-primary mb-2">内容诊断</h3>
              <p className="text-sm text-text-secondary">
                分析自己的内容，找出差距
              </p>
            </div>

            <div className="bg-bg-card border border-border-default rounded-xl p-6 hover:border-border-strong transition-all">
              <div className="w-12 h-12 rounded-lg bg-green-primary/20 flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-text-primary mb-2">可视化对比</h3>
              <p className="text-sm text-text-secondary">
                对比差距，一目了然
              </p>
            </div>

            <div className="bg-bg-card border border-border-default rounded-xl p-6 hover:border-border-strong transition-all">
              <div className="w-12 h-12 rounded-lg bg-yellow-primary/20 flex items-center justify-center mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="font-semibold text-text-primary mb-2">灵感推荐</h3>
              <p className="text-sm text-text-secondary">
                精选 6-10 个相关海外爆款
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-bg-card border border-border-default rounded-xl p-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">2,847</div>
              <div className="text-sm text-text-tertiary">活跃用户</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">156%</div>
              <div className="text-sm text-text-tertiary">平均提升</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">2.3s</div>
              <div className="text-sm text-text-tertiary">分析速度</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
