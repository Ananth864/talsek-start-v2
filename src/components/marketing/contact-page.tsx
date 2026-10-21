import { useState } from 'react'
import { ArrowRight, Check, Copy, Mail } from 'lucide-react'
import { useCalBooking } from '#/components/marketing/cal-booking-context'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'

const SUPPORT_EMAIL = 'romitrajeshshrivastava@gmail.com'

/** Public contact page: support email + Cal.com demo booking. */
export function ContactPage() {
  const { openBooking } = useCalBooking()
  const [emailCopied, setEmailCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable; mailto link still works.
    }
  }

  return (
    <main data-testid="contact-page" className="pt-24 pb-16">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="label-mono mb-4 text-primary">Get in Touch</p>
          <h1 className="mb-6 font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
            Contact <span className="text-primary">Our Team</span>
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Have questions about Talsek? We're here to help you hire in days,
            not months.
          </p>
        </div>

        <div className="mx-auto mb-12 max-w-2xl">
          <Card className="border-border bg-card/60 p-8 shadow-xl backdrop-blur-sm md:p-10">
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>

              <div>
                <h2 className="mb-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
                  Send us your questions
                </h2>
                <p className="mb-6 text-muted-foreground">
                  Drop us a line and we'll get back to you as soon as possible.
                </p>

                <div className="rounded-xl border border-border bg-muted/40 p-6">
                  <div className="flex items-center justify-center gap-3 text-lg font-semibold">
                    <Mail className="h-5 w-5 shrink-0 text-primary" />
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="transition-colors hover:text-primary"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    <button
                      type="button"
                      onClick={() => void copyEmail()}
                      className="ml-2 rounded-md p-1 transition-colors hover:bg-muted"
                      title="Copy email address"
                      aria-label="Copy email address"
                    >
                      {emailCopied ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-16 text-center">
          <Card className="relative mx-auto max-w-xl overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-8">
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Mail className="h-6 w-6 text-primary-foreground" />
              </div>

              <h3 className="font-display text-xl font-semibold tracking-tight">
                Prefer to talk?
              </h3>

              <p className="text-muted-foreground">
                Schedule a demo to see how Talsek runs your first 80% of hiring
              </p>

              <Button
                size="lg"
                data-testid="contact-book-demo"
                className="group gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl"
                onClick={openBooking}
              >
                Book A Call
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <Card className="border-border/60 bg-muted/30 p-6">
            <p className="label-mono mb-2 text-[10px] text-muted-foreground">
              Quick Response
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We typically respond to emails within 24 hours during business
              days.
            </p>
          </Card>

          <Card className="border-border/60 bg-muted/30 p-6">
            <p className="label-mono mb-2 text-[10px] text-muted-foreground">
              Demo Available
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Schedule a personalized demo to see Talsek in action for your
              team.
            </p>
          </Card>
        </div>
      </div>
    </main>
  )
}
