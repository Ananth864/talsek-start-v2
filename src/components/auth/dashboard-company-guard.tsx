import { useRouter } from '@tanstack/react-router'
import { CompanyCollectionModal } from '#/components/auth/company-collection-modal'
import { completeCompanySetup } from '#/server/fn/company'
import { signOut } from '#/server/fn/auth'

type DashboardCompanyGuardProps = {
  children: React.ReactNode
  needsCompanySetup: boolean
  userEmail?: string | null
  userName?: string | null
}

/**
 * Blocks dashboard (and any wrapped Member surface) until the Profile has a
 * Company. Closing the dialog signs the Member out — company setup cannot be
 * skipped (ADR-0004: company-less Profiles undermine RLS scoping).
 */
export function DashboardCompanyGuard({
  children,
  needsCompanySetup,
  userEmail,
  userName,
}: DashboardCompanyGuardProps) {
  const router = useRouter()

  if (!needsCompanySetup) {
    return <>{children}</>
  }

  const handleCompanySetup = async (
    companyName: string,
    companySize: string,
  ) => {
    await completeCompanySetup({
      data: { companyName, companySize },
    })
    // Re-run beforeLoad so companyId flows into the Jobs query key.
    await router.invalidate()
  }

  const handleClose = async () => {
    await signOut()
    window.location.href = '/signin'
  }

  return (
    <CompanyCollectionModal
      open={true}
      onClose={() => {
        void handleClose()
      }}
      onSubmit={handleCompanySetup}
      userEmail={userEmail}
      userName={userName}
    />
  )
}
