import { Button } from '#/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
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
    detail: 'Screening accuracy',
    talsek: 'Consistent AI evaluation',
    traditional: 'Inconsistent manual reviews',
  },
  {
    feature: 'Outreach',
    detail: 'Candidate outreach',
    talsek: 'Personalised at scale',
    traditional: 'Generic templates',
  },
]

const comparisonDetails = [
  { feature: 'Time-to-hire', talsek: '7 days', traditional: '90 days' },
  {
    feature: 'Interviews required',
    talsek: '3 candidates',
    traditional: '20 candidates',
  },
  {
    feature: 'Resume processing',
    talsek: 'Unlimited, real-time',
    traditional: 'Manual review bottlenecks',
  },
  {
    feature: 'Pricing',
    talsek: 'Need-based, flexible',
    traditional: '$100–$500+ per user/month',
  },
]

function ComparisonRows({
  rows,
}: {
  rows: {
    feature: string
    detail?: string
    talsek: string
    traditional: string
  }[]
}) {
  return (
    <table className="w-full table-fixed border-collapse text-left text-sm max-sm:block">
      <caption className="sr-only">
        Talsek and traditional hiring comparison
      </caption>
      <thead className="max-sm:sr-only">
        <tr className="border-b">
          <th
            scope="col"
            className="w-1/4 p-5 font-medium text-muted-foreground"
          >
            Hiring work
          </th>
          <th scope="col" className="p-5 font-medium text-muted-foreground">
            Traditional hiring
          </th>
          <th
            scope="col"
            className="border-x border-primary/15 bg-primary/[0.08] p-5 font-display text-xl font-semibold text-primary"
          >
            Talsek
          </th>
        </tr>
      </thead>
      <tbody className="max-sm:block">
        {rows.map((row) => (
          <tr
            key={row.feature}
            className="border-b last:border-b-0 max-sm:grid max-sm:grid-cols-2"
          >
            <th
              scope="row"
              className="p-5 align-top font-display text-lg font-semibold max-sm:col-span-2 max-sm:px-4 max-sm:py-3"
            >
              {row.feature}
              {row.detail && (
                <span className="mt-1 block font-sans text-[13px] font-normal text-muted-foreground">
                  {row.detail}
                </span>
              )}
            </th>
            <td className="p-5 align-top leading-relaxed text-muted-foreground max-sm:px-4 max-sm:pt-2">
              <span className="mb-2 block text-[13px] font-semibold text-foreground sm:hidden">
                Traditional hiring
              </span>
              {row.traditional}
            </td>
            <td className="border-x border-primary/15 bg-primary/[0.08] p-5 align-top font-medium leading-relaxed max-sm:px-4 max-sm:pt-2">
              <span className="mb-2 block text-[13px] font-semibold text-primary sm:hidden">
                Talsek
              </span>
              {row.talsek}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

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
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-end lg:gap-8">
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
              Review the resume evidence, read the interview, and decide who
              moves forward.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <article
              id="resume-matching"
              aria-labelledby="matching-title"
              className="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border bg-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-secondary/50 p-5 sm:px-6">
                <div>
                  <p className="label-mono mb-2 text-primary">
                    Resume matching · example
                  </p>
                  <h3
                    id="matching-title"
                    className="font-display text-xl font-semibold tracking-tight"
                  >
                    Senior Frontend Engineer
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Priya Sharma · React · 6 yrs
                  </p>
                </div>
                <div className="flex items-baseline gap-2 text-primary">
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
                      className="grid gap-2 border-b py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-5"
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
              <div className="border-t bg-muted/30 px-5 py-4 sm:px-6">
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
                className="scroll-mt-24 py-5 lg:pt-1"
              >
                <p className="label-mono mb-2 text-primary">
                  Screening interview
                </p>
                <h3
                  id="interview-title"
                  className="font-display text-xl font-semibold tracking-tight"
                >
                  Follow up on the work
                </h3>
                <div className="mt-4 space-y-3 text-sm leading-relaxed">
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
                  </div>
                </div>
              </article>
              <article
                id="smart-outreach"
                aria-labelledby="outreach-title"
                className="scroll-mt-24 py-5"
              >
                <p className="label-mono mb-2 text-primary">Smart outreach</p>
                <h3
                  id="outreach-title"
                  className="font-display text-xl font-semibold tracking-tight"
                >
                  Make the next step personal
                </h3>
                <div className="mt-4 text-sm leading-relaxed">
                  <p className="border-b pb-2 text-[13px] text-muted-foreground">
                    To · Priya Sharma
                  </p>
                  <p className="pt-3">
                    Hi Priya, your work on the React 18 migration caught our
                    eye. We'd like to talk about the Senior Frontend Engineer
                    role.
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
          <div className="mb-8">
            <p className="label-mono mb-3 text-primary">
              The hiring work, compared
            </p>
            <h2
              id="benchmark-title"
              className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Talsek vs traditional hiring
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <ComparisonRows rows={operationalComparison} />
          </div>
          <Accordion type="single" collapsible className="mt-3 border-b">
            <AccordionItem value="comparison-details">
              <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
                Compare time, volume, and pricing
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-hidden rounded-xl border bg-card">
                  <ComparisonRows rows={comparisonDetails} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
