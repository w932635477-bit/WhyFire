import Link from 'next/link'

export default function SonicGalleryHome() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.4) contrast(1.1) saturate(0.8)' }}
          >
            <source src="/videos/9003210-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/50 z-10" />
          {/* Noise Texture */}
          <div className="absolute inset-0 opacity-[0.04] z-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* 一键方言 Rap - Center Position */}
        <Link
          href="/sonic-gallery/create"
          className="absolute top-1/2 left-[55%] -translate-y-1/2 z-30 group cursor-pointer hidden lg:block"
        >
          <div className="relative">
            {/* Animated Glow Background */}
            <div className="absolute -inset-16 bg-gradient-to-r from-violet-500/0 via-purple-500/30 to-emerald-500/0 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Text */}
            <div className="relative text-center">
              <div
                className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.2] tracking-tight"
                style={{ animation: 'textFloat 4s ease-in-out infinite' }}
              >
                一键方言
              </div>
              <div
                className="text-7xl lg:text-8xl xl:text-9xl font-black leading-[1.1] tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent"
                style={{
                  backgroundSize: '200% auto',
                  animation: 'gradient 3s linear infinite, rapPulse 2s ease-in-out infinite'
                }}
              >
                Rap
              </div>
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="relative z-20 w-full px-6 sm:px-8 lg:px-20 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
              {/* Left: Main Content */}
              <div className="flex-1 max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-white/70 text-sm font-medium tracking-wide">
                    全新上线 · 方言回响
                  </span>
                </div>

                {/* Main Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.2] tracking-tight mb-5">
                  你的声音，
                  <br />
                  <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                    你的方言。
                  </span>
                </h1>

                <p className="text-white/50 text-base sm:text-lg max-w-md leading-relaxed mb-8">
                  用人工智能克隆你的音色，在 8 种地道方言中重塑你的嘻哈灵魂。仅需 5 秒，开启你的数字音乐之旅。
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/sonic-gallery/create"
                    className="group inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold text-sm hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 active:scale-95"
                  >
                    开始创作
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white/80 hover:text-white hover:bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.2] transition-all duration-300 active:scale-95">
                    <span className="material-symbols-outlined text-base">headphones</span>
                    试听作品
                  </button>
                </div>
              </div>

              {/* Mobile: 一键方言 Rap */}
              <Link
                href="/sonic-gallery/create"
                className="flex-shrink-0 group cursor-pointer lg:hidden"
              >
                <div className="relative">
                  {/* Animated Glow Background */}
                  <div className="absolute -inset-10 bg-gradient-to-r from-violet-500/0 via-purple-500/20 to-emerald-500/0 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Text */}
                  <div className="relative text-center">
                    <div
                      className="text-3xl sm:text-4xl font-bold text-white leading-[1.2] tracking-tight"
                      style={{ animation: 'textFloat 4s ease-in-out infinite' }}
                    >
                      一键方言
                    </div>
                    <div
                      className="text-5xl sm:text-6xl font-black leading-[1.1] tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent"
                      style={{
                        backgroundSize: '200% auto',
                        animation: 'gradient 3s linear infinite, rapPulse 2s ease-in-out infinite'
                      }}
                    >
                      Rap
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Tech Card */}
            <div className="mt-20 max-w-xl">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-500">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-lg">
                      auto_awesome
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">
                      核心技术
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      集成 <span className="text-white/70 font-medium">GPT-SoVITS</span> 情感合成与{' '}
                      <span className="text-white/70 font-medium">Demucs</span>{' '}
                      音轨分离技术。仅需 5 秒样本，捕捉细微咬字特征。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 lg:px-20 py-32 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <span className="text-violet-400 text-sm font-medium tracking-wider uppercase mb-4 block">
              核心功能
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              重新定义声音生产力
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-violet-400 text-2xl">
                  record_voice_over
                </span>
              </div>
              <h4 className="text-white font-semibold text-lg mb-3">
                人声克隆
              </h4>
              <p className="text-white/40 text-sm leading-relaxed">
                零样本学习，实时提取你的声纹特征，支持多情感维度的说唱表达，完美保留你的个人辨识度。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">
                  graphic_eq
                </span>
              </div>
              <h4 className="text-white font-semibold text-lg mb-3">
                节奏对齐
              </h4>
              <p className="text-white/40 text-sm leading-relaxed">
                人工智能自动分析节拍的 BPM 与律动，确保歌词咬字与重音精准落点，无需繁琐的手工对位。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-purple-400 text-2xl">
                  language
                </span>
              </div>
              <h4 className="text-white font-semibold text-lg mb-3">
                八种方言
              </h4>
              <p className="text-white/40 text-sm leading-relaxed">
                涵盖粤语、川渝、东北、闽南等核心语系，内置海量地道韵脚库，赋予你的作品地缘生命力。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Section */}
      <section className="py-32 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-8 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 rounded-2xl overflow-hidden aspect-video relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80"
              alt="录音工作室"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:scale-110 hover:bg-white/20 transition-all duration-300 border border-white/20">
                <span className="material-symbols-outlined text-white text-4xl">
                  play_arrow
                </span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <span className="text-emerald-400 text-sm font-medium tracking-wider uppercase">
              创作流程
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              像写诗一样，
              <br />
              构建你的数字回响。
            </h2>
            <p className="text-white/40 leading-relaxed">
              我们打破了技术与艺术的边界。在这里，你只需要输入歌词，选择方言风格，人工智能就会根据你的声线特征生成极具张力的说唱段落。
            </p>

            <div className="pt-8 border-t border-white/[0.06] flex gap-12">
              <div>
                <div className="text-3xl font-bold text-white">99%</div>
                <div className="text-xs text-white/30 uppercase tracking-wider mt-1">
                  声纹相似度
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">2400+</div>
                <div className="text-xs text-white/30 uppercase tracking-wider mt-1">
                  方言词条
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 lg:px-20 py-20 bg-[#0a0a0a] border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <div>
                  <span className="text-white font-semibold text-lg block">
                    方言回响
                  </span>
                  <span className="text-white/30 text-xs">WhyFire Studio</span>
                </div>
              </div>
              <p className="text-white/40 max-w-sm">
                致力通过人工智能技术重构民族语言魅力，让每一种声音都能在数字时代找到回响。
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                产品
              </h4>
              <nav className="flex flex-col gap-2">
                <Link href="#" className="text-white/40 hover:text-white transition-colors">
                  人声生成
                </Link>
                <Link href="#" className="text-white/40 hover:text-white transition-colors">
                  伴奏分离
                </Link>
                <Link href="#" className="text-white/40 hover:text-white transition-colors">
                  方言词库
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                关于
              </h4>
              <nav className="flex flex-col gap-2">
                <Link href="#" className="text-white/40 hover:text-white transition-colors">
                  实验室
                </Link>
                <Link href="#" className="text-white/40 hover:text-white transition-colors">
                  创作者计划
                </Link>
                <Link href="#" className="text-white/40 hover:text-white transition-colors">
                  隐私协议
                </Link>
              </nav>
            </div>
          </div>
          <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30">
            <p>© 2024 方言回响 · 保留所有权利</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white/60 transition-colors">微博</Link>
              <Link href="#" className="hover:text-white/60 transition-colors">微信</Link>
              <Link href="#" className="hover:text-white/60 transition-colors">抖音</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
