import { HelpCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { useCalBooking } from '#/components/marketing/cal-booking-context'

const faqs = [
  {
    id: 'pricing',
    question: 'How does your pricing compare to traditional ATS systems?',
    answer:
      "Unlike traditional ATS systems that charge $100-500+ per user monthly for bloated features you'll never use, we build custom plans based on your hiring volume and needs. Most startups hiring 5-10 people/year pay less than one recruiter's commission on a single hire.",
  },
  {
    id: 'setup',
    question: 'How quickly can we get started with Talsek?',
    answer:
      'You can be up and running in under 5 minutes. Simply create your Job posting, customize your Form Config, and share your unique link. Our AI starts processing candidates immediately - no complex integrations or lengthy setup processes required.',
  },
  {
    id: 'ai-accuracy',
    question: 'How accurate is your AI candidate matching?',
    answer:
      'Our AI goes beyond simple keyword matching to understand context, skills, and cultural fit. We achieve 95%+ accuracy in candidate ranking by analyzing resumes holistically, considering experience relevance, skill progression, and job requirements alignment - not just keyword density.',
  },
  {
    id: 'integrations',
    question: 'Is Talsek compatible with all Job Boards?',
    answer:
      'Yes! We integrate seamlessly with popular Job Boards. Any Apply button across platforms can be easily configured with our links, and we go beyond the traditional applications with Email Applications and their Evaluations giving our Clients complete autonomy to receive applications the way they want.',
  },
  {
    id: 'candidate-experience',
    question: "What's the candidate application experience like?",
    answer:
      "We've designed a mobile-first, intuitive application process that takes candidates under 2 minutes to complete. Our smart forms adapt based on job requirements, and candidates receive instant confirmation with clear next steps, leading to higher completion rates.",
  },
]

export function FAQs() {
  const { openBooking } = useCalBooking()

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/20 pt-10 pb-20 md:pb-28 lg:pb-32"
      data-testid="landing-faqs"
    >
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            <HelpCircle className="h-4 w-4" />
            Support
          </Badge>
          <h2 className="mb-6 text-4xl leading-tight font-bold text-foreground md:text-6xl">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            Everything you need to know about Talsek.
          </p>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border border-border/50 bg-card/50 p-6 shadow-xl backdrop-blur-sm md:p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-b border-border/50"
              >
                <AccordionTrigger className="group py-6 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-muted-foreground">Still have questions?</p>
          <Button
            size="lg"
            className="rounded-xl px-6 py-3 font-medium"
            onClick={openBooking}
          >
            Contact Our Team
          </Button>
        </div>
      </div>
    </section>
  )
}
