import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemsSection } from '@/components/landing/ProblemsSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { ContactFormSection } from '@/components/landing/ContactFormSection'
import { Footer } from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
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
