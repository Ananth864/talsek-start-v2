import { Link } from '@tanstack/react-router'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'

const faqs = [
  {
    id: 'pricing',
    question: 'How does pricing compare to traditional ATS systems?',
    answer:
      "Traditional ATS systems charge $100–500+ per user monthly for features you'll never use. We build custom plans based on your hiring volume — most startups hiring 5–10 people a year pay less than one recruiter's commission on a single hire.",
  },
  {
    id: 'setup',
    question: 'How quickly can we get started?',
    answer:
      'Under 5 minutes. Create your job posting, customise your application form, and share your unique link. Talsek starts processing candidates immediately — no integrations, no lengthy setup.',
  },
  {
    id: 'ai-accuracy',
    question: 'How accurate is the candidate matching?',
    answer:
      'Our AI goes beyond keyword matching to understand context, skills, and fit. By analysing resumes holistically — experience relevance, skill progression, requirement alignment — we reach 95%+ accuracy in candidate ranking.',
  },
  {
    id: 'integrations',
    question: 'Does Talsek work with all job boards?',
    answer:
      'Yes. Any Apply button across job boards can point to your Talsek link, and we also accept applications by email with full evaluations — so candidates reach you however they apply.',
  },
  {
    id: 'candidate-experience',
    question: "What's the candidate experience like?",
    answer:
      'A mobile-first application that takes under 2 minutes. Smart forms adapt to the role, and candidates get instant confirmation with clear next steps — which means higher completion rates.',
  },
]

export function FAQs() {
  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      data-testid="landing-faqs"
      className="border-b py-20 md:py-28"
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          {/* Header column */}
          <div>
            <p className="label-mono mb-4 text-primary">FAQ</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about Talsek. Still curious?{' '}
              <Link
                to="/contact"
                className="font-medium text-primary hover:underline"
              >
                Talk to us
              </Link>
              .
            </p>
          </div>

          {/* Accordion column */}
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-border/70"
              >
                <AccordionTrigger className="group text-left hover:no-underline">
                  <span className="text-base font-semibold transition-colors group-hover:text-primary">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
