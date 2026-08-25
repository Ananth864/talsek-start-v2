import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '#/lib/utils'

type RequirementCheck = {
  req: string
  met: boolean
  evidence: string
  source: string
}

type Candidate = {
  name: string
  initials: string
  tag: string
  score: number
  shortlisted: boolean
  profile: {
    current: string
    location: string
    email: string
    experience: string
    source: string
    analysis: RequirementCheck[]
    strengths: string[]
    concerns: string[]
    verdict: string
  }
}

const FEED: Candidate[] = [
  {
    name: 'Priya Sharma',
    initials: 'PS',
    tag: 'React · 6 yrs',
    score: 94,
    shortlisted: true,
    profile: {
      current: 'SDE II at Razorpay',
      location: 'Bengaluru',
      email: 'priya.sharma@…',
      experience: '6 yrs',
      source: 'LinkedIn',
      analysis: [
        {
          req: '5+ yrs React',
          met: true,
          evidence: 'Led migration of 40+ components to React 18',
          source: 'Resume, p.1',
        },
        {
          req: 'TypeScript',
          met: true,
          evidence: 'Shipped TS strict-mode design system at Razorpay',
          source: 'Resume, p.2',
        },
        {
          req: 'Startup experience',
          met: true,
          evidence: 'Early engineer at Series-A fintech (2020–22)',
          source: 'Resume, p.1',
        },
      ],
      strengths: [
        'Owned end-to-end frontend migrations',
        'Design-system and tooling experience',
      ],
      concerns: ['No direct team management on resume'],
      verdict:
        'Strong senior-level fit. Evidence of ownership matches every requirement — interview recommended.',
    },
  },
  {
    name: 'Daniel Okafor',
    initials: 'DO',
    tag: 'Vue · 3 yrs',
    score: 61,
    shortlisted: false,
    profile: {
      current: 'Frontend Dev at Flutterwave',
      location: 'Lagos (relocating)',
      email: 'd.okafor@…',
      experience: '3 yrs',
      source: 'Job board',
      analysis: [
        {
          req: '5+ yrs React',
          met: false,
          evidence: '3 yrs total experience, primarily Vue 3',
          source: 'Resume, p.1',
        },
        {
          req: 'TypeScript',
          met: true,
          evidence: 'Daily TS in Vue codebase since 2023',
          source: 'Resume, p.2',
        },
        {
          req: 'Startup experience',
          met: true,
          evidence: 'Fintech scale-up, payments team',
          source: 'Resume, p.1',
        },
      ],
      strengths: ['Strong payments-domain knowledge'],
      concerns: [
        'React experience is peripheral — mostly Vue',
        'Below the 5-year experience bar',
      ],
      verdict:
        'Solid engineer, but does not meet the core React requirement. Not shortlisted for this role.',
    },
  },
  {
    name: 'Mei Lin',
    initials: 'ML',
    tag: 'React · TS · 8 yrs',
    score: 91,
    shortlisted: true,
    profile: {
      current: 'Staff Engineer at Grab',
      location: 'Singapore (open to remote)',
      email: 'mei.lin@…',
      experience: '8 yrs',
      source: 'Email application',
      analysis: [
        {
          req: '5+ yrs React',
          met: true,
          evidence: '8 yrs React; led web-platform guild at Grab',
          source: 'Resume, p.1',
        },
        {
          req: 'TypeScript',
          met: true,
          evidence: 'Migrated Grab merchant dashboard to strict TS',
          source: 'Resume, p.2',
        },
        {
          req: 'Startup experience',
          met: false,
          evidence: 'Career at scale-ups 500+ engineers; no early-stage',
          source: 'Resume, p.1',
        },
      ],
      strengths: [
        'Deep platform and performance expertise',
        'Has mentored 5+ engineers',
      ],
      concerns: ['No early-stage startup tenure'],
      verdict:
        'Excellent technical fit with one soft miss on startup background. Interview recommended.',
    },
  },
  {
    name: 'Aisha Bello',
    initials: 'AB',
    tag: 'React · Node · 4 yrs',
    score: 87,
    shortlisted: true,
    profile: {
      current: 'Senior FE at Paystack',
      location: 'Remote · GMT+1',
      email: 'aisha.bello@…',
      experience: '4 yrs',
      source: 'Job board',
      analysis: [
        {
          req: '5+ yrs React',
          met: true,
          evidence: '4 yrs professional + 1.5 yrs freelance React work',
          source: 'Resume, p.1',
        },
        {
          req: 'TypeScript',
          met: true,
          evidence: 'TS across Paystack checkout rewrite',
          source: 'Resume, p.2',
        },
        {
          req: 'Startup experience',
          met: true,
          evidence: 'High-growth fintech since 2022',
          source: 'Resume, p.1',
        },
      ],
      strengths: [
        'Checkout/payments UI specialist',
        'Fast ramp — two promotions in 4 yrs',
      ],
      concerns: ['Slightly under the experience bar on paper'],
      verdict:
        'Meets the spirit of every requirement with strong evidence. Interview recommended.',
    },
  },
]

