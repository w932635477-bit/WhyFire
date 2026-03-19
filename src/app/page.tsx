'use client'

import Hero from '@/components/home/hero'
import { Features } from '@/components/home/features'
import { Testimonials } from '@/components/home/testimonials'
import { Showcase } from '@/components/home/showcase'
import { PricingCTA } from '@/components/home/pricing-cta'
import { FinalCTA } from '@/components/home/final-cta'

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Hero />
      <Showcase />
      <Features />
      <Testimonials />
      <PricingCTA />
      <FinalCTA />
    </main>
  )
}
