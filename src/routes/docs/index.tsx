import { createFileRoute, redirect } from '@tanstack/react-router'

/** `/docs` → get-started (acceptance: docs index redirects). */
export const Route = createFileRoute('/docs/')({
  beforeLoad: () => {
    throw redirect({
      to: '/docs/$',
      params: { _splat: 'get-started' },
    })
  },
})
