import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type DocLinkProps = {
  to: string
  external?: boolean
  className?: string
  children?: ReactNode
}

/**
 * Styled in-docs link. Docs paths go through the `/docs/$` splat; other app
 * paths use TanStack Router's typed `to` via a narrow cast.
 */
export function DocLink({ to, external, className, children }: DocLinkProps) {
  const classes = cn(
    'text-talsek hover:underline hover:underline-offset-4 hover:decoration-2 transition-all',
    className,
  )

  if (external || to.startsWith('http://') || to.startsWith('https://')) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
        {external ? (
          <ExternalLink className="ml-1 inline-block h-3 w-3" />
        ) : null}
      </a>
    )
  }

  if (to === '/docs' || to.startsWith('/docs/')) {
    const splat = to === '/docs' ? 'get-started' : to.slice('/docs/'.length)
    return (
      <Link to="/docs/$" params={{ _splat: splat }} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    // Non-docs destinations are real app routes (signup, users, …).
    <Link to={to as '/'} className={classes}>
      {children}
    </Link>
  )
}
