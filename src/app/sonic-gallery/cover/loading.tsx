export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Top bar skeleton */}
      <header className="fixed top-0 inset-x-0 z-40 bg-black/70 backdrop-blur-[40px] rounded-b-2xl">
        <div className="max-w-[640px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-4 rounded bg-white/[0.06] animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-4 rounded bg-white/[0.06] animate-pulse" />
          </div>
          <div className="w-5 h-5 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </header>

      {/* Content skeleton */}
      <main className="max-w-[640px] mx-auto px-6 pt-24 pb-32">
        <div className="flex flex-col items-center gap-6 py-20">
          {/* Large circle placeholder */}
          <div className="w-32 h-32 rounded-full bg-white/[0.04] animate-pulse" />
          {/* Text lines */}
          <div className="space-y-3 w-full max-w-xs">
            <div className="h-4 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 rounded bg-white/[0.04] animate-pulse w-3/4 mx-auto" />
          </div>
          {/* Button placeholder */}
          <div className="h-12 w-48 rounded-full bg-white/[0.04] animate-pulse mt-4" />
        </div>
      </main>
    </div>
  )
}
