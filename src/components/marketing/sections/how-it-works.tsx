import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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
        <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-primary">
          <Link2 className="h-3.5 w-3.5" />
          <span className="truncate">talsek.ai/apply/senior-fe</span>
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
  label: string
  subtitle: string
  description: string[]
  Visual: React.ComponentType
}

export function HowItWorks() {
  const reducedMotion = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)
  const [canPin, setCanPin] = useState(true)
  const { openBooking } = useCalBooking()
  const sectionRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const scrollTargetRef = useRef<{ top: number; expiresAt: number } | null>(
    null,
  )

  const workflowSteps: WorkflowStep[] = useMemo(
    () => [
      {
        id: 1,
        title: 'Post a role in 5 minutes',
        label: 'Post a role',
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
        label: 'Screen resumes',
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
        label: 'AI interviews',
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
        label: 'Review shortlist',
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

  // Large text must grow the chapter rather than paint over the next one.
  useEffect(() => {
    const frame = frameRef.current
    const content = frame?.firstElementChild
    if (!frame || !content) return
    const measure = () => {
      const styles = getComputedStyle(frame)
      const headerOffset =
        parseFloat(getComputedStyle(document.documentElement).fontSize) * 4.5
      const padding =
        parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
      setCanPin(
        content.getBoundingClientRect().height + padding + 1 <=
          window.innerHeight - headerOffset,
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  // The document keeps scrolling while the desktop panel stays in view.
  useEffect(() => {
    const media = window.matchMedia(
      '(min-width: 1024px) and (min-height: 800px) and (prefers-reduced-motion: no-preference)',
    )
    let frame = 0
    let previousY = window.scrollY
    let lastWheelAt = -Infinity
    let entryHoldUntil = 0
    const update = () => {
      frame = 0
      if (!media.matches || !sectionRef.current || !frameRef.current) return
      const styles = getComputedStyle(frameRef.current)
      if (styles.position !== 'sticky') {
        previousY = window.scrollY
        return
      }
      const currentY = window.scrollY
      const offset = parseFloat(styles.top)
      const entryTop =
        currentY + sectionRef.current.getBoundingClientRect().top - offset
      // Momentum entering from the hero must first land on the opening step.
      if (
        !scrollTargetRef.current &&
        performance.now() - lastWheelAt < 220 &&
        previousY < entryTop - 2 &&
        currentY > entryTop + 2
      ) {
        entryHoldUntil = performance.now() + 220
        previousY = entryTop
        window.scrollTo({ top: entryTop, behavior: 'instant' })
        setActiveStep(0)
        return
      }
      previousY = currentY
      const target = scrollTargetRef.current
      if (
        target &&
        performance.now() < target.expiresAt &&
        Math.abs(window.scrollY - target.top) > 2
      )
        return
      scrollTargetRef.current = null
      const top =
        sectionRef.current.getBoundingClientRect().top - parseFloat(styles.top)
      const height = frameRef.current.getBoundingClientRect().height
      const index = Math.round(-top / height)
      setActiveStep(Math.max(0, Math.min(workflowSteps.length - 1, index)))
    }
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const cancelTarget = () => {
      scrollTargetRef.current = null
      scheduleUpdate()
    }
    const onWheel = (event: WheelEvent) => {
      if (!media.matches || event.ctrlKey) return
      lastWheelAt = performance.now()
      if (lastWheelAt < entryHoldUntil) {
        event.preventDefault()
        entryHoldUntil = lastWheelAt + 220
      }
      cancelTarget()
    }
    update()
    window.addEventListener('scrollend', cancelTarget)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', cancelTarget, { passive: true })
    window.addEventListener('keydown', cancelTarget)
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    media.addEventListener('change', scheduleUpdate)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scrollend', cancelTarget)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', cancelTarget)
      window.removeEventListener('keydown', cancelTarget)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      media.removeEventListener('change', scheduleUpdate)
    }
  }, [canPin, workflowSteps.length])

  const goToStep = (index: number) => {
    setActiveStep(index)
    if (
      sectionRef.current &&
      frameRef.current &&
      getComputedStyle(frameRef.current).position === 'sticky'
    ) {
      const top =
        window.scrollY + sectionRef.current.getBoundingClientRect().top
      const targetTop =
        top -
        parseFloat(getComputedStyle(frameRef.current).top) +
        index * frameRef.current.getBoundingClientRect().height
      scrollTargetRef.current = {
        top: targetTop,
        expiresAt: performance.now() + 2000,
      }
      window.scrollTo({
        top: targetTop,
        behavior: reducedMotion ? 'instant' : 'smooth',
      })
    }
  }

  const activeWorkflowStep = workflowSteps[activeStep] ?? workflowSteps[0]

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      data-testid="landing-how-it-works"
      ref={sectionRef}
      data-scroll-pinned={canPin}
      className="landing-workflow relative"
    >
      {workflowSteps.map((step, index) => (
        <div
          key={step.id}
          className="workflow-scroll-stop"
          style={{ top: `${index * 25}%` }}
          aria-hidden="true"
        />
      ))}
      <div
        ref={frameRef}
        data-testid="landing-workflow-frame"
        className="landing-scene border-b bg-background"
      >
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="label-mono mb-3 text-primary">How it works</p>
              <h2
                id="how-it-works-title"
                className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Hiring that runs on autopilot
              </h2>
            </div>
            <p className="text-base text-muted-foreground">
              We analyse, you decide.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <nav
              className="grid grid-cols-2 gap-2 border-b bg-muted/30 p-3 sm:grid-cols-4"
              aria-label="Process steps"
            >
              {workflowSteps.map((step, index) => (
                <Button
                  key={step.id}
                  type="button"
                  variant="ghost"
                  onClick={() => goToStep(index)}
                  className={cn(
                    'h-auto justify-start gap-2.5 rounded-lg px-3 py-3 text-left whitespace-normal',
                    activeStep === index
                      ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-current={activeStep === index ? 'step' : undefined}
                  aria-controls="workflow-panel"
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs',
                      activeStep === index
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background',
                    )}
                    aria-hidden="true"
                  >
                    {step.id}
                  </span>
                  {step.label}
                </Button>
              ))}
            </nav>

            {/* Content panel */}
            <div id="workflow-panel" className="relative min-w-0 p-5 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeWorkflowStep.id}
                  className="grid items-center gap-8 md:min-h-72 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12"
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
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
                          <span className="text-sm leading-relaxed">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <activeWorkflowStep.Visual />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Result band */}
          <div className="mt-6 flex flex-col items-start gap-6 rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Hire in <span className="text-primary">7 days</span> instead of
                90.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Let Talsek handle the screening. You choose who moves forward.
              </p>
            </div>
            <Button
              size="lg"
              data-testid="how-it-works-book-demo"
              className="group shrink-0 gap-2 rounded-xl px-6 font-semibold"
              onClick={openBooking}
            >
              Book a demo
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
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
