import { Check, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { cn } from '#/lib/utils'

export type PricingFeature = {
  text: string
  hasInfo?: boolean
}

export type PricingTier = {
  name: string
  description: string
  price?: number
  priceLabel?: string
  billingPeriod?: string
  buttonText: string
  isPrimary?: boolean
  badge?: string
  features: PricingFeature[]
  featuresTitle?: string
  onButtonClick?: () => void
}

export type PricingTableProps = {
  icon?: ReactNode
  title: string
  subtitle: string
  tiers: PricingTier[]
  footerTitle?: string
  footerDescription?: string
  footerButtonText?: string
  onFooterButtonClick?: () => void
  className?: string
}

/** Three-tier marketing pricing table (Pay as you go / Tier 1 / Enterprise). */
export function PricingTable({
  icon,
  title,
  subtitle,
  tiers,
  footerTitle,
  footerDescription,
  footerButtonText,
  onFooterButtonClick,
  className,
}: PricingTableProps) {
  return (
    <div
      className={cn(
        'w-full bg-background px-4 py-16 text-foreground md:py-24',
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          {icon ? <div className="mb-6 flex justify-center">{icon}</div> : null}
          <p className="label-mono mb-4 text-primary">Pricing</p>
          <h1 className="mb-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-balance text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              data-testid={`pricing-tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'relative flex flex-col overflow-hidden border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md',
                tier.isPrimary && 'ring-2 ring-primary',
              )}
            >
              {tier.badge || tier.isPrimary ? (
                <div className="absolute top-0 right-0">
                  <div className="rounded-bl-lg bg-primary px-3 py-1 label-mono text-[10px] text-primary-foreground">
                    {tier.badge || 'Most Popular'}
                  </div>
                </div>
              ) : null}

              <div className="mb-6">
                <h2 className="mb-2 font-display text-xl font-bold tracking-tight text-foreground">
                  {tier.name}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <div className="mb-6">
                {tier.price !== undefined ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                      ${tier.price}
                    </span>
                    <span className="text-muted-foreground">
                      {tier.billingPeriod || '/month'}
                    </span>
                  </div>
                ) : (
                  <div className="font-display text-xl font-semibold tracking-tight text-foreground">
                    {tier.priceLabel}
                  </div>
                )}
              </div>

              <Button
                className={cn(
                  'mb-6 w-full rounded-xl font-semibold',
                  tier.isPrimary &&
                    'shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/25',
                )}
                variant={tier.isPrimary ? 'default' : 'secondary'}
                onClick={tier.onButtonClick}
              >
                {tier.buttonText}
              </Button>

              {tier.featuresTitle ? (
                <div className="label-mono mb-4 text-[10px] text-muted-foreground">
                  {tier.featuresTitle}
                </div>
              ) : null}

              <div className="flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <div key={feature.text} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.text}
                    </span>
                    {feature.hasInfo ? (
                      <Info className="mt-0.5 h-4 w-4 shrink-0 cursor-help text-muted-foreground/50" />
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {footerTitle ? (
          <Card className="relative flex flex-col items-center justify-between gap-4 overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-8 md:flex-row">
            <div>
              <h3 className="mb-2 font-display text-xl font-bold tracking-tight text-foreground">
                {footerTitle}
              </h3>
              {footerDescription ? (
                <p className="text-sm text-muted-foreground">
                  {footerDescription}
                </p>
              ) : null}
            </div>
            {footerButtonText ? (
              <Button
                data-testid="pricing-book-demo"
                className="group gap-2 rounded-xl whitespace-nowrap font-semibold shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl"
                onClick={onFooterButtonClick}
              >
                {footerButtonText}
              </Button>
            ) : null}
          </Card>
        ) : null}
      </div>
    </div>
  )
}
