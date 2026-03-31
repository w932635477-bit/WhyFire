export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Top bar skeleton */}
      <header className="fixed top-0 inset-x-0 z-40 bg-black/70 backdrop-blur-[40px] rounded-b-2xl">
        <div className="max-w-[640px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="h-5 w-5 rounded bg-white/10 animate-pulse" />
          <div className="h-2 w-12 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-5 w-5 rounded bg-white animate-pulse" />
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-6 pt-24 pb-32">
        {/* Title skeleton */}
        <div className="text-center mb-16">
          <div className="h-10 w-64 rounded bg-white/[0.06] animate-pulse mx-auto mb-4" />
          <div className="h-4 w-32 rounded bg-white/[0.04] animate-pulse mx-auto" />
        </div>

        {/* Package cards skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-[20px] bg-[#1C1C1E] space-y-3">
              <div className="h-5 w-20 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-8 w-16 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-10 w-full rounded-full bg-white/[0.04] animate-pulse mt-4" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
