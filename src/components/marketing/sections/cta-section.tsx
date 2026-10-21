import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'

export function CTASection() {
  const { openBooking } = useCalBooking()

  return (
    <section
      id="contact"
      aria-labelledby="closing-title"
      data-testid="landing-cta"
      className="landing-scene"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="label-mono mb-6 text-primary">Your next hire</p>
          <h2
            id="closing-title"
            className="font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Spend your time with
            <br className="hidden sm:block" />{' '}
            <span className="text-primary">the right candidates.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            See how Talsek screens resumes, runs interviews, and brings your
            strongest candidates together. You make the hiring decision.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              data-testid="cta-book-demo"
              className="group gap-2 rounded-xl px-7 font-semibold"
              onClick={openBooking}
            >
              Book a demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="ghost" className="rounded-xl" asChild>
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
