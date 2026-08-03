import { createFileRoute } from '@tanstack/react-router'
import { BulkUploadPage } from '#/components/bulk/bulk-upload-page'

export const Route = createFileRoute('/_member/bulk-upload')({
  component: BulkUploadRoute,
})

function BulkUploadRoute() {
  const { companyId } = Route.useRouteContext()
  return <BulkUploadPage companyId={companyId} />
}
