import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'

const evidence = [
  {
    requirement: '5+ yrs React',
    excerpt: 'Led migration of 40+ components to React 18',
    source: 'Resume, p.1',
  },
  {
    requirement: 'TypeScript',
    excerpt: 'Shipped TS strict-mode design system at Razorpay',
    source: 'Resume, p.2',
  },
  {
    requirement: 'Startup experience',
    excerpt: 'Early engineer at Series-A fintech (2020–22)',
    source: 'Resume, p.1',
  },
]

const operationalComparison = [
  {
    feature: 'Matching',
    talsek: 'Context-aware, evidence-based',
    traditional: 'Keyword matching',
  },
  {
    feature: 'Screening',
    talsek: 'Consistent AI evaluation',
    traditional: 'Inconsistent manual reviews',
  },
  {
    feature: 'Outreach',
    talsek: 'Personalised at scale',
    traditional: 'Generic templates',
  },
]

export function WhatSetsUsApart() {
  const { openBooking } = useCalBooking()

  return (
    <>
      <section
        id="why-talsek"
        aria-labelledby="evidence-title"
        data-testid="landing-differentiators"
        className="landing-scene border-b"
      >
        <div className="container mx-auto px-4">
          <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-end lg:gap-8">
            <div>
              <p className="label-mono mb-3 text-primary">Why Talsek</p>
              <h2
                id="evidence-title"
                className="max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl"
              >
                See the evidence behind the match
              </h2>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              Context-aware matching, intelligent screening, and automated
              outreach. The first 80% of hiring, handled.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <article
              id="resume-matching"
              aria-labelledby="matching-title"
              className="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border bg-card"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b bg-secondary/50 p-4 sm:px-6">
                <div>
                  <p className="label-mono mb-2 text-primary">
                    Resume matching · example
                  </p>
                  <h3
                    id="matching-title"
                    className="font-display text-xl font-semibold tracking-tight"
                  >
                    Context-aware AI matching
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    Every match is backed by evidence from the candidate's
                    actual profile, not keyword density.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Senior Frontend Engineer · Priya Sharma · React · 6 yrs
                  </p>
                </div>
                <div className="flex flex-col items-end text-primary">
                  <span className="font-display text-4xl font-semibold tracking-tight">
                    94
                  </span>
                  <span className="text-[13px]">match score</span>
                </div>
              </div>
              <div className="px-5 sm:px-6">
                <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5 border-b py-3 sm:grid">
                  <p className="label-mono text-muted-foreground">
                    Requirement
                  </p>
                  <p className="label-mono text-muted-foreground">
                    Resume evidence
                  </p>
                </div>
                <dl>
                  {evidence.map((item) => (
                    <div
                      key={item.requirement}
                      className="grid gap-2 border-b py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-5"
                    >
                      <dt className="text-sm font-semibold">
                        {item.requirement}
                      </dt>
                      <dd>
                        <p className="text-sm leading-relaxed">
                          {item.excerpt}
                        </p>
                        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                          {item.source}
                        </p>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="border-t px-5 py-3 text-sm font-medium text-emerald-700 sm:px-6 dark:text-emerald-400">
                Requirement met · verified
              </p>
              <div className="border-t bg-muted/30 px-5 py-3 sm:px-6">
                <p className="mb-1 text-[13px] font-semibold">
                  A point to explore in the interview
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No direct team management on resume.
                </p>
              </div>
            </article>

            <div className="min-w-0 divide-y border-y lg:border-t-0">
              <article
                id="screening-interview"
                aria-labelledby="interview-title"
                className="scroll-mt-24 py-3 lg:pt-1"
              >
                <h3
                  id="interview-title"
                  className="font-display text-xl font-semibold tracking-tight"
                >
                  Automated screening interviews
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Talsek interviews candidates in real time, asks your
                  questions, and returns transcripts with fit insights.
                </p>
                <div className="mt-3 space-y-2 text-sm leading-relaxed">
                  <div className="border-l-2 border-primary/40 pl-3">
                    <p className="mb-1 text-[13px] font-semibold">Talsek</p>
                    <p>
                      Walk me through the React 18 migration mentioned in your
                      resume.
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
                    <p className="mb-1 text-[13px] font-semibold">Priya</p>
                    <p className="text-muted-foreground">
                      I led a team of 4 off class components. We cut bundle size
                      22%…
                    </p>
                    <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Fit insight · senior-level ownership
                    </p>
                  </div>
                </div>
              </article>
              <article
                id="smart-outreach"
                aria-labelledby="outreach-title"
                className="scroll-mt-24 py-3"
              >
                <h3
                  id="outreach-title"
                  className="font-display text-xl font-semibold tracking-tight"
                >
                  Smart outreach
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Personalised messaging to every shortlisted candidate,
                  referencing their actual work.
                </p>
                <div className="mt-3 text-sm leading-relaxed">
                  <p className="border-b pb-2 text-[13px] text-muted-foreground">
                    To · Priya Sharma
                  </p>
                  <p className="pt-3">
                    Hi Priya, your work on the React 18 migration caught our
                    eye. We'd like to talk about the Senior Frontend Engineer
                    role.
                  </p>
                  <p className="mt-3 text-xs font-medium text-primary">
                    Personalised at scale · 34/34 shortlisted candidates
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="benchmark-title"
        data-testid="landing-benchmark"
        className="landing-scene border-b"
      >
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="label-mono mb-3 text-primary">
                A shorter path to your next hire
              </p>
              <h2
                id="benchmark-title"
                className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Talsek vs traditional hiring
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Less time reviewing applications. More time with the right
              candidates.
            </p>
          </div>

          <dl
            aria-label="Hiring at a glance"
            className="grid gap-6 border-y py-6 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-8"
          >
            <div>
              <dt className="label-mono text-muted-foreground">Time-to-hire</dt>
              <dd className="mt-3 flex items-baseline gap-4 font-display font-bold tracking-tight">
                <span className="text-2xl text-muted-foreground line-through decoration-1">
                  90 days
                </span>
                <span
                  aria-hidden="true"
                  className="text-xl font-normal text-muted-foreground"
                >
                  →
                </span>
                <span className="text-4xl text-primary sm:text-5xl">
                  7 days
                </span>
              </dd>
              <p className="mt-2 text-xs text-muted-foreground">
                Traditional hiring → Talsek
              </p>
            </div>
            <div className="border-border sm:border-l sm:pl-8">
              <dt className="label-mono text-muted-foreground">Role setup</dt>
              <dd className="mt-3 font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                5 min
              </dd>
              <p className="mt-2 text-xs text-muted-foreground">
                Create your role and start accepting applications
              </p>
            </div>
            <div className="border-border sm:border-l sm:pl-8">
              <dt className="label-mono text-muted-foreground">
                Interviews required
              </dt>
              <dd className="mt-3 flex items-baseline gap-3 font-display font-bold tracking-tight">
                <span className="text-2xl text-muted-foreground line-through decoration-1">
                  20
                </span>
                <span
                  aria-hidden="true"
                  className="text-xl font-normal text-muted-foreground"
                >
                  →
                </span>
                <span className="text-4xl text-primary sm:text-5xl">3</span>
              </dd>
              <p className="mt-2 text-xs text-muted-foreground">
                Traditional hiring → Talsek
              </p>
            </div>
          </dl>

          <div className="grid gap-6 py-6 md:grid-cols-3 md:gap-8">
            {operationalComparison.map((item) => (
              <div key={item.feature}>
                <h3 className="font-display text-lg font-semibold">
                  {item.feature}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="sr-only">Traditional hiring: </span>
                  {item.traditional}
                </p>
                <div className="mt-3 border-l-2 border-primary pl-3">
                  <p className="label-mono text-[10px] text-primary">
                    With Talsek
                  </p>
                  <p className="mt-1 text-base font-semibold leading-snug">
                    {item.talsek}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-5 border-y py-5 text-sm sm:grid-cols-2 sm:gap-8">
            <div>
              <h3 className="font-semibold">Resume processing</h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                Manual review bottlenecks <span aria-hidden="true">→</span>{' '}
                <span className="font-medium text-foreground">
                  Unlimited, real-time processing
                </span>
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Pricing</h3>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                $100–$500+ per user/month <span aria-hidden="true">→</span>{' '}
                <span className="font-medium text-foreground">
                  Need-based, flexible plans
                </span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Traditional hiring effort: 40 hours per hire.
          </p>
          <div className="mt-6 flex justify-start">
            <Button
              size="lg"
              data-testid="differentiators-book-demo"
              className="rounded-xl px-7 font-semibold"
              onClick={openBooking}
            >
              Book a demo
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
