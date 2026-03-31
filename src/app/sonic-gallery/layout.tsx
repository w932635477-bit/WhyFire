import { SideNavBar, BottomNavBar } from '@/components/sonic-gallery'

export default function SonicGalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      {/* Side Navigation */}
      <SideNavBar />

      {/* Main Content */}
      <main className="pb-28 min-h-screen">
        {children}
      </main>

      {/* Bottom Audio Player */}
      <BottomNavBar />
    </div>
  )
}
