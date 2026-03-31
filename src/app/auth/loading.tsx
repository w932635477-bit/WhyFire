export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="relative mb-6">
        <div className="w-12 h-12 rounded-full border-[3px] border-white/[0.06] animate-spin" style={{ borderTopColor: '#8B5CF6' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#10B981] animate-pulse" />
        </div>
      </div>
      <p className="text-white/30 text-[13px] animate-pulse">正在登录...</p>
    </div>
  )
}
