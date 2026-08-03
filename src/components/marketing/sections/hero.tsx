import { ArrowRight, Users, Zap } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'

export function Hero() {
  const { openBooking } = useCalBooking()

  return (
    <section
      id="home"
      aria-label="Hero section"
      data-testid="landing-hero"
      className="relative flex min-h-[80vh] w-full items-center overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-8 py-24 md:py-32 lg:py-40">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">
              AI-Powered Recruitment
            </span>
          </div>

          <h1
            className="text-center font-semibold leading-[1.1] tracking-tight"
            style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.75rem)' }}
          >
            <span className="text-foreground">AI hiring engine for </span>
            <span className="text-primary">startups</span>
            <span className="text-foreground">. First </span>
            <span className="text-primary">80%</span>
            <span className="text-foreground"> of hiring, automated.</span>
          </h1>

          <p className="max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
            Talsek scans thousands of resumes simultaneously, conducts AI
            screening interviews, and ranks candidates → so you only interview
            the best.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              className="group gap-2 px-8 py-6 text-base font-semibold shadow-lg"
              onClick={openBooking}
              data-testid="hero-book-demo"
            >
              See how it works
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Trusted by 20+ startups · 5-minute setup
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
