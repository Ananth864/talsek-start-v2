import { useState } from 'react'
import {
  Brain,
  Check,
  Clock,
  Crown,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useCalBooking } from '#/components/marketing/cal-booking-context'
import { cn } from '#/lib/utils'

const featuresWithMedia = [
  {
    icon: Brain,
    title: 'Context-Aware AI Matching',
    desc: "Based on Evidence from the Candidate's Profile",
    mediaSrc: '/context-aware-ai-matching.png',
    alt: 'Context-aware AI matching illustration showing job requirements and candidate profile analysis',
    anchorId: 'resume-matching',
  },
  {
    icon: Zap,
    title: 'Automated Screening Interviews',
    desc: 'Real-Time Candidate screening and filtering',
    mediaSrc: '/automated-screening-interviews.png',
    alt: 'Automated screening interviews illustration showing AI-powered candidate evaluation process',
    anchorId: 'screening-interview',
  },
  {
    icon: Users,
    title: 'Smart Outreach',
    desc: 'Personalized messaging at scale',
    mediaSrc: '/smart-outreach.png',
    alt: 'Smart outreach illustration showing personalized automated candidate communication',
  },
]

const competitiveBenchmarkData = [
  {
    feature: 'Time to Setup',
    talsek: '5 min setup',
    traditional: '40 hrs/hire',
  },
  {
    feature: 'Time-to-Hire',
    talsek: '7 days time-to-hire',
    traditional: '90 days time-to-hire',
  },
  {
    feature: 'Interviews Required',
    talsek: 'Interview 3 candidates',
    traditional: 'Interview 20 candidates',
  },
  {
    feature: 'AI-Powered Matching',
    talsek: 'Context-aware analysis beyond keywords',
    traditional: 'Basic keyword matching only',
  },
  {
    feature: 'Resume Processing',
    talsek: 'Unlimited resume screening in real-time',
    traditional: 'Manual review bottlenecks',
  },
  {
    feature: 'Screening Accuracy',
    talsek: 'AI-powered consistent evaluation',
    traditional: 'Manual inconsistent reviews',
  },
  {
    feature: 'Candidate Outreach',
    talsek: 'AI-personalized messages at scale',
    traditional: 'Generic templates or manual writing',
  },
  {
    feature: 'Pricing Model',
    talsek: 'Need-based flexible pricing',
    traditional: '$100-$500+ per user/month',
  },
  {
    feature: 'Work-Life Balance',
    talsek: 'Set & forget automation',
    traditional: 'Nights/weekends work',
  },
]

const benefits = [
  {
    icon: Clock,
    stat: 'Real-time Results',
    desc: 'Reduce time-to-hire from weeks to days',
  },
  {
    icon: DollarSign,
    stat: 'Need-Based Pricing',
    desc: 'Cost Reduction versus traditional enterprise ATS',
  },
  {
    icon: TrendingUp,
    stat: 'Better Match Quality',
    desc: 'AI-Powered Evidence based Analysis',
  },
]

