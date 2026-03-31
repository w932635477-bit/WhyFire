import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <header className="fixed top-0 inset-x-0 z-40 bg-black/70 backdrop-blur-[40px] rounded-b-2xl">
        <div className="max-w-[640px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/sonic-gallery" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[15px] font-extrabold tracking-tighter text-white">服务条款</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#10B981] shrink-0" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white">Terms</span>
          </div>

          <div className="w-5 h-5 rounded bg-white flex items-center justify-center shrink-0">
            <span className="text-black text-[9px] font-black leading-none">W</span>
          </div>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-6 pt-24 pb-32">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">服务条款</span>
        </h1>
        <p className="text-white/30 text-[13px] mb-10">生效日期：2026 年 3 月 1 日</p>

        <div className="space-y-8 text-white/50 text-[14px] leading-[1.8]">
          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">1. 服务说明</h2>
            <p>方言回响（WhyFire）提供 AI 方言翻唱、原创歌词创作和 MV 视频生成服务。我们保留随时修改或终止服务的权利。</p>
            <p className="mt-2">服务通过积分制运行。用户购买积分包后，可使用积分兑换各项 AI 创作功能。不同功能消耗不同数量的积分，具体以页面提示为准。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">2. 账户与注册</h2>
            <p>使用本服务需要注册账户。您可以通过微信授权或手机号注册。</p>
            <p className="mt-2">您有责任保管好自己的账户信息。因账户信息泄露导致的损失，由您自行承担。如发现账户被非法使用，请立即联系我们。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">3. 积分与支付</h2>
            <p>积分通过微信支付购买。价格以人民币计价，购买时以页面显示的价格为准。</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>已购买的积分不支持退款</li>
              <li>积分永久有效，不会过期</li>
              <li>积分仅限本账户使用，不可转让</li>
              <li>如因系统故障导致积分异常，我们将及时修正</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">4. 用户生成内容</h2>
            <p>您对通过本平台创作的作品享有使用权。上传的原始音频必须为您拥有合法权利的内容。严禁上传侵犯他人版权的音频。</p>
            <p className="mt-2">生成的方言翻唱作品仅供个人娱乐和社交分享使用。如需商用，请另行联系我们获取授权。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">5. 禁止行为</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>上传违法、色情、暴力或仇恨言论内容</li>
              <li>利用平台生成虚假或误导性内容</li>
              <li>批量抓取或自动化调用平台服务</li>
              <li>将生成内容用于未授权的商业用途</li>
              <li>尝试破坏平台安全或干扰正常运营</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">6. 知识产权</h2>
            <p>本平台的设计、代码、商标等知识产权归方言回响所有。用户上传的原始内容，知识产权归原权利人所有。AI 生成的翻唱和视频作品，用户享有合理使用权。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">7. 免责声明</h2>
            <p>AI 生成的翻唱和视频内容仅供参考和娱乐，我们不保证其准确性或适用性。因使用本服务产生的版权纠纷，由用户自行承担法律责任。</p>
            <p className="mt-2">我们不保证服务将不间断、及时、安全或无错误。对于因使用或无法使用本服务而导致的任何直接或间接损失，我们不承担责任。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">8. 服务变更与终止</h2>
            <p>我们保留随时修改、暂停或终止服务（或其任何部分）的权利。我们将尽力提前通知重大变更。</p>
            <p className="mt-2">如您违反本条款，我们有权暂停或终止您的账户，且不退还已购买的积分。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">9. 条款修改</h2>
            <p>我们可能会不定期更新本条款。重大变更将通过平台公告或邮件通知。继续使用本服务即表示您同意修改后的条款。</p>
          </section>

          <section>
            <h2 className="text-white text-[17px] font-semibold mb-3">10. 联系我们</h2>
            <p>如有条款相关问题，请联系 <a href="mailto:contact@whyfire.ai" className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">contact@whyfire.ai</a>。</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06]">
          <Link href="/sonic-gallery/privacy" className="text-[#8b5cf6] hover:text-[#a78bfa] text-[13px] font-medium transition-colors">
            查看隐私政策
          </Link>
        </div>
      </main>
    </div>
  )
}
