import { motion } from 'motion/react'
import { Quote } from 'lucide-react'

const testimonial = {
  company: 'Quarki technologies',
  logo: '/images/quarki-logo.jpg',
  name: 'Sanyam Parashar',
  role: 'Co-founder, Quarki technologies',
  review:
    "Talsek genuinely makes hiring easier. It takes away the most repetitive part of recruitment — screening — and replaces it with clear, unbiased AI evaluations that highlight the best candidates and flag concerns early.\n\nWhat I really like is how it captures candidates from email as well as forms, so no good applicant slips through. It's quick to set up, easy to use, and lets recruiters spend their time talking to the right people instead of sorting resumes.",
}

export function Testimonials() {
  return (
    <section
      aria-label="Customer testimonials"
      data-testid="landing-testimonials"
      className="border-b py-20 md:py-28"
    >
      <div className="container mx-auto px-4">
        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <Quote
            className="mx-auto mb-8 h-8 w-8 text-primary"
            aria-hidden="true"
          />
          <blockquote className="space-y-5">
            {testimonial.review.split('\n\n').map((para) => (
              <p
                key={para.slice(0, 24)}
                className="font-display text-xl font-medium leading-relaxed tracking-tight sm:text-2xl"
              >
                {para}
              </p>
            ))}
          </blockquote>
          <figcaption className="mt-10 flex items-center justify-center gap-3">
            <img
              src={testimonial.logo}
              alt=""
              className="h-10 w-10 rounded-full border object-cover"
            />
            <span className="text-left">
              <span className="block text-sm font-semibold">
                {testimonial.name}
              </span>
              <span className="label-mono block text-[10px] text-muted-foreground">
                {testimonial.role}
              </span>
            </span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  )
}
