import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileSearch,
  Send,
  Video,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

const features = [
  {
    icon: FileSearch,
    title: 'AI-Powered Matching',
    description:
      'Context-aware resume analysis that goes beyond keywords to understand true candidate potential',
  },
  {
    icon: Video,
    title: 'AI Screening Interviews',
    description:
      'Automated screening interviews with your custom questions, flagging concerns and ranking candidates',
  },
  {
    icon: Send,
    title: 'Automated Outreach',
    description:
      'Send personalized outreach to 50 candidates in 5 minutes - you write once, we customize for all',
  },
]

/** Post-booking thank-you page (Cal.com success redirect). */
export function ThankYouPage() {
  return (
    <main
      id="main-content"
      data-testid="thank-you-page"
      className="bg-gradient-to-b from-background to-secondary/20 pt-24 pb-16"
    >
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
            Thank You!
          </h1>

          <p className="mb-6 text-lg text-muted-foreground md:text-xl">
            Your call has been successfully booked. We&apos;re excited to show
            you how Talsek can transform your hiring process!
          </p>

          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              A confirmation email has been sent to your inbox
            </span>
          </div>
        </div>

        <div className="mx-auto mb-20 max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
              Get a Preview: Platform Walkthrough
            </h2>
            <p className="text-lg text-muted-foreground">
              Watch this quick demo to see how Talsek streamlines your entire
              hiring process
            </p>
          </div>

          <div
            className="relative w-full overflow-hidden rounded-xl bg-gray-900 shadow-2xl"
            style={{ paddingBottom: '56.25%' }}
          >
            <iframe
              className="absolute top-0 left-0 h-full w-full"
              src="https://www.youtube.com/embed/ExHv19bzUAk"
              title="Talsek Platform Walkthrough"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            See how companies are hiring in 7 days instead of 90 with AI-powered
            recruitment
          </p>
        </div>

        <div className="mx-auto mb-16 max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Why Talsek?
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              We&apos;re transforming recruitment with AI that thinks like a
              human recruiter, helping you find the perfect candidates beyond
              keyword matching.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mb-16 max-w-4xl">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-10">
            <h3 className="mb-6 text-center text-2xl font-bold text-foreground md:text-3xl">
              What to Expect
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  1
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">
                    Before the Call
                  </h4>
                  <p className="text-muted-foreground">
                    Watch the demo video above to familiarize yourself with our
                    platform
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  2
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">
                    During the Call
                  </h4>
                  <p className="text-muted-foreground">
                    We&apos;ll discuss your specific hiring needs and show you
                    how Talsek can help
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  3
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">
                    After the Call
                  </h4>
                  <p className="text-muted-foreground">
                    Receive a custom pricing plan tailored to your hiring volume
                    and requirements
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="mb-6 text-muted-foreground">
            Want to learn more in the meantime?
          </p>
          <Button
            size="lg"
            className="group gap-2 font-semibold shadow-lg hover:shadow-xl"
            asChild
          >
            <Link to="/">
              Explore Our Platform
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
