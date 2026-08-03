import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'

export function CTASection() {
  const { openBooking } = useCalBooking()

  return (
    <section
      id="contact"
      aria-label="Contact and call-to-action"
      data-testid="landing-cta"
      className="relative overflow-hidden bg-background py-16 md:py-20 lg:py-24"
    >
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Start Your Journey
          </div>

          <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Ready to transform your{' '}
            <span className="text-primary">hiring?</span>
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Find interview-ready candidates for your team in{' '}
            <span className="font-bold text-foreground">days</span>, not{' '}
            <span className="text-muted-foreground/60 line-through">months</span>
            .
          </p>

          <Button
            size="lg"
            className="group gap-2 font-semibold shadow-lg"
            onClick={openBooking}
            data-testid="cta-book-demo"
          >
            Book a Demo Now
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  )
}
