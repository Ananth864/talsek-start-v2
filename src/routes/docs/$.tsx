import { createFileRoute, redirect } from '@tanstack/react-router'
import { resolveDocPage } from '#/components/documentation/DynamicDocPage'

/**
 * Catch-all docs page. Unknown slugs soft-redirect to get-started (source parity).
 */
export const Route = createFileRoute('/docs/$')({
  beforeLoad: ({ params }) => {
    const slug = params._splat
    if (!slug || !resolveDocPage(slug)) {
      throw redirect({
        to: '/docs/$',
        params: { _splat: 'get-started' },
      })
    }
  },
  component: DocSplatPage,
})

function DocSplatPage() {
  const { _splat: slug } = Route.useParams()
  const Page = resolveDocPage(slug)
  if (!Page) return null
  return <Page />
}
