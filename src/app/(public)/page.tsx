import dynamic from 'next/dynamic'

import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemsSection } from '@/components/landing/ProblemsSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { Footer } from '@/components/landing/Footer'

import { TestimonialsSkeleton } from '@/components/landing/TestimonialsSkeleton'
import { PricingSkeleton } from '@/components/landing/PricingSkeleton'
import { ContactFormSkeleton } from '@/components/landing/ContactFormSkeleton'

// ─── Sections below the fold — lazy loaded with skeleton placeholders ───
const TestimonialsSection = dynamic(
  () => import('@/components/landing/TestimonialsSection').then((m) => m.TestimonialsSection),
  { loading: () => <TestimonialsSkeleton /> }
)

const PricingSection = dynamic(
  () => import('@/components/landing/PricingSection').then((m) => m.PricingSection),
  { loading: () => <PricingSkeleton /> }
)

const ContactFormSection = dynamic(
  () => import('@/components/landing/ContactFormSection').then((m) => m.ContactFormSection),
  { loading: () => <ContactFormSkeleton /> }
)

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProblemsSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <ContactFormSection />
      </main>
      <Footer />
    </>
  )
}
