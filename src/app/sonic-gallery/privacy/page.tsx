import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <header className="fixed top-0 inset-x-0 z-40 bg-black/70 backdrop-blur-[40px] rounded-b-2xl">
        <div className="max-w-[640px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/sonic-gallery" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[15px] font-extrabold tracking-tighter text-white">隐私政策</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#10B981] shrink-0" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white">Privacy</span>
          </div>

          <div className="w-5 h-5 rounded bg-white flex items-center justify-center shrink-0">
            <span className="text-black text-[9px] font-black leading-none">W</span>
          </div>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-6 pt-24 pb-32">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">隐私政策</span>
        </h1>
        <p className="text-white/30 text-[13px] mb-10">生效日期：2026 年 3 月 1 日</p>

        <div className="space-y-8 text-white/50 text-[14px] leading-[1.8]">
          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">1. 概述</h2>
            <p>方言回响（WhyFire）尊重并保护每位用户的隐私。本隐私政策说明我们如何收集、使用、存储和保护您的个人信息。</p>
            <p className="mt-2">使用本服务即表示您同意本隐私政策中描述的数据处理方式。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">2. 信息收集</h2>
            <p>我们收集以下信息：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><span className="text-white/70">账户信息：</span>微信昵称、头像、OpenID（用于登录和身份验证）</li>
              <li><span className="text-white/70">上传内容：</span>音频文件和歌词文本（用于 AI 方言翻唱和 MV 视频生成）</li>
              <li><span className="text-white/70">支付信息：</span>订单记录和积分交易记录（不存储银行卡或微信支付密码）</li>
              <li><span className="text-white/70">使用数据：</span>访问时间、页面浏览、设备信息（用于改善服务体验）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">3. 数据存储</h2>
            <p>所有数据存储在以下位置：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><span className="text-white/70">用户数据：</span>Supabase 云数据库（位于亚太区域），数据传输全程加密（HTTPS/TLS）</li>
              <li><span className="text-white/70">音频/视频文件：</span>阿里云 OSS（对象存储服务），访问受签名 URL 保护</li>
              <li><span className="text-white/70">支付记录：</span>微信支付平台处理支付流程，我们仅存储订单状态</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">4. AI 处理</h2>
            <p>您的音频文件将在以下场景中使用：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>AI 方言翻唱：使用 Suno API 和自建 RVC 模型</li>
              <li>音频分离：使用 Demucs 进行人声/伴奏分离</li>
              <li>MV 视频生成：使用 AI 视频合成技术</li>
            </ul>
            <p className="mt-2">处理完成后，原始音频和生成结果仅保存在您的账户中。我们不会将您的音频文件用于训练 AI 模型或分享给第三方。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">5. 第三方服务</h2>
            <p>我们使用以下第三方服务：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><span className="text-white/70">Supabase：</span>用户认证和数据库服务</li>
              <li><span className="text-white/70">微信开放平台：</span>登录和支付服务</li>
              <li><span className="text-white/70">Suno API：</span>AI 音乐生成（通过 Evolink 代理）</li>
              <li><span className="text-white/70">阿里云 OSS：</span>文件存储服务</li>
            </ul>
            <p className="mt-2">这些服务提供商各自有其隐私政策，我们建议您查阅了解。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">6. 数据安全</h2>
            <p>我们采取以下安全措施保护您的数据：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>所有数据传输使用 HTTPS/TLS 加密</li>
              <li>数据库启用行级安全策略（RLS），用户只能访问自己的数据</li>
              <li>支付信息不经过我们的服务器，由微信支付直接处理</li>
              <li>定期审查和更新安全措施</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">7. 用户权利</h2>
            <p>您享有以下权利：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><span className="text-white/70">查看：</span>随时查看您的个人数据和创作记录</li>
              <li><span className="text-white/70">删除：</span>删除您的作品和数据，删除后将从服务器永久移除</li>
              <li><span className="text-white/70">注销：</span>注销账户，我们将删除所有相关数据</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">8. 数据保留</h2>
            <p>您的数据将在以下情况被保留：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>账户活跃期间：所有数据正常保留</li>
              <li>账户注销后：30 天内完成所有数据删除</li>
              <li>法律要求：法律法规要求保留的数据按相关规定处理</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">9. 未成年人保护</h2>
            <p>本服务不面向 14 周岁以下的未成年人。我们不会故意收集未成年人的个人信息。如发现未成年人未经授权使用本服务，我们将及时删除相关数据。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">10. 政策更新</h2>
            <p>我们可能会不定期更新本隐私政策。重大变更将通过平台公告或邮件通知您。继续使用本服务即表示您同意更新后的政策。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">11. 联系我们</h2>
            <p>如有隐私相关问题或数据请求，请联系 <a href="mailto:contact@whyfire.ai" className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">contact@whyfire.ai</a>。</p>
            <p className="mt-2">我们会在 1-2 个工作日内回复您的请求。</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06]">
          <Link href="/sonic-gallery/terms" className="text-[#8b5cf6] hover:text-[#a78bfa] text-[13px] font-medium transition-colors">
            查看服务条款
          </Link>
        </div>
      </main>
    </div>
  )
}
