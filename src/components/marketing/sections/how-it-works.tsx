import { useEffect, useRef, useState } from 'react'
import { Check, Send, Settings } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'
import { cn } from '#/lib/utils'

type WorkflowStep = {
  id: number
  title: string
  subtitle: string
  description: string[]
  image: string
  imageAlt: string
  anchorId?: string
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: 'Hire in 7 Days',
    subtitle:
      'Set up in under 5 minutes. Create your job, define requirements, share the apply links.',
    description: [
      'Define role requirements in plain language',
      'Add custom screening questions',
      'Get a shareable link instantly',
    ],
    image: '/images/5-min-setup-illustration.png',
    imageAlt:
      '5-minute job setup illustration showing job requirements, applications, interviews, and hiring',
  },
  {
    id: 2,
    title: 'Talsek Screens Every Resume (24/7)',
    subtitle:
      'Unlimited resume processing with intelligent analysis, not just keyword matching.',
    description: [
      'Unlimited resume screening in real-time',
      'Context-aware analysis, not keyword matching',
      'Instant candidate ranking based on requirements',
    ],
    image: '/images/resume-screening-illustration.png',
    imageAlt: 'Talsek AI screening resumes automatically',
    anchorId: 'best-fit-candidate',
  },
  {
    id: 3,
    title: 'Talsek Interviews Top Candidates',
    subtitle:
      'Automated screening interviews customized to your exact needs.',
    description: [
      'Conducts screening interviews automatically',
      'Asks questions as per YOUR needs',
      'Provides transcripts and fit insights',
    ],
    image: '/images/ai-interviews-illustration.png',
    imageAlt: 'AI conducting candidate interviews',
    anchorId: 'interview-ready-candidate',
  },
  {
    id: 4,
    title: 'Review shortlisted candidates, Hire.',
    subtitle:
      'Get ranked candidates with insights. Interview only the best. Hire faster.',
    description: [
      'See only the top 5% with AI-generated insights and full transcripts',
      'Interview pre-screened, qualified candidates only',
      'Make confident hiring decisions faster',
    ],
    image: '/images/hire-illustration.png',
    imageAlt: 'Review shortlisted candidates and hire',
  },
]

export function HowItWorks() {
  const { openBooking } = useCalBooking()
  const [activeStep, setActiveStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    for (const step of workflowSteps) {
      const img = new Image()
      img.src = step.image
    }
  }, [])

  useEffect(() => {
    if (isPaused) return
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length)
    }, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused])

  const activeWorkflowStep =
    workflowSteps[activeStep] ?? workflowSteps[0]

  return (
    <section
      id="how-it-works"
      data-testid="landing-how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/20 py-20 md:py-28 lg:py-32"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            <Settings className="h-4 w-4" />
            How it works
          </Badge>
          <h2
            id="how-it-works-title"
            className="mb-6 text-4xl leading-tight font-bold text-foreground md:text-6xl"
          >
            Hiring That Runs on{' '}
            <span className="text-primary">Autopilot</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            We Analyse, You Decide.
          </p>
        </div>

        <div className="flex items-start gap-6 md:gap-8 lg:grid lg:grid-cols-[1fr_2fr] lg:items-center">
          <nav
            className="relative flex w-16 shrink-0 flex-col items-center gap-6 pr-2 lg:w-auto lg:shrink lg:items-start lg:gap-8 lg:pr-0"
            aria-label="Process steps"
          >
            <div
              className="absolute top-6 left-1/2 w-0.5 -translate-x-1/2 bg-muted lg:left-6 lg:translate-x-0"
              style={{ height: 'calc(100% - 12px)' }}
              aria-hidden="true"
            />
            {workflowSteps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                id={step.anchorId}
                onClick={() => {
                  setActiveStep(index)
                  setIsPaused(true)
                }}
                className={cn(
                  'group relative flex items-center justify-center rounded-md p-2 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:items-start lg:gap-4',
                  activeStep === index
                    ? 'opacity-100'
                    : 'opacity-60 hover:opacity-80',
                )}
                aria-current={activeStep === index ? 'step' : undefined}
              >
                <div
                  className={cn(
                    'relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300',
                    activeStep === index
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground group-hover:border-primary/70',
                  )}
                  aria-hidden="true"
                >
                  <span className="text-lg font-medium">{step.id}</span>
                </div>
                <div className="hidden pt-1.5 lg:block">
                  <h3
                    className={cn(
                      'text-lg font-semibold transition-colors duration-300',
                      activeStep === index
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </nav>

          <div className="relative min-h-[360px] min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-background p-6 shadow-sm sm:min-h-[500px]">
            <div className="grid h-full w-full items-center gap-8 p-6 md:grid-cols-2 md:p-8">
              <div className="flex flex-col justify-center">
                <h4 className="mb-4 text-2xl font-semibold">
                  {activeWorkflowStep.title}
                </h4>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  {activeWorkflowStep.subtitle}
                </p>
                <ul className="space-y-3">
                  {activeWorkflowStep.description.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden h-full items-center justify-center sm:flex">
                <img
                  src={activeWorkflowStep.image}
                  alt={activeWorkflowStep.imageAlt}
                  className="h-auto w-full max-w-[500px] rounded-lg object-contain shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2 lg:hidden">
          {workflowSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setActiveStep(index)
                setIsPaused(true)
              }}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-colors',
                activeStep === index
                  ? 'bg-primary'
                  : 'bg-muted hover:bg-primary/50',
              )}
              aria-label={`Go to step ${index + 1}`}
              aria-current={activeStep === index ? 'step' : undefined}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button
            size="lg"
            className="group gap-2 px-8 py-6 text-lg font-semibold shadow-lg"
            onClick={openBooking}
          >
            Book a Demo Now
            <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <p className="mt-6 text-lg font-semibold text-muted-foreground md:text-xl">
            Result: Hire in <span className="font-bold text-primary">7 days</span>{' '}
            instead of <span className="text-muted-foreground/60 line-through">90</span>
          </p>
        </div>
      </div>
    </section>
  )
}
