import { Link } from '@tanstack/react-router'
import { Testimonials } from '#/components/marketing/sections/testimonials'
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
      aria-labelledby="getting-started-title"
      data-testid="landing-faqs"
      className="landing-scene border-b"
    >
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label-mono mb-3 text-primary">
              A customer story & your questions
            </p>
            <h2
              id="getting-started-title"
              className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Before you get started
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Have another question?{' '}
            <Link
              to="/contact"
              className="font-medium text-primary hover:underline"
            >
              Talk to us
            </Link>
            .
          </p>
        </div>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <Testimonials />
          <Accordion
            type="single"
            collapsible
            defaultValue="setup"
            className="w-full min-w-0 border-t"
          >
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