export function WhatSetsUsApart() {
  const { openBooking } = useCalBooking()
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/20 py-20 md:py-28 lg:py-32"
      data-testid="landing-differentiators"
    >
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[120rem] px-4">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            <Crown className="h-4 w-4" />
            Talsek Advantage
          </Badge>
          <h2 className="mb-6 text-3xl leading-tight font-bold text-foreground sm:text-4xl md:text-6xl">
            What Sets <span className="text-primary">Us Apart</span>
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
            Discover how AI-powered recruitment transforms your hiring process
            with cutting-edge features, proven benefits, and unmatched
            competitive advantages.
          </p>
        </div>

        <Tabs defaultValue="features" className="mt-8 flex flex-col items-center">
          <TabsList className="inline-flex h-auto w-auto flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card/50 p-2 backdrop-blur-sm md:gap-6">
            <TabsTrigger
              value="features"
              className="rounded-xl px-4 py-3 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground md:px-5 md:py-3.5 md:text-sm"
            >
              <Brain className="mr-1.5 hidden h-4 w-4 sm:inline-flex" />
              Features
            </TabsTrigger>
            <TabsTrigger
              value="benefits"
              className="rounded-xl px-4 py-3 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground md:px-5 md:py-3.5 md:text-sm"
            >
              <Target className="mr-1.5 hidden h-4 w-4 sm:inline-flex" />
              Benefits
            </TabsTrigger>
            <TabsTrigger
              value="competitive"
              className="rounded-xl px-4 py-3 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground md:px-5 md:py-3.5 md:text-sm"
            >
              <Crown className="mr-1.5 hidden h-4 w-4 sm:inline-flex" />
              Competitive Benchmark
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 w-full max-w-[95rem] rounded-3xl border border-border/50 bg-card/70 p-6 shadow-2xl backdrop-blur-sm md:p-8 lg:p-16">
            <TabsContent
              value="features"
              className="grid place-items-center gap-16 lg:grid-cols-2 lg:gap-12"
            >
              <div className="flex flex-col gap-6">
                <Badge
                  variant="outline"
                  className="w-fit border-primary/30 bg-background text-xs sm:text-sm"
                >
                  AI-Powered Technology
                </Badge>
                <h3 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-5xl">
                  Advanced Features That Drive Results
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
                  Our AI-powered platform goes beyond traditional recruitment
                  with context-aware matching, intelligent screening, and
                  automated workflows that save time while improving quality.
                </p>

                <div className="mt-4 grid gap-4">
                  {featuresWithMedia.map((feature, index) => (
                    <button
                      key={feature.title}
                      type="button"
                      id={feature.anchorId}
                      className={cn(
                        'flex items-start gap-3 rounded-lg p-3 text-left transition-all duration-200',
                        activeMediaIndex === index
                          ? 'border border-primary/30 bg-primary/10 shadow-sm'
                          : 'hover:bg-primary/5',
                      )}
                      onClick={() => setActiveMediaIndex(index)}
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                        <feature.icon className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4
                          className={cn(
                            'font-medium transition-colors duration-200',
                            activeMediaIndex === index
                              ? 'text-primary'
                              : 'text-foreground',
                          )}
                        >
                          {feature.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {feature.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  className="mt-4 w-fit gap-2"
                  size="lg"
                  onClick={openBooking}
                >
                  Get in Touch Now!
                </Button>
              </div>

              <div className="relative w-full">
                <div className="h-[500px] w-full overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary">
                  <img
                    src={featuresWithMedia[activeMediaIndex]?.mediaSrc ?? ''}
                    alt={featuresWithMedia[activeMediaIndex]?.alt ?? ''}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="benefits"
              className="grid place-items-center gap-16 lg:grid-cols-2 lg:gap-12"
            >
              <div className="flex flex-col gap-6">
                <Badge
                  variant="outline"
                  className="w-fit border-primary/30 bg-background text-xs sm:text-sm"
                >
                  Proven Results
                </Badge>
                <h3 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-5xl">
                  Measurable Benefits for Your Business
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
                  Transform your hiring process with quantifiable improvements
                  in speed, cost-efficiency, and candidate quality that directly
                  impact your bottom line.
                </p>

                <div className="mt-4 grid gap-6 text-sm sm:text-base">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.stat}
                      className="flex items-center gap-4 rounded-xl border border-border/50 bg-background/50 p-3 sm:p-4"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary sm:h-12 sm:w-12">
                        <benefit.icon className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-foreground">
                          {benefit.stat}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {benefit.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <h4 className="mt-6 text-left text-xl font-bold text-foreground sm:text-2xl">
                  We Analyze, You Decide!
                </h4>

                <Button
                  className="mt-4 w-fit gap-2"
                  size="lg"
                  onClick={openBooking}
                >
                  Get in Touch Now!
                </Button>
              </div>

              <div className="relative h-full">
                <div className="h-full overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary">
                  <img
                    src="/benefits-illustration.png"
                    alt="Benefits and measurable results dashboard showing improved hiring metrics and ROI"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="competitive" className="w-full">
              <div className="mb-8 flex flex-col gap-6">
                <Badge
                  variant="outline"
                  className="mx-auto w-fit border-primary/30 bg-background text-xs sm:text-sm"
                >
                  Competitive Analysis
                </Badge>
                <h3 className="text-center text-2xl font-semibold text-foreground sm:text-3xl lg:text-5xl">
                  Why Choose Talsek?
                </h3>
                <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
                  See how Talsek outperforms traditional hiring methods across
                  key metrics that matter most to growing businesses.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                <div className="grid grid-cols-3 border-b border-border bg-muted/40">
                  <div className="p-4 text-center">
                    <h4 className="text-xs font-semibold text-muted-foreground sm:text-sm">
                      Features
                    </h4>
                  </div>
                  <div className="border-x border-border bg-primary/5 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                        <Crown className="h-3 w-3 text-primary-foreground" />
                      </div>
                      <h4 className="text-sm font-bold text-primary sm:text-lg">
                        Talsek
                      </h4>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <h4 className="text-xs font-semibold text-muted-foreground sm:text-sm">
                      Traditional Hiring
                    </h4>
                  </div>
                </div>

                {competitiveBenchmarkData.map((item, index) => (
                  <div
                    key={item.feature}
                    className={cn(
                      'grid grid-cols-3 border-b border-border transition-colors hover:bg-muted/40',
                      index % 2 === 0 ? 'bg-card' : 'bg-muted/20',
                    )}
                  >
                    <div className="flex items-center p-4">
                      <span className="text-xs font-medium text-foreground sm:text-sm">
                        {item.feature}
                      </span>
                    </div>
                    <div className="border-x border-border bg-primary/5 p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <span className="text-xs font-medium text-foreground sm:text-sm">
                          {item.talsek}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-destructive">
                          <X className="h-3 w-3 text-destructive-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground sm:text-sm">
                          {item.traditional}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Button
                  className="gap-2 px-8 py-3 text-lg"
                  size="lg"
                  onClick={openBooking}
                >
                  Get in Touch Now!
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  )
}
