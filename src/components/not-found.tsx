import { Link } from '@tanstack/react-router'

/**
 * Global 404 for unknown Member/Applicant routes (source `NotFound`).
 */
export function NotFoundPage() {
  return (
    <div
      data-testid="not-found-page"
      className="flex min-h-svh items-center justify-center bg-muted/40"
    >
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <Link
          to="/"
          className="text-primary underline underline-offset-4 hover:opacity-80"
          data-testid="not-found-home"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}
