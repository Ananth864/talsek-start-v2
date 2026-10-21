import { motion } from 'motion/react'
import { Button } from '#/components/ui/button'
import {
  Brain,
  Check,
  Crown,
  FileSearch,
  Link2,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useCalBooking } from '#/components/marketing/cal-booking-context'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
}

/* ------------------------------------------------------------------ */
/* Feature mini-visuals                                                */
/* ------------------------------------------------------------------ */

function MatchingVisual() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {['5+ yrs React', 'TypeScript'].map((r) => (
          <span
            key={r}
            className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
          >
            {r}
          </span>
        ))}
      </div>
      <div className="rounded-lg border px-3 py-2.5">
        <p className="label-mono mb-1 text-[9px] text-emerald-600 dark:text-emerald-400">
          Evidence · resume, p.2
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          "Led migration of 40+ components to React 18 with TypeScript…"
        </p>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2">
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Requirement met · verified
        </span>
        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>
    </div>
  )
}

function ScreeningVisual() {
  return (
    <div className="space-y-2.5">
      <div className="max-w-[90%] rounded-xl rounded-tl-sm border px-3 py-2">
        <p className="label-mono mb-0.5 text-[9px] text-muted-foreground">
          Talsek
        </p>
        <p className="text-xs leading-relaxed">
          "You list scaling a design system — what broke first?"
        </p>
      </div>
      <div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
        <p className="text-xs leading-relaxed">
          "Token collisions. We split primitives from semantics…"
        </p>
      </div>
      <div className="rounded-lg border px-3 py-2">
        <p className="label-mono mb-1 text-[9px] text-muted-foreground">
          Fit insight
        </p>
        <div className="flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full w-[91%] rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            91
          </span>
        </div>
      </div>
    </div>
  )
}

function OutreachVisual() {
  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border px-3 py-2.5">
        <div className="mb-1.5 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="label-mono text-[9px] text-muted-foreground">
            To · 34 shortlisted candidates
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          "Hi Priya — your write-up on design-token migrations caught our eye.
          We're building exactly that at Talsek…"
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-medium text-primary">
          <Link2 className="h-3.5 w-3.5" />
          Personalised at scale
        </span>
        <span className="font-mono text-xs text-muted-foreground">34/34</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const features = [
  {
    id: 'resume-matching',
    icon: Brain,
    title: 'Context-Aware AI Matching',
    desc: "Every match is backed by evidence from the candidate's actual profile — not keyword density.",
    Visual: MatchingVisual,
  },
  {
    id: 'screening-interview',
    icon: Zap,
    title: 'Automated Screening Interviews',
    desc: 'Talsek interviews candidates in real time, asks your questions, and returns transcripts with fit insights.',
    Visual: ScreeningVisual,
  },
  {
    id: 'smart-outreach',
    icon: Users,
    title: 'Smart Outreach',
    desc: 'Personalised messaging to every shortlisted candidate, referencing their actual work.',
    Visual: OutreachVisual,
  },
]

const stats = [
  { value: '7 days', label: 'Time-to-hire, not 90' },
  { value: '5 min', label: 'Setup, not 40 hours' },
  { value: '3', label: 'Interviews, not 20' },
]

const benchmark = [
  { feature: 'Setup', talsek: '5 minutes', traditional: '40 hrs per hire' },
  { feature: 'Time-to-hire', talsek: '7 days', traditional: '90 days' },
  {
    feature: 'Interviews required',
    talsek: '3 candidates',
    traditional: '20 candidates',
  },
  {
    feature: 'Matching',
    talsek: 'Context-aware, evidence-based',
    traditional: 'Keyword matching',
  },
  {
    feature: 'Resume processing',
    talsek: 'Unlimited, real-time',
    traditional: 'Manual review bottlenecks',
  },
  {
    feature: 'Screening accuracy',
    talsek: 'Consistent AI evaluation',
    traditional: 'Inconsistent manual reviews',
  },
  {
    feature: 'Candidate outreach',
    talsek: 'Personalised at scale',
    traditional: 'Generic templates',
  },
  {
    feature: 'Pricing',
    talsek: 'Need-based, flexible',
    traditional: '$100–$500+ per user/month',
  },
]

export function WhatSetsUsApart() {
  const { openBooking } = useCalBooking()

  return (
    <>
      <section
        id="why-talsek"
        aria-label="Why Talsek"
        data-testid="landing-differentiators"
        className="landing-scene landing-features border-b"
      >
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 text-center"
          >
            <p className="label-mono mb-3 text-primary">Why Talsek</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              What sets us apart
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Context-aware matching, intelligent screening, and automated
              outreach — the first 80% of hiring, handled.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.id}
                id={feature.id}
                {...fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex min-w-0 scroll-mt-24 flex-col rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
                <div className="mt-4 rounded-xl border bg-muted/30 p-3">
                  <feature.Visual />
                </div>
              </motion.article>
            ))}
          </div>

          {/* Stat band */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-6 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card px-6 py-3 text-center">
                <p className="font-display text-3xl font-bold tracking-tight text-primary">
                  {stat.value}
                </p>
                <p className="label-mono mt-2 text-[10px] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      <section
        aria-labelledby="benchmark-title"
        data-testid="landing-benchmark"
        className="landing-scene border-b"
      >
        <div className="container mx-auto px-4">
          {/* Benchmark */}
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <p className="label-mono mb-3 text-primary">The benchmark</p>
              <h2
                id="benchmark-title"
                className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Talsek vs traditional hiring
              </h2>
            </div>

            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr] border-b bg-muted/40 max-sm:grid-cols-[1fr_1fr]">
                <div className="hidden items-center px-5 py-3.5 sm:flex">
                  <span className="label-mono text-[10px] text-muted-foreground">
                    Feature
                  </span>
                </div>
                <div className="flex items-center gap-2 border-l border-border/60 bg-primary/[0.06] px-5 py-3.5 max-sm:border-l-0">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-bold text-primary">Talsek</span>
                </div>
                <div className="flex items-center border-l border-border/60 px-5 py-3.5">
                  <span className="label-mono text-[10px] text-muted-foreground">
                    Traditional hiring
                  </span>
                </div>
              </div>

              {/* Both alternatives stay visible on small screens. */}
              {benchmark.map((item) => (
                <div
                  key={item.feature}
                  className="grid border-b border-border/60 last:border-b-0 sm:grid-cols-[1.2fr_1.4fr_1.4fr] max-sm:grid-cols-[1fr_1fr]"
                >
                  <div className="flex items-center px-5 py-3.5 max-sm:col-span-2 max-sm:bg-muted/30 max-sm:py-2">
                    <span className="text-sm font-medium max-sm:text-xs max-sm:font-semibold max-sm:tracking-wide max-sm:uppercase max-sm:text-muted-foreground">
                      {item.feature}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-l border-border/60 bg-primary/[0.04] px-5 py-3.5 max-sm:border-l-0">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm max-sm:text-xs">
                      {item.talsek}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 border-l border-border/60 px-5 py-3.5">
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="text-sm text-muted-foreground">
                      {item.traditional}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-6 text-center"
          >
            <Button
              size="lg"
              data-testid="differentiators-book-demo"
              className="group gap-2 rounded-xl px-7 font-semibold shadow-lg shadow-primary/20"
              onClick={openBooking}
            >
              <FileSearch className="h-4 w-4" />
              Book a demo
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  )
}
