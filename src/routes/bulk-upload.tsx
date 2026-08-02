import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthState } from '#/server/fn/auth'
import { fetchMemberProfile } from '#/server/fn/jobs'
import { BulkUploadPage } from '#/components/bulk/bulk-upload-page'

export const Route = createFileRoute('/bulk-upload')({
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (!user) {
      throw redirect({
        to: '/signin',
        search: { redirect: '/bulk-upload' },
      })
    }
    const profile = await fetchMemberProfile()
    return {
      companyId: profile?.company_id ?? null,
    }
  },
  component: BulkUploadRoute,
})

function BulkUploadRoute() {
  const { companyId } = Route.useRouteContext()
  return (
    <div className="mx-auto min-h-svh max-w-6xl">
      <BulkUploadPage companyId={companyId} />
    </div>
  )
}
