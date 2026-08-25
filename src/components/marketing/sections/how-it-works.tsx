import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '#/components/ui/button'
import { Check, Copy, FileText, Link2 } from 'lucide-react'
import { cn } from '#/lib/utils'
import { useCalBooking } from '#/components/marketing/cal-booking-context'

/* ------------------------------------------------------------------ */
/* Code-built step visuals                                             */
/* ------------------------------------------------------------------ */

function PanelShell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/40 px-4 py-2.5">
        <p className="label-mono text-[10px] text-muted-foreground">{label}</p>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

function SetupVisual() {
  return (
    <PanelShell label="New role · draft">
      <p className="text-sm font-semibold">Senior Frontend Engineer</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[
          '5+ yrs React',
          'TypeScript',
          'Startup experience',
          'Remote-friendly',
        ].map((r) => (
          <span
            key={r}
            className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
          >
            {r}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <p className="label-mono text-[10px] text-muted-foreground">
          Screening questions
        </p>
        {[
          'Describe a migration you led end-to-end',
          'How do you evaluate frontend trade-offs?',
        ].map((q) => (
          <p
            key={q}
            className="rounded-lg border px-3 py-2 text-xs text-muted-foreground"
          >
            {q}
          </p>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-xs text-primary">
          <Link2 className="h-3.5 w-3.5" />
          talsek.ai/apply/senior-fe
        </span>
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </PanelShell>
  )
}

function ScreeningVisual() {
  const rows = [
    { name: 'Priya S.', match: 94 },
    { name: 'Mei L.', match: 91 },
    { name: 'Daniel O.', match: 61 },
    { name: 'Tomas R.', match: 58 },
  ]
  return (
    <PanelShell label="Screening · 128 resumes">
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="w-20 shrink-0 text-sm font-medium">{r.name}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn(
                  'block h-full rounded-full',
                  r.match >= 80 ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                )}
                style={{ width: `${r.match}%` }}
              />
            </span>
            <span
              className={cn(
                'w-9 text-right font-mono text-xs font-semibold',
                r.match >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground',
              )}
            >
              {r.match}
            </span>
          </li>
        ))}
      </ul>
    </PanelShell>
  )
}

function InterviewVisual() {
  return (
    <PanelShell label="AI interview · Priya S.">
      <div className="space-y-3">
        <div className="max-w-[85%] rounded-xl rounded-tl-sm border px-3.5 py-2.5">
          <p className="label-mono mb-1 text-[9px] text-muted-foreground">
            Talsek
          </p>
          <p className="text-xs leading-relaxed">
            Walk me through the React 18 migration mentioned in your resume.
          </p>
        </div>
        <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-primary-foreground">
          <p className="label-mono mb-1 text-[9px] opacity-70">Candidate</p>
          <p className="text-xs leading-relaxed">
            I led a team of 4 off class components. We cut bundle size 22%…
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2">
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Strong evidence · senior-level ownership
          </p>
        </div>
      </div>
    </PanelShell>
  )
}

function ShortlistVisual() {
  const picks = [
    { name: 'Priya Sharma', score: 94 },
    { name: 'Mei Lin', score: 91 },
    { name: 'Aisha Bello', score: 87 },
  ]
  return (
    <PanelShell label="Shortlist · ready for review">
      <ul className="space-y-2">
        {picks.map((p, i) => (
          <li
            key={p.name}
            className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5"
          >
            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              #{i + 1}
            </span>
            <span className="flex-1 text-sm font-medium">{p.name}</span>
            <span className="rounded-md border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              View transcript
            </span>
            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {p.score}
            </span>
          </li>
        ))}
      </ul>
    </PanelShell>
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

type WorkflowStep = {
  id: number
  title: string
  subtitle: string
  description: string[]
  Visual: React.ComponentType
}

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const { openBooking } = useCalBooking()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const workflowSteps: WorkflowStep[] = useMemo(
    () => [
      {
        id: 1,
        title: 'Post a role in 5 minutes',
        subtitle:
          'Create your job, define requirements in plain language, share the apply links.',
        description: [
          'Define role requirements in plain language',
          'Add custom screening questions',
          'Get a shareable link instantly',
        ],
        Visual: SetupVisual,
      },
      {
        id: 2,
        title: 'Every resume screened, 24/7',
        subtitle:
          'Unlimited resume processing with context-aware analysis, not keyword matching.',
        description: [
          'Unlimited resume screening in real time',
          'Context-aware analysis beyond keywords',
          'Instant candidate ranking against your requirements',
        ],
        Visual: ScreeningVisual,
      },
      {
        id: 3,
        title: 'AI interviews top candidates',
        subtitle:
          'Automated screening interviews customised to your exact needs.',
        description: [
          'Conducts screening interviews automatically',
          'Asks questions tuned to your role',
          'Provides transcripts and fit insights',
        ],
        Visual: InterviewVisual,
      },
      {
        id: 4,
        title: 'Review the shortlist, hire',
        subtitle:
          'Get ranked candidates with evidence. Interview only the best.',
        description: [
          'See the top of the funnel with insights and full transcripts',
          'Interview pre-screened candidates only',
          'Make confident hiring decisions faster',
        ],
        Visual: ShortlistVisual,
      },
    ],
    [],
  )

  // Auto-advance steps (paused on hover/focus)
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % workflowSteps.length)
      }, 6000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, workflowSteps.length])

  const goToStep = (index: number) => {
    setActiveStep(index)
    setIsPaused(true)
  }

  const activeWorkflowStep = workflowSteps[activeStep] ?? workflowSteps[0]

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      data-testid="landing-how-it-works"
      className="border-b py-20 md:py-28"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="label-mono mb-4 text-primary">How it works</p>
          <h2
            id="how-it-works-title"
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Hiring that runs on autopilot
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We analyse, you decide.
          </p>
        </div>

        <div className="flex items-start gap-6 lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          {/* Step navigation */}
          <nav
            className="relative flex w-16 shrink-0 flex-col gap-6 lg:w-auto lg:shrink lg:gap-8"
            aria-label="Process steps"
          >
            <div
              className="absolute top-3 left-1/2 h-[calc(100%-12px)] w-px -translate-x-1/2 bg-border lg:left-6 lg:translate-x-0"
              aria-hidden="true"
            />
            {workflowSteps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(index)}
                className={cn(
                  'group relative flex items-center justify-center gap-4 rounded-md text-left transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:items-start',
                  activeStep === index
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-80',
                )}
                aria-current={activeStep === index ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-semibold transition-colors duration-300',
                    activeStep === index
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground group-hover:border-primary/60',
                  )}
                  aria-hidden="true"
                >
                  {step.id}
                </span>
                <span className="hidden pt-1.5 lg:block">
                  <span
                    className={cn(
                      'block text-lg font-semibold transition-colors duration-300',
                      activeStep === index
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {step.title}
                  </span>
                </span>
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div className="relative min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeWorkflowStep.id}
                className="grid items-center gap-8 md:grid-cols-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                aria-labelledby={`step-title-${activeWorkflowStep.id}`}
              >
                <div className="flex flex-col">
                  <h3
                    id={`step-title-${activeWorkflowStep.id}`}
                    className="font-display text-2xl font-bold tracking-tight"
                  >
                    {activeWorkflowStep.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {activeWorkflowStep.subtitle}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {activeWorkflowStep.description.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        <span className="text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <activeWorkflowStep.Visual />
              </motion.div>
            </AnimatePresence>

            {/* Mobile dot indicators */}
            <div className="mt-6 flex justify-center gap-2 lg:hidden">
              {workflowSteps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    activeStep === index
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-muted hover:bg-primary/50',
                  )}
                  aria-label={`Go to step ${index + 1}`}
                  aria-current={activeStep === index ? 'step' : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Result band */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-col items-center gap-8 border-t pt-12 text-center md:mt-20"
        >
          <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Hire in <span className="text-primary">7 days</span> instead of{' '}
            <span className="line-through decoration-2 text-muted-foreground/60">
              90
            </span>
          </p>
          <Button
            size="lg"
            data-testid="how-it-works-book-demo"
            className="group gap-2 rounded-xl px-7 font-semibold shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/25"
            onClick={openBooking}
          >
            Book a demo
            <ArrowRightIcon />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function ArrowRightIcon() {
  return (
    <span
      className="transition-transform duration-300 group-hover:translate-x-1"
      aria-hidden="true"
    >
      →
    </span>
  )
}
