import { FileText, Video, Zap } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useCalBooking } from '#/components/marketing/cal-booking-context'
import { PricingTable } from '#/components/marketing/pricing-table'

/** Public pricing page: three tiers, credits explainer, Cal.com demo booking. */
export function PricingPage() {
  const navigate = useNavigate()
  const { openBooking } = useCalBooking()

  const handleGetStarted = () => {
    void navigate({ to: '/signup' })
  }

  return (
    <main data-testid="pricing-page" className="pt-24 pb-16">
      <PricingTable
        icon={
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
        }
        title="Simple, Credit-Based Pricing"
        subtitle="Pay only for what you use. No hidden fees, no long-term commitments. Choose the plan that fits your hiring needs."
        tiers={[
          {
            name: 'Pay as you go',
            description:
              'Perfect for occasional hiring. Top up your wallet anytime and use credits when you need them.',
            priceLabel: 'Wallet based Credits',
            buttonText: 'Get Started',
            onButtonClick: handleGetStarted,
            featuresTitle: "What's included:",
            features: [
              { text: '1 USD = 100 credits' },
              { text: 'Resume Screening: 5 credits', hasInfo: true },
              { text: 'Screening Interview: 40 credits', hasInfo: true },
              { text: 'Top up anytime, no expiry' },
              { text: 'Pay only for what you use' },
              { text: 'No commitment required' },
              { text: 'Full platform access' },
            ],
          },
          {
            name: 'Tier 1',
            description: 'Best value for growing teams.',
            price: 50,
            billingPeriod: '/month',
            badge: '25% OFF',
            buttonText: 'Get Started',
            isPrimary: true,
            onButtonClick: handleGetStarted,
            featuresTitle: 'Everything in Pay as you go, plus:',
            features: [
              { text: '5,000 credits / month', hasInfo: true },
              { text: 'Resume Screening: 4 credits', hasInfo: true },
              { text: 'Screening Interview: 30 credits', hasInfo: true },
              { text: 'Priority support' },
              { text: 'Monthly credit allocation' },
              { text: 'Usage analytics dashboard' },
              { text: 'Team collaboration features' },
            ],
          },
          {
            name: 'Enterprise',
            description:
              'Custom solutions for HR consultancies and large organizations with high-volume hiring needs.',
            priceLabel: 'Custom pricing',
            buttonText: 'Contact Sales',
            onButtonClick: openBooking,
            featuresTitle: 'Everything in Tier 1, plus:',
            features: [
              { text: 'Best-in-class credit rates' },
              {
                text: 'Custom pricing for resumes/interviews',
                hasInfo: true,
              },
              { text: 'Dedicated account manager' },
              { text: 'Custom integrations & API access' },
              { text: 'White-label options' },
              { text: 'SLA & priority support' },
            ],
          },
        ]}
        footerTitle="Need help choosing the right plan?"
        footerDescription="Book a demo call with our team to understand which plan works best for your hiring needs."
        footerButtonText="Book a Demo Call"
        onFooterButtonClick={openBooking}
      />

      <div className="mx-auto mt-16 max-w-6xl px-4" data-testid="credits-explainer">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg md:p-12">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground">
            How Credits Work
          </h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
            <div className="group flex items-start gap-6 rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:bg-accent/50">
              <div className="rounded-xl bg-primary/10 p-4 text-primary transition-colors group-hover:bg-primary/20">
                <FileText className="h-8 w-8" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  Resume Screening
                </h3>
                <p className="text-base text-muted-foreground">
                  AI-powered matching for each resume
                </p>
                <div className="flex items-baseline gap-2 pt-4">
                  <span className="text-3xl font-bold text-foreground">5</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    credits / resume
                  </span>
                </div>
                <p className="pt-1 text-sm text-muted-foreground/80">
                  ≈ $0.05 (Pay as you go)
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-6 rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:bg-accent/50">
              <div className="rounded-xl bg-sky-500/10 p-4 text-sky-500 transition-colors group-hover:bg-sky-500/20">
                <Video className="h-8 w-8" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  Screening Interview
                </h3>
                <p className="text-base text-muted-foreground">
                  AI-driven video interview & analysis
                </p>
                <div className="flex items-baseline gap-2 pt-4">
                  <span className="text-3xl font-bold text-foreground">40</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    credits / interview
                  </span>
                </div>
                <p className="pt-1 text-sm text-muted-foreground/80">
                  ≈ $0.40 (Pay as you go)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
