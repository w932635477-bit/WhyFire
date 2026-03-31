export default function Loading() {
  return (
    <div className="px-8 lg:px-16 py-8 max-w-4xl mx-auto">
      {/* Profile header skeleton */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-8 border-b border-white/[0.06]">
        <div className="w-24 h-24 rounded-2xl bg-white/[0.06] animate-pulse" />
        <div className="text-center sm:text-left flex-1 space-y-2">
          <div className="h-6 w-32 rounded bg-white/[0.06] animate-pulse mx-auto sm:mx-0" />
          <div className="h-4 w-48 rounded bg-white/[0.04] animate-pulse mx-auto sm:mx-0" />
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="w-8 h-8 rounded bg-white/[0.06] animate-pulse" />
            <div className="w-px h-6 bg-white/10" />
            <div className="w-8 h-8 rounded bg-white/[0.06] animate-pulse" />
            <div className="w-px h-6 bg-white/10" />
            <div className="w-8 h-8 rounded bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="h-10 w-20 rounded-xl bg-white/[0.06] animate-pulse" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
