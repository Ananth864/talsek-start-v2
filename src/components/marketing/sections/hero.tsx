import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'
import { PipelineVisual } from '#/components/marketing/sections/pipeline-visual'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

/** Landing hero: copy left, live pipeline preview right. */
export function Hero() {
  const { openBooking } = useCalBooking()

  return (
    <section
      id="home"
      aria-label="Hero section"
      data-testid="landing-hero"
      className="relative flex w-full flex-1 items-center overflow-hidden"
    >
      {/* Single restrained glow behind the pipeline */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/4 right-[-10%] h-[560px] w-[560px] rounded-full bg-primary/[0.05] blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
          {/* Copy */}
          <div className="flex min-w-0 max-w-2xl flex-col items-start gap-7">
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="label-mono text-primary"
            >
              AI-Powered Recruitment
            </motion.p>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
              className="font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-[3.4rem]"
            >
              AI hiring engine for{' '}
              <span className="text-primary">startups</span>. First{' '}
              <span className="text-primary">80%</span> of hiring, automated.
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
              className="text-lg leading-relaxed text-muted-foreground"
            >
              Talsek scans thousands of resumes simultaneously, conducts AI
              screening interviews, and ranks candidates — so you only interview
              the best.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.24, ease: 'easeOut' }}
              className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
            >
              <Button
                size="lg"
                data-testid="hero-book-demo"
                className="group gap-2 rounded-xl px-7 font-semibold shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/25"
                onClick={openBooking}
              >
                See how it works
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="rounded-xl font-semibold text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link to="/pricing">View pricing</Link>
              </Button>
            </motion.div>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.32, ease: 'easeOut' }}
              className="label-mono text-[11px] text-muted-foreground"
            >
              Trusted by startups · 5-minute setup
            </motion.p>
          </div>

          {/* Live pipeline */}
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            <PipelineVisual />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
