import { ArrowRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'
import { Link } from '@tanstack/react-router'

const shortlist = [
  { name: 'Priya Sharma', score: 94 },
  { name: 'Mei Lin', score: 91 },
  { name: 'Aisha Bello', score: 87 },
]

export function CTASection() {
  const { openBooking } = useCalBooking()

  return (
    <section
      id="contact"
      aria-labelledby="closing-title"
      data-testid="landing-cta"
      className="scroll-mt-24 bg-background py-12 sm:py-16"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="label-mono mb-3 text-primary">Your next hire</p>
            <h2
              id="closing-title"
              className="max-w-lg font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              See Talsek handle your screening
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Walk through resume matching, screening interviews, and outreach.
              You choose who moves forward.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
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
                className="rounded-xl font-semibold"
                asChild
              >
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
          <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
            <div className="border-b bg-muted/30 px-5 py-4">
              <p className="label-mono mb-2 text-primary">
                Shortlist · example
              </p>
              <h3 className="font-display text-lg font-semibold tracking-tight">
                Senior Frontend Engineer
              </h3>
            </div>
            <div className="px-5">
              <div className="flex justify-between gap-3 border-b py-3 text-[13px] text-muted-foreground">
                <span>Ready for your review</span>
                <span>Match score</span>
              </div>
              <ol className="divide-y">
                {shortlist.map((candidate, index) => (
                  <li
                    key={candidate.name}
                    className="flex items-center gap-3 py-4"
                  >
                    <span className="w-5 font-mono text-[13px] text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium">
                      {candidate.name}
                    </span>
                    <span className="font-mono text-sm font-semibold text-primary">
                      {candidate.score}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="border-t bg-muted/30 px-5 py-3 text-[13px] text-muted-foreground">
              Resume evidence and interview transcripts, ready to review.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
