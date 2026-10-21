import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'
import { Link } from '@tanstack/react-router'

export function CTASection() {
  const { openBooking } = useCalBooking()

  return (
    <section
      id="contact"
      aria-label="Book a demo"
      data-testid="landing-cta"
      className="landing-scene"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-transparent bg-foreground px-6 py-16 text-center text-background sm:px-12 md:py-20 dark:border-border dark:bg-card dark:text-foreground"
        >
          {/* Cobalt edge accent */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-0 left-1/2 h-72 w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[100px]"
            aria-hidden="true"
          />

          <p className="label-mono relative mb-5 text-background/60 dark:text-muted-foreground">
            Start your journey
          </p>
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Ready to transform your hiring?
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-background/70 dark:text-muted-foreground">
            Find interview-ready candidates in days, not months.
          </p>
          <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              data-testid="cta-book-demo"
              className="group gap-2 rounded-xl px-7 font-semibold"
              onClick={openBooking}
            >
              Book a demo
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-xl font-semibold text-background/70 dark:text-muted-foreground hover:bg-background/10 hover:text-background dark:hover:bg-accent dark:hover:text-foreground"
              asChild
            >
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