const HOLD_TICKS = 3
// Highest-scoring shortlisted candidate — derived so FEED can be reordered freely
const TOP_CANDIDATE_INDEX = FEED.reduce(
  (best, c, i) =>
    c.shortlisted && (!FEED[best].shortlisted || c.score > FEED[best].score)
      ? i
      : best,
  0,
)

export function PipelineVisual() {
  const reduced = useReducedMotion()
  const [scan, setScan] = useState(reduced ? FEED.length : -1)
  const [selected, setSelected] = useState<number | null>(null)
  const [autoOpened, setAutoOpened] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  // Only auto-open the profile demo when the card is actually on screen —
  // never yank the page around while the visitor is reading something else.
  useEffect(() => {
    const el = cardRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0.35 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => {
      setScan((s) => {
        if (selected !== null) return s // paused while a profile is open
        return s >= FEED.length + HOLD_TICKS ? -1 : s + 1
      })
    }, 1300)
    return () => clearInterval(id)
  }, [reduced, selected])

  // As part of the animation: once every resume is scored, open the top
  // candidate's extracted profile — but only if the card is on screen.
  // Off-screen cycles skip the demo and retry on the next loop.
  useEffect(() => {
    if (reduced) return
    if (scan === FEED.length && !autoOpened && selected === null && inView) {
      setSelected(TOP_CANDIDATE_INDEX)
      setAutoOpened(true)
    }
    if (scan === -1 && autoOpened) {
      setAutoOpened(false)
    }
  }, [scan, selected, autoOpened, inView, reduced])

  // Auto-close the self-opened profile after a beat, then let the loop resume.
  useEffect(() => {
    if (selected === null || !autoOpened || reduced) return
    const t = setTimeout(() => {
      setSelected(null)
      setScan(FEED.length + 1)
    }, 5200)
    return () => clearTimeout(t)
  }, [selected, autoOpened, reduced])

  const revealed = (i: number) => scan > i
  const scanning = (i: number) => scan === i && selected === null
  const shortlist = FEED.filter((c, i) => c.shortlisted && revealed(i)).sort(
    (a, b) => b.score - a.score,
  )

  return (
    <div className="relative w-full">
      <div
        ref={cardRef}
        className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-foreground/[0.06]"
      >
        {/* Console header */}
        <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3">
          <span className="label-mono text-muted-foreground">
            Talsek · Pipeline preview
          </span>
          <span className="label-mono text-muted-foreground">
            Screening → Shortlist
          </span>
        </div>

        <motion.div>
          {/* Role bar */}
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold">Senior Frontend Engineer</p>
              <p className="label-mono mt-0.5 text-muted-foreground">
                Bengaluru · Full-time
              </p>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              128 applicants
            </span>
          </div>

          <div className="grid sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] sm:divide-x">
            {/* Incoming resumes */}
            <div className="p-4 sm:p-5">
              <p className="label-mono mb-3 text-muted-foreground">Incoming</p>
              <ul className="space-y-2">
                {FEED.map((c, i) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(i)
                        setAutoOpened(false) // manual open — disable auto-close
                      }}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors duration-500',
                        'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        scanning(i) && 'border-primary/50 bg-primary/[0.06]',
                        revealed(i) &&
                          !scanning(i) &&
                          'border-transparent bg-muted/40 hover:bg-muted/70',
                        !revealed(i) && 'border-border/60 hover:bg-muted/40',
                      )}
                      aria-label={`View extracted profile for ${c.name}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                        {c.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium leading-tight">
                          {c.name}
                        </span>
                        <span className="label-mono block truncate text-[10px] text-muted-foreground">
                          {c.tag}
                        </span>
                      </span>
                      {/* Fixed-width slot keeps rows from shifting while scoring */}
                      <span className="flex w-[5.5rem] shrink-0 items-center justify-end gap-1">
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                        <AnimatePresence mode="wait">
                          {scanning(i) && (
                            <motion.span
                              key="scanning"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="label-mono text-[10px] text-primary"
                            >
                              scoring…
                            </motion.span>
                          )}
                          {revealed(i) && !scanning(i) && (
                            <motion.span
                              key={c.score}
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 26,
                              }}
                              className={cn(
                                'flex items-center justify-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold',
                                c.shortlisted
                                  ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground',
                              )}
                            >
                              {c.shortlisted ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {c.score}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shortlist */}
            <div className="border-t p-4 sm:border-t-0 sm:p-5">
              <p className="label-mono mb-3 text-muted-foreground">Shortlist</p>
              <div className="flex min-h-[220px] flex-col gap-2">
                <AnimatePresence mode="popLayout">
                  {shortlist.length === 0 && (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="my-auto text-center text-sm text-muted-foreground"
                    >
                      Scanning applications…
                    </motion.p>
                  )}
                  {shortlist.map((c, rank) => (
                    <motion.button
                      key={c.name}
                      layout
                      type="button"
                      onClick={() => {
                        setSelected(FEED.findIndex((f) => f.name === c.name))
                        setAutoOpened(false) // manual open — disable auto-close
                      }}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 28,
                      }}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`View extracted profile for ${c.name}`}
                    >
                      <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        #{rank + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium leading-tight">
                          {c.name}
                        </span>
                        <span className="label-mono block truncate text-[10px] text-muted-foreground">
                          Recommended
                        </span>
                      </span>
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {c.score}
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/40 px-5 py-2.5">
            <p className="label-mono text-[10px] text-muted-foreground">
              Evidence-based scoring · Context-aware · No keyword matching
            </p>
          </div>
        </motion.div>

        {/* Extracted profile overlay */}
        <AnimatePresence>
          {selected !== null && (
            <CandidateProfile
              candidate={FEED[selected]}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function CandidateProfile({
  candidate,
  onClose,
}: {
  candidate: Candidate
  onClose: () => void
}) {
  const { profile } = candidate
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrollHintVisible, setScrollHintVisible] = useState(true)

  const handleBodyScroll = () => {
    const el = bodyRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setScrollHintVisible(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute inset-0 z-10 flex flex-col bg-card"
      role="dialog"
      aria-label={`Extracted profile for ${candidate.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to pipeline
        </button>
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold',
            candidate.shortlisted
              ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {candidate.score}/100
        </span>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        onScroll={handleBodyScroll}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {/* Identity */}
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {candidate.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{candidate.name}</p>
            <p className="label-mono truncate text-[10px] text-muted-foreground">
              {profile.source}
            </p>
          </div>
        </div>

        {/* Extracted fields */}
        <div>
          <p className="label-mono mb-2 text-[9px] text-muted-foreground">
            Extracted
          </p>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border px-3 py-3 text-xs sm:grid-cols-2">
            {[
              ['Experience', profile.experience],
              ['Location', profile.location],
              ['Current', profile.current],
              ['Email', profile.email],
            ].map(([label, value]) => (
              <div key={label} className="flex min-w-0 items-baseline gap-2">
                <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
                <dd className="truncate font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Requirement analysis */}
        <div>
          <p className="label-mono mb-2 text-[9px] text-muted-foreground">
            Requirement analysis
          </p>
          <ul className="space-y-1.5">
            {profile.analysis.map((a) => (
              <li key={a.req} className="rounded-xl border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                      a.met
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {a.met ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <X className="h-2.5 w-2.5" />
                    )}
                  </span>
                  <span className="flex-1 text-xs font-medium">{a.req}</span>
                  <span className="label-mono text-[8px] text-muted-foreground">
                    {a.source}
                  </span>
                </div>
                <p className="mt-1 pl-6 text-[11px] leading-relaxed text-muted-foreground">
                  “{a.evidence}”
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Strengths & concerns */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border px-3 py-2.5">
            <p className="label-mono mb-1.5 flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" /> Key strengths
            </p>
            <ul className="space-y-1">
              {profile.strengths.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500/60" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border px-3 py-2.5">
            <p className="label-mono mb-1.5 flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Concerns
            </p>
            <ul className="space-y-1">
              {profile.concerns.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/60" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Verdict */}
        <div
          className={cn(
            'rounded-xl border px-3 py-2.5',
            candidate.shortlisted
              ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
              : 'border-border bg-muted/40',
          )}
        >
          <p className="label-mono mb-1 text-[9px] text-muted-foreground">
            AI verdict
          </p>
          <p className="text-xs leading-relaxed">{profile.verdict}</p>
        </div>
      </div>

      {/* Scroll hint — fades out once the bottom is reached */}
      <AnimatePresence>
        {scrollHintVisible && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
            exit={{ opacity: 0, y: 6 }}
            className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center"
            aria-hidden="true"
          >
            <span className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/40">
              <span className="text-[11px] font-semibold">
                Scroll for details
              </span>
              <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
