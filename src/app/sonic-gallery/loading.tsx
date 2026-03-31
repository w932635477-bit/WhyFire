export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      {/* Top bar skeleton */}
      <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-18rem)] h-16 bg-[#0a0a0a]/60 backdrop-blur-2xl flex justify-end items-center px-6 lg:px-8 gap-5 z-40 border-b border-white/[0.04]">
        <div className="relative flex items-center bg-white/[0.04] px-4 py-2 rounded-full border border-white/[0.06] w-48">
          <div className="h-4 w-32 rounded bg-white/[0.04] animate-pulse" />
        </div>
        <div className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-violet-500/20 animate-pulse" />
      </header>

      {/* Main content skeleton */}
      <main className="pt-16 pb-28 min-h-screen">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
          {/* Section title */}
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-32 rounded bg-white/[0.04] animate-pulse" />
          </div>
          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-[20px] bg-white/[0.03] animate-pulse" />
            ))}
          </div>
          {/* Second section */}
          <div className="space-y-2 pt-8">
            <div className="h-8 w-36 rounded bg-white/[0.06] animate-pulse" />
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-white/[0.04] animate-pulse" />
                <div className="h-3 w-12 rounded bg-white/[0.04] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
