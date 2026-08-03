import { Link } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

type AuthCenteredShellProps = {
  children: React.ReactNode
  /** Optional link above the card (e.g. Back to sign in). */
  backLink?: React.ReactNode
  className?: string
  showBrand?: boolean
}

/**
 * Centered auth shell for forgot / reset / confirm (source gradient pages,
 * paint relaxed to ported tokens).
 */
export function AuthCenteredShell({
  children,
  backLink,
  className,
  showBrand = false,
}: AuthCenteredShellProps) {
  return (
    <div
      className={cn(
        'bg-muted/30 relative flex min-h-svh items-center justify-center p-4',
        className,
      )}
    >
      <div className="relative z-10 w-full max-w-md">
        {backLink}
        {showBrand && (
          <div className="mb-8 flex items-center justify-center gap-3">
            <img
              src="/Talsek_logo_square.png"
              alt="Talsek Logo"
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold">Talsek</span>
          </div>
        )}
        {children}
        {showBrand && (
          <p className="text-muted-foreground mt-6 text-center text-sm">
            © {new Date().getFullYear()} Talsek. All rights reserved.
          </p>
        )}
      </div>
    </div>
  )
}

type AuthBackLinkProps = {
  to: '/signin' | '/signup' | '/forgot-password'
  children: React.ReactNode
  className?: string
}

export function AuthBackLink({ to, children, className }: AuthBackLinkProps) {
  return (
    <Link
      to={to}
      data-testid="auth-back-link"
      className={cn(
        'text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm',
        className,
      )}
    >
      {children}
    </Link>
  )
}
