import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'

const testimonial = {
  company: 'Quarki technologies',
  logo: '/images/quarki-logo.jpg',
  name: 'Sanyam Parashar',
  role: 'Co-founder, Quarki technologies',
  excerpt:
    "It's quick to set up, easy to use, and lets recruiters spend their time talking to the right people instead of sorting resumes.",
  review:
    "Talsek genuinely makes hiring easier. It takes away the most repetitive part of recruitment — screening — and replaces it with clear, unbiased AI evaluations that highlight the best candidates and flag concerns early.\n\nWhat I really like is how it captures candidates from email as well as forms, so no good applicant slips through. It's quick to set up, easy to use, and lets recruiters spend their time talking to the right people instead of sorting resumes.",
}

/** Quote column within the shared customer story and FAQ chapter. */
export function Testimonials() {
  return (
    <figure
      aria-label="Customer testimonial"
      data-testid="landing-testimonials"
      className="min-w-0 border-t-2 border-primary pt-6"
    >
      <p className="label-mono mb-5 text-muted-foreground">
        From a recruiting team
      </p>
      <blockquote className="font-display text-2xl leading-snug font-medium tracking-tight sm:text-3xl">
        <p>{testimonial.excerpt}</p>
      </blockquote>
      <Accordion type="single" collapsible className="mt-5">
        <AccordionItem value="full-review">
          <AccordionTrigger className="justify-start text-sm text-primary hover:no-underline">
            Read the full testimonial
          </AccordionTrigger>
          <AccordionContent className="space-y-4 leading-relaxed text-muted-foreground">
            {testimonial.review.split('\n\n').map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <figcaption className="mt-6 flex items-center gap-3">
        <img
          src={testimonial.logo}
          alt={`${testimonial.company} logo`}
          className="h-11 w-11 rounded-lg border object-cover"
          loading="lazy"
        />
        <span>
          <span className="block text-sm font-semibold">
            {testimonial.name}
          </span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {testimonial.role}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}
