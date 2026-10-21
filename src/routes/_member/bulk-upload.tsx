import { createFileRoute } from '@tanstack/react-router'
import { BulkUploadPage } from '#/components/bulk/bulk-upload-page'

export const Route = createFileRoute('/_member/bulk-upload')({
  // Prefetch + dehydrate the Jobs list for SSR first paint (ADR-0007).
  // Server-only with lazy imports: the client route chunk stays lean and the
  // mounted hook fetches exactly as before on client-side navigation.
  loader: async ({ context }) => {
    if (!context.companyId || typeof document !== 'undefined') return
    const { jobsQueryOptions } = await import('#/hooks/use-jobs')
    await context.queryClient
      .ensureQueryData(jobsQueryOptions(context.companyId))
      .catch(() => undefined)
  },
  component: BulkUploadRoute,
})

function BulkUploadRoute() {
  const { companyId } = Route.useRouteContext()
  return <BulkUploadPage companyId={companyId} />
}
