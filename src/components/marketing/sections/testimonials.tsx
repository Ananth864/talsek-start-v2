import { MessageSquare } from 'lucide-react'
import { Badge } from '#/components/ui/badge'

const testimonial = {
  company: 'Quarki technologies',
  logo: '/images/quarki-logo.jpg',
  name: 'Sanyam Parashar',
  role: 'Co-founder, Quarki technologies',
  review:
    'Talsek genuinely makes hiring easier. It takes away the most repetitive part of recruitment screening and replaces it with clear, unbiased AI evaluations that highlight the best candidates and flag concerns early.\n\nWhat I really like is how it captures candidates from email as well as forms, so no good applicant slips through. It’s quick to set up, easy to use, and lets recruiters spend their time talking to the right people instead of sorting resumes.',
}

export function Testimonials() {
  return (
    <section
      className="bg-background pt-20 pb-10 md:pt-28 lg:pt-32"
      data-testid="landing-testimonials"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Badge
            variant="outline"
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            <MessageSquare className="h-4 w-4" />
            Honest Testimonials
          </Badge>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Trusted by Industry <span className="text-primary">Leaders</span>
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
              See what our customers have to say about us.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-16 flex max-w-screen-xl flex-col items-center px-4 lg:px-8">
          <div className="relative mb-7 flex h-12 w-48 items-center justify-center">
            <img
              src={testimonial.logo}
              alt={`${testimonial.company} logo`}
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
          <p className="max-w-3xl text-center text-xl leading-relaxed text-balance whitespace-pre-line text-foreground sm:text-2xl">
            {testimonial.review}
          </p>
          <div className="mt-8 flex flex-col items-center">
            <div className="relative mb-4 flex size-14 items-center justify-center overflow-hidden rounded-full border-2 border-primary/10 bg-primary/10 text-lg font-bold text-primary shadow-sm">
              {testimonial.name.charAt(0)}
            </div>
            <h5 className="text-lg font-semibold text-foreground">
              {testimonial.name}
            </h5>
            <p className="mt-1 font-medium text-muted-foreground">
              {testimonial.role}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
