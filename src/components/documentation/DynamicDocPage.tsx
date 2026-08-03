import type { ComponentType } from 'react'
import AddCredits from '#/components/documentation/pages/add-credits'
import AddTeamMembers from '#/components/documentation/pages/add-team-members'
import CostOfServices from '#/components/documentation/pages/billing/cost-of-services'
import HowToBuyCredits from '#/components/documentation/pages/billing/how-to-buy-credits'
import AutoRefill from '#/components/documentation/pages/billing/how-to-buy-credits/auto-refill'
import PayAsYouGo from '#/components/documentation/pages/billing/how-to-buy-credits/pay-as-you-go'
import Subscriptions from '#/components/documentation/pages/billing/how-to-buy-credits/subscriptions'
import BillingOverview from '#/components/documentation/pages/billing/overview'
import UsageAndInvoices from '#/components/documentation/pages/billing/usage-and-invoices'
import BulkUploadOverview from '#/components/documentation/pages/bulk-upload'
import CandidatesPageOverview from '#/components/documentation/pages/candidates-page'
import CoreAiOverview from '#/components/documentation/pages/core-ai-services/overview'
import ResumeScreening from '#/components/documentation/pages/core-ai-services/resume-screening'
import ScreeningInterview from '#/components/documentation/pages/core-ai-services/screening-interview'
import CreateAJob from '#/components/documentation/pages/create-a-job'
import CustomizeApplicationForm from '#/components/documentation/pages/customize-application-form'
import CandidateCardOverview from '#/components/documentation/pages/dashboard/candidate-card/overview'
import ProfileDialog from '#/components/documentation/pages/dashboard/candidate-card/profile-dialog'
import ShortlistingRejecting from '#/components/documentation/pages/dashboard/candidate-card/shortlisting-rejecting'
import JobCardDetails from '#/components/documentation/pages/dashboard/job-card/job-details'
import JobCardOverview from '#/components/documentation/pages/dashboard/job-card/overview'
import DashboardOverview from '#/components/documentation/pages/dashboard/overview'
import GetStarted from '#/components/documentation/pages/get-started'
import GettingCandidates from '#/components/documentation/pages/getting-candidates'
import SetReachoutTemplate from '#/components/documentation/pages/set-reachout-template'

/** Slug → page map (25 content routes). Mirrors source DynamicDocPage. */
export const DOC_PAGES: Record<string, ComponentType> = {
  'get-started': GetStarted,
  'get-started/add-credits': AddCredits,
  'get-started/customize-application-form': CustomizeApplicationForm,
  'get-started/set-reachout-template': SetReachoutTemplate,
  'get-started/add-team-members': AddTeamMembers,
  'create-a-job': CreateAJob,
  'getting-candidates': GettingCandidates,
  'dashboard/overview': DashboardOverview,
  'dashboard/candidate-card/overview': CandidateCardOverview,
  'dashboard/candidate-card/profile-dialog': ProfileDialog,
  'dashboard/candidate-card/shortlisting-rejecting': ShortlistingRejecting,
  'dashboard/job-card/overview': JobCardOverview,
  'dashboard/job-card/job-details': JobCardDetails,
  'core-ai-services/overview': CoreAiOverview,
  'core-ai-services/resume-screening': ResumeScreening,
  'core-ai-services/screening-interview': ScreeningInterview,
  'billing/overview': BillingOverview,
  'billing/cost-of-services': CostOfServices,
  'billing/how-to-buy-credits': HowToBuyCredits,
  'billing/how-to-buy-credits/pay-as-you-go': PayAsYouGo,
  'billing/how-to-buy-credits/subscriptions': Subscriptions,
  'billing/how-to-buy-credits/auto-refill': AutoRefill,
  'billing/usage-and-invoices': UsageAndInvoices,
  'bulk-upload': BulkUploadOverview,
  'candidates-page': CandidatesPageOverview,
}

export function resolveDocPage(slug: string | undefined): ComponentType | null {
  if (!slug) return null
  return DOC_PAGES[slug] ?? null
}
