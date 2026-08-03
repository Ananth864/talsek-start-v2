import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Copy,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react'
import { useCalBooking } from '#/components/marketing/cal-booking-context'
import { Badge } from '#/components/ui/badge'
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
    <main
      data-testid="contact-page"
      className="bg-gradient-to-b from-background to-secondary/20 pt-24 pb-16"
    >
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            Get in Touch
          </Badge>

          <h1 className="mb-6 text-4xl leading-tight font-bold text-foreground md:text-6xl">
            Contact <span className="text-primary">Our Team</span>
          </h1>

          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            Have questions about Talsek? We&apos;re here to help you transform
            your hiring process.
          </p>
        </div>

        <div className="mx-auto mb-12 max-w-2xl">
          <Card className="border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm md:p-10">
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>

              <div>
                <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
                  Send us your questions
                </h2>
                <p className="mb-6 text-muted-foreground">
                  Drop us a line and we&apos;ll get back to you as soon as
                  possible.
                </p>

                <div className="rounded-lg border border-border bg-muted/50 p-6">
                  <div className="flex items-center justify-center gap-3 text-lg font-semibold text-foreground">
                    <Mail className="h-5 w-5 text-primary" />
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
                        <Check className="h-4 w-4 text-green-600" />
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
          <Card className="mx-auto max-w-xl border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-8">
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>

              <h3 className="text-xl font-semibold text-foreground">
                Prefer to talk?
              </h3>

              <p className="text-muted-foreground">
                Schedule a demo to see how Talsek can transform your hiring
                process
              </p>

              <Button
                size="lg"
                className="group gap-2 font-semibold shadow-lg hover:shadow-xl"
                onClick={openBooking}
                data-testid="contact-book-demo"
              >
                Book A Call
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <Card className="border-border/30 bg-card/30 p-6 backdrop-blur-sm">
            <h4 className="mb-2 font-semibold text-foreground">
              Quick Response
            </h4>
            <p className="text-sm text-muted-foreground">
              We typically respond to emails within 24 hours during business
              days.
            </p>
          </Card>

          <Card className="border-border/30 bg-card/30 p-6 backdrop-blur-sm">
            <h4 className="mb-2 font-semibold text-foreground">
              Demo Available
            </h4>
            <p className="text-sm text-muted-foreground">
              Schedule a personalized demo to see Talsek in action for your
              team.
            </p>
          </Card>
        </div>
      </div>
    </main>
  )
}
