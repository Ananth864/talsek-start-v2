import { Hero } from '#/components/marketing/sections/hero'
import { CompanyLogos } from '#/components/marketing/sections/company-logos'
import { HowItWorks } from '#/components/marketing/sections/how-it-works'
import { WhatSetsUsApart } from '#/components/marketing/sections/what-sets-us-apart'
import { Testimonials } from '#/components/marketing/sections/testimonials'
import { FAQs } from '#/components/marketing/sections/faqs'
import { CTASection } from '#/components/marketing/sections/cta-section'

/** Public landing page body (header/footer come from the marketing layout). */
export function LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-br-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-0 focus:left-0"
      >
        Skip to main content
      </a>
      <main id="main-content" data-testid="landing-page">
        <Hero />
        <CompanyLogos />
        <HowItWorks />
        <WhatSetsUsApart />
        <Testimonials />
        <FAQs />
        <CTASection />
      </main>
    </>
  )
}
