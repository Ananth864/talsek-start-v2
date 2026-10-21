import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Button } from '#/components/ui/button'
import { Check, Copy, FileText, Link2 } from 'lucide-react'
import { cn } from '#/lib/utils'

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
      <div className="border-b bg-muted/40 px-5 py-4">
        <p className="label-mono text-xs text-muted-foreground">{label}</p>
      </div>
      <div className="p-5 sm:p-8">{children}</div>
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
        <p className="label-mono text-xs text-muted-foreground">
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
          <li key={r.name} className="flex flex-wrap items-center gap-3">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="w-20 shrink-0 text-sm font-medium">{r.name}</span>
            <span className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-muted">
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
                'w-9 shrink-0 text-right font-mono text-xs font-semibold',
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
      <div className="mt-6 border-t pt-5">
        <p className="label-mono text-xs text-primary">
          Priya S. · Resume evidence
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          “Led migration of 40+ components to React 18 with TypeScript.”
        </p>
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
          Requirement met · verified
        </p>
      </div>
    </PanelShell>
  )
}

function InterviewVisual() {
  return (
    <PanelShell label="AI interview · Priya S.">
      <div className="space-y-3">
        <div className="max-w-[85%] rounded-xl rounded-tl-sm border px-3.5 py-2.5">
          <p className="label-mono mb-1 text-xs text-muted-foreground">
            Talsek
          </p>
          <p className="text-sm leading-relaxed">
            Walk me through the React 18 migration mentioned in your resume.
          </p>
        </div>
        <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-primary-foreground">
          <p className="label-mono mb-1 text-xs opacity-70">Candidate</p>
          <p className="text-sm leading-relaxed">
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
            className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5"
          >
            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              #{i + 1}
            </span>
            <span className="min-w-0 flex-1 basis-24 text-sm font-medium">
              {p.name}
            </span>
            <span className="rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
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

const workflowSteps = [
  {
    label: 'Post a role',
    title: 'Start with the role.',
    description:
      'Define your requirements in plain language. Add screening questions and share your application link.',
    outcome: 'Your role is ready in 5 minutes.',
    Visual: SetupVisual,
  },
  {
    label: 'Screen resumes',
    title: 'Find the relevant experience.',
    description:
      'Every resume is reviewed against your requirements. See the experience behind each match, with candidates ranked as they apply.',
    outcome: 'Unlimited screening, around the clock.',
    Visual: ScreeningVisual,
  },
  {
    label: 'AI interviews',
    title: 'Go beyond the resume.',
    description:
      'Talsek asks role-specific screening questions. Read the conversation and fit insights before you decide who moves forward.',
    outcome: 'Your questions. Full transcripts. Clear evidence.',
    Visual: InterviewVisual,
  },
  {
    label: 'Review shortlist',
    title: 'Make the hiring decision.',
    description:
      'Compare your strongest candidates in one shortlist. Review their evidence and transcripts, then meet the people you want to hire.',
    outcome: 'We analyse. You decide.',
    Visual: ShortlistVisual,
  },
]

export function HowItWorks() {
  const reducedMotion = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)
  const [canPin, setCanPin] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<number | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const frame = frameRef.current
    if (!section || !frame) return
    let raf = 0
    const measure = () => {
      const rootSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      )
      const content = frame.firstElementChild
      setCanPin(
        window.innerWidth >= 1024 &&
          window.innerHeight >= 800 &&
          rootSize <= 18 &&
          !reducedMotion &&
          !!content &&
          content.getBoundingClientRect().height <
            window.innerHeight - rootSize * 8.5,
      )
    }
    const update = () => {
      raf = 0
      const articles = [
        ...section.querySelectorAll<HTMLElement>('.workflow-chapter'),
      ]
      const offset =
        parseFloat(getComputedStyle(document.documentElement).fontSize) * 8.5
      const target = targetRef.current
      if (target !== null) {
        if (
          Math.abs(
            (articles[target]?.getBoundingClientRect().top ?? 0) - offset,
          ) > 3
        )
          return
        targetRef.current = null
      }
      let index = 0
      articles.forEach((article, i) => {
        if (article.getBoundingClientRect().top <= offset + 8) index = i
      })
      setActiveStep(index)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const cancel = () => {
      targetRef.current = null
      schedule()
    }
    const resize = () => {
      measure()
      schedule()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(frame)
    if (frame.firstElementChild) observer.observe(frame.firstElementChild)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('scrollend', cancel)
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    window.addEventListener('keydown', cancel)
    resize()
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('scrollend', cancel)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', cancel)
    }
  }, [reducedMotion])

  const goToStep = (index: number) => {
    const article =
      sectionRef.current?.querySelectorAll<HTMLElement>('.workflow-chapter')[
        index
      ]
    if (!article) return
    targetRef.current = index
    setActiveStep(index)
    article.scrollIntoView({
      behavior: reducedMotion ? 'instant' : 'smooth',
      block: 'start',
    })
  }
  const ActiveVisual = workflowSteps[activeStep].Visual

  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      data-testid="landing-how-it-works"
      ref={sectionRef}
      data-scroll-pinned={canPin}
      className="landing-workflow border-b"
    >
      <div className="workflow-nav border-y bg-background/95 backdrop-blur-sm">
        <nav
          className="container mx-auto grid max-w-6xl grid-cols-4 px-4"
          aria-label="Process steps"
        >
          {workflowSteps.map((step, index) => (
            <Button
              key={step.label}
              variant="ghost"
              onClick={() => goToStep(index)}
              aria-current={activeStep === index ? 'step' : undefined}
              aria-controls={`workflow-step-${index}`}
              className={cn(
                'h-16 justify-start gap-3 rounded-none border-b-2 px-1 text-xs whitespace-normal sm:text-sm',
                activeStep === index
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              <span
                aria-hidden="true"
                className="hidden font-mono text-xs sm:inline"
              >
                0{index + 1}
              </span>
              {step.label}
            </Button>
          ))}
        </nav>
      </div>
      <div className="workflow-composition container mx-auto max-w-6xl px-4">
        <div className="workflow-copy">
          {workflowSteps.map((step, index) => (
            <article
              id={`workflow-step-${index}`}
              key={step.label}
              className="workflow-chapter"
              aria-labelledby={`step-title-${index}`}
            >
              <div className="max-w-md">
                <p className="label-mono mb-5 text-primary">
                  How it works · 0{index + 1} / 04
                </p>
                <h2
                  id={`step-title-${index}`}
                  className="font-display text-4xl font-bold leading-[1.08] tracking-tight lg:text-5xl"
                >
                  {step.title}
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <p className="mt-8 border-l-2 border-primary pl-4 text-sm font-medium">
                  {step.outcome}
                </p>
              </div>
              <div className="workflow-inline-visual mt-8 w-full">
                <step.Visual />
              </div>
            </article>
          ))}
        </div>
        <div
          ref={frameRef}
          data-testid="landing-workflow-frame"
          className="workflow-product"
        >
          <div className="w-full">
            <ActiveVisual />
          </div>
        </div>
      </div>
    </section>
  )
}
