import { FileSearch, Target, Send } from 'lucide-react'
import { cn } from '#/lib/utils'

const features = [
  {
    icon: FileSearch,
    title: 'AI-Powered Screening',
    description:
      'Advanced algorithms analyze resumes beyond keywords, understanding context and candidate potential.',
  },
  {
    icon: Target,
    title: 'Smart Matching',
    description:
      'Intelligent candidate ranking based on true job fit, skills alignment, and cultural compatibility.',
  },
  {
    icon: Send,
    title: 'Automated Reachout',
    description:
      'Seamlessly reach out to top candidates in one-click with personalized messaging tailored to your hiring needs.',
  },
] as const

type AuthLayoutProps = {
  children: React.ReactNode
  title: string
  subtitle: string
  className?: string
}

/**
 * Two-column Member auth chrome (source AuthLayout structure).
 * Paint uses the ported theme tokens (ADR-0030).
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: AuthLayoutProps) {
  return (
    <div
      data-testid="auth-layout"
      className={cn('flex min-h-svh', className)}
    >
      <div className="bg-muted/40 relative flex flex-1 flex-col justify-center px-6 sm:px-8 lg:px-12">
        <div className="relative mx-auto w-full max-w-xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

      <div
        data-testid="auth-layout-showcase"
        className="bg-background relative hidden overflow-hidden lg:flex lg:flex-1"
      >
        <div className="relative mx-auto flex max-w-xl flex-col items-center justify-center px-8 xl:px-12">
          <div className="mb-8 flex items-center gap-3 self-start">
            <img
              src="/Talsek_logo_square.png"
              alt="Talsek Logo"
              className="h-12 w-12"
            />
            <div>
              <p className="text-2xl font-bold">Talsek</p>
              <p className="text-muted-foreground text-sm">
                Intelligent Recruitment Platform
              </p>
            </div>
          </div>

          <div className="mb-10 self-start">
            <h2 className="mb-4 text-xl font-semibold">
              Transform your hiring with AI-powered intelligence
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Join thousands of companies using Talsek to find, screen, and hire
              the best talent. Our advanced algorithms go beyond keywords to
              understand true candidate potential.
            </p>
          </div>

          <div className="grid w-full gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-muted/50 flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="bg-primary/10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <feature.icon className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="mb-1 font-semibold">{feature.title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
