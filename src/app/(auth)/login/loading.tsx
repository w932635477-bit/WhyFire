export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo skeleton */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto mb-4 animate-pulse" />
          <div className="h-8 w-32 rounded bg-white/[0.06] animate-pulse mx-auto mb-2" />
          <div className="h-4 w-44 rounded bg-white/[0.04] animate-pulse mx-auto" />
        </div>

        {/* Button skeleton */}
        <div className="w-full max-w-md space-y-4">
          <div className="h-14 rounded-2xl bg-white/[0.06] animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="h-10 rounded-2xl bg-[#1C1C1E] animate-pulse" />
          <div className="h-24 rounded-2xl bg-[#1C1C1E] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
