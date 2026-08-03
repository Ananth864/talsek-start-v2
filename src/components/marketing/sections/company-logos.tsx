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

export function CompanyLogos() {
  const track = [...logos, ...logos]

  return (
    <div
      className="w-full bg-muted/30 pt-2 pb-10"
      data-testid="landing-company-logos"
    >
      <section className="relative mx-auto max-w-3xl">
        <h2 className="mb-5 text-center text-xl font-medium tracking-tight text-foreground md:text-3xl">
          <span className="text-muted-foreground">Trusted by experts.</span>
          <br />
          <span className="font-semibold text-primary">Used by the Leaders.</span>
        </h2>

        <div className="overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black,transparent)]">
          <div className="animate-marketing-marquee flex w-max gap-16">
            {track.map((logo, index) => (
              <div
                key={`${logo.alt}-${index}`}
                className="flex select-none items-center gap-3"
              >
                <img
                  alt={logo.alt}
                  className="pointer-events-none h-10 w-auto object-contain md:h-12"
                  loading="lazy"
                  src={logo.src}
                />
                <span className="whitespace-nowrap text-xl font-semibold text-foreground/80">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
