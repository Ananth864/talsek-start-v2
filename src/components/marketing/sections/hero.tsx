import { ArrowDown, ArrowRight, Check, FileSearch, Video } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '#/components/ui/card'
import { useCalBooking } from '#/components/marketing/cal-booking-context'

const exampleCandidates = [
  {
    initials: 'AL',
    name: 'Alex Lee',
    detail: 'Product design · 6 years',
    score: 94,
  },
  {
    initials: 'SP',
    name: 'Sam Patel',
    detail: 'Product design · 5 years',
    score: 89,
  },
  {
    initials: 'JM',
    name: 'Jamie Morgan',
    detail: 'UX design · 4 years',
    score: 85,
  },
]

/** Illustrative data only. This preview never reads real candidate records. */
function CandidatePreview() {
  return (
    <figure className="relative mx-auto w-full max-w-xl min-w-0 lg:ml-auto">
      <div
        className="pointer-events-none absolute -inset-4 rounded-[2rem] border border-primary/10 bg-primary/[0.03] sm:-inset-6"
        aria-hidden="true"
      />
      <Card className="relative gap-0 overflow-hidden rounded-2xl border-primary/15 py-0 shadow-xl shadow-primary/10">
        <CardHeader className="gap-4 border-b bg-secondary/40 p-4 sm:p-5 [.border-b]:pb-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <img src="/Talsek_logo_square.png" alt="" className="size-6" />
              Candidate review
            </span>
            <Badge
              variant="outline"
              className="bg-background text-muted-foreground"
            >
              Sample data
            </Badge>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Your hiring pipeline
            </p>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Senior product designer
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>24 job applications</span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              3 candidates to review
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
            <span>Candidate</span>
            <span>AI match</span>
          </div>
          <ol
            aria-label="Example candidates ranked by AI match"
            className="space-y-2"
          >
            {exampleCandidates.map((candidate, index) => (
              <li
                key={candidate.initials}
                className={`flex items-center gap-3 rounded-xl border p-3 ${index === 0 ? 'border-primary/25 bg-primary/[0.05]' : 'border-border bg-background'}`}
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                  aria-hidden="true"
                >
                  {candidate.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{candidate.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {candidate.detail}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-lg font-semibold tracking-tight text-primary dark:text-foreground">
                  {candidate.score}
                  <span className="text-xs">%</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl bg-secondary/60 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <FileSearch
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
              Alex's match summary
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Matches your product design requirements. Led design systems and
              shipped products with early-stage teams.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-wrap gap-x-5 gap-y-2 border-t bg-secondary/30 px-4 py-4 [.border-t]:pt-4 text-xs text-muted-foreground sm:px-5">
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-primary" aria-hidden="true" />
            Resume analysed
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="size-3.5 text-primary" aria-hidden="true" />
            Screening interview complete
          </span>
        </CardFooter>
      </Card>
      <figcaption className="relative mt-6 text-center text-xs text-muted-foreground">
        Resume insights and interview results. Ready for your review.
      </figcaption>
    </figure>
  )
}

export function Hero() {
  const { openBooking } = useCalBooking()

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      data-testid="landing-hero"
      className="relative isolate w-full border-b border-border/60 bg-gradient-to-b from-secondary/40 to-background"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pt-32 pb-16 sm:px-10 sm:pt-40 sm:pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:pt-36 lg:pb-16">
        <div className="min-w-0">
          <Badge
            variant="outline"
            className="mb-6 gap-2 rounded-full border-primary/20 bg-background px-3 py-1.5 text-xs font-medium text-primary dark:text-foreground"
          >
            <span
              className="size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            AI hiring for startups
          </Badge>
          <h1
            id="hero-title"
            className="max-w-xl text-4xl leading-[1.06] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4rem] xl:text-7xl"
          >
            Your next hire,
            <br />
            without the <span className="block text-primary">resume pile.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Talsek reviews resumes, runs AI screening interviews, and ranks
            candidates against your job requirements. You decide who to hire.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="group h-12 gap-3 px-6 text-base shadow-sm"
              onClick={openBooking}
              data-testid="hero-book-demo"
            >
              Book a demo
              <ArrowRight
                className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 gap-2 px-4"
              asChild
            >
              <a href="#how-it-works">
                Explore the workflow
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Check
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            AI handles the screening. You make the call.
          </p>
        </div>
        <CandidatePreview />
      </div>
    </section>
  )
}
