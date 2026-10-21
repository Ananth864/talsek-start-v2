const logos = [
  {
    src: '/images/quarki-logo.jpg',
    alt: 'Quarki technologies Logo',
    name: 'Quarki technologies',
  },
  {
    src: '/images/cyringe-logo.jpg',
    alt: 'Cyringe.ai Logo',
    name: 'Cyringe.ai',
  },
  {
    src: '/images/quickplans-logo.jpg',
    alt: 'QuickPlansAI Logo',
    name: 'QuickPlansAI',
  },
  {
    src: '/images/zapsight-logo.jpg',
    alt: 'Zapsight Logo',
    name: 'Zapsight',
  },
  {
    src: '/images/flowbee-logo.jpg',
    alt: 'Flowbee AI Logo',
    name: 'Flowbee AI',
  },
]

/** Logo marquee pinned to the bottom of the hero viewport. */
export function CompanyLogos() {
  return (
    <section
      aria-label="Companies using Talsek"
      data-testid="landing-company-logos"
      className="border-y bg-card/50"
    >
      <div className="mx-auto max-w-5xl px-4 py-4">
        <p className="label-mono mb-3 text-center text-muted-foreground">
          Trusted by startups
        </p>
        <div className="overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black,transparent)]">
          <div className="flex w-max animate-marketing-marquee items-center gap-[60px] hover:[animation-play-state:paused]">
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={`${logo.alt}-${i}`}
                aria-hidden={i >= logos.length}
                className="flex shrink-0 items-center gap-3 select-none"
              >
                <span className="rounded-md p-1 dark:bg-white">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                    className="pointer-events-none h-8 w-auto rounded-sm object-contain"
                  />
                </span>
                <span className="text-base font-semibold whitespace-nowrap text-foreground/80">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
