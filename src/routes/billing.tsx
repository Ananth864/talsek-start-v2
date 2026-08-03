import { useEffect, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import {
  Check,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Receipt,
  Video,
  Zap,
} from 'lucide-react'
import { getAuthState } from '#/server/fn/auth'
import { fetchMemberProfile } from '#/server/fn/jobs'
import {
  cancelSubscription,
  changePlan,
  createCheckout,
  getInvoicePdf,
} from '#/server/fn/billing'
import {
  useActiveSubscriptions,
  useCompanyPayments,
  useCreditBalance,
  useInvalidateBilling,
  useServiceRates,
} from '#/hooks/use-billing'
import type { BillingPaymentRow } from '#/hooks/use-billing'
import {
  getPaymentDescription,
  PLAN_CODES,
  resolveCurrentPlanLabel,
} from '#/lib/billing-shared'
import type { PlanType } from '#/lib/billing-shared'
import { CustomTopupInput } from '#/components/billing/custom-topup-input'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/billing')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { status?: string; stub?: string } => ({
    status: typeof search.status === 'string' ? search.status : undefined,
    stub: typeof search.stub === 'string' ? search.stub : undefined,
  }),
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (!user) {
      throw redirect({
        to: '/signin',
        search: { redirect: '/billing' },
      })
    }
    const profile = await fetchMemberProfile()
    return {
      companyId: profile?.company_id ?? null,
    }
  },
  component: BillingPage,
})

function BillingPage() {
  const { companyId } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('billing')
  const [plansOpen, setPlansOpen] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [banner, setBanner] = useState<{
    kind: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  const invalidate = useInvalidateBilling(companyId)
  const { balance, isLoading: balanceLoading, refetch: refetchBalance } =
    useCreditBalance(companyId)
  const {
    walletAnchor,
    normalSubscription,
    hasActiveNormalSubscription,
    isPendingCancellation,
    isLoading: subsLoading,
    refetch: refetchSubs,
  } = useActiveSubscriptions(companyId)
  const { data: rates, isLoading: ratesLoading } = useServiceRates(companyId)
  const {
    data: payments = [],
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useCompanyPayments(companyId)

  const currentPlan = resolveCurrentPlanLabel(
    Boolean(walletAnchor),
    normalSubscription?.plan_code ?? null,
  )
  const isLoading = balanceLoading || subsLoading || ratesLoading
  const resumeCost = rates?.resume_screening_cost ?? 5
  const interviewCost = rates?.screening_interview_cost ?? 40

  useEffect(() => {
    if (!search.status) return
    if (search.status === 'succeeded') {
      setBanner({
        kind: 'success',
        message: 'Payment successful! Your account will update shortly.',
      })
      setTimeout(() => {
        void refetchBalance()
        void refetchSubs()
        invalidate()
      }, 1500)
    } else if (search.status === 'failed') {
      setBanner({ kind: 'error', message: 'Payment failed. Please try again.' })
    } else if (search.status === 'cancelled') {
      setBanner({ kind: 'info', message: 'Checkout was cancelled.' })
    }
    void navigate({
      to: '/billing',
      search: {},
      replace: true,
    })
  }, [search.status, navigate, refetchBalance, refetchSubs, invalidate])

  const onMessage = (kind: 'success' | 'error', message: string) => {
    setBanner({ kind, message })
  }

  const handlePlanAction = async (action: string) => {
    if (action === 'contact_sales') {
      setBanner({
        kind: 'info',
        message: 'Contact sales at hello@talsek.com for Enterprise pricing.',
      })
      return
    }

    if (action === 'setup_wallet_anchor') {
      setBanner({
        kind: 'info',
        message: 'Use the Add Credits section to set up your payment method.',
      })
      setPlansOpen(false)
      return
    }

    if (action === 'cancel_wallet_anchor' && walletAnchor) {
      setActionInProgress(action)
      try {
        await cancelSubscription({
          data: { subscriptionId: walletAnchor.id },
        })
        setBanner({
          kind: 'success',
          message: 'Payment mandate has been cancelled.',
        })
        void refetchSubs()
        setPlansOpen(false)
      } catch (err) {
        setBanner({
          kind: 'error',
          message:
            err instanceof Error ? err.message : 'Failed to cancel mandate',
        })
      } finally {
        setActionInProgress(null)
      }
      return
    }

    if (action === 'cancel_normal_subscription' && normalSubscription) {
      setActionInProgress(action)
      try {
        await cancelSubscription({
          data: { subscriptionId: normalSubscription.id },
        })
        setBanner({
          kind: 'success',
          message:
            'Subscription will be cancelled at the end of your billing period.',
        })
        void refetchSubs()
        setPlansOpen(false)
      } catch (err) {
        setBanner({
          kind: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Failed to cancel subscription',
        })
      } finally {
        setActionInProgress(null)
      }
      return
    }

    if (action === 'subscribe_tier1') {
      setActionInProgress(action)
      try {
        const result = await createCheckout({
          data: {
            planCode: PLAN_CODES.STARTER_MONTHLY,
            quantity: 1,
            returnUrl: `${window.location.origin}/billing`,
          },
        })
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl
          return
        }
        throw new Error('No checkout URL returned')
      } catch (err) {
        setBanner({
          kind: 'error',
          message:
            err instanceof Error ? err.message : 'Failed to start checkout',
        })
      } finally {
        setActionInProgress(null)
      }
      return
    }

    if (action === 'downgrade_tier1') {
      setActionInProgress(action)
      try {
        const result = await changePlan({
          data: { newPlanCode: PLAN_CODES.STARTER_MONTHLY },
        })
        setBanner({
          kind: 'success',
          message: result.message,
        })
        void refetchSubs()
        setPlansOpen(false)
      } catch (err) {
        setBanner({
          kind: 'error',
          message:
            err instanceof Error ? err.message : 'Failed to change plan',
        })
      } finally {
        setActionInProgress(null)
      }
    }
  }

  const pricingTiers: Array<{
    name: PlanType
    price?: number
    priceLabel?: string
    billingPeriod?: string
    buttonText: string
    buttonAction: string | null
    isPrimary: boolean
    isDisabled: boolean
    badge?: string
    features: string[]
  }> = [
    {
      name: 'Pay as you go',
      priceLabel: 'Wallet based Credits',
      buttonText: walletAnchor ? 'Cancel Mandate' : 'Set Up',
      buttonAction: walletAnchor
        ? 'cancel_wallet_anchor'
        : 'setup_wallet_anchor',
      isPrimary: !walletAnchor,
      isDisabled: false,
      features: [
        '1 USD = 100 credits',
        `Resume Screening: ${currentPlan === 'Pay as you go' ? resumeCost : 5} credits`,
        `Screening Interview: ${currentPlan === 'Pay as you go' ? interviewCost : 40} credits`,
        'Pay only for what you use',
        'Full platform access',
      ],
    },
    {
      name: 'Tier 1',
      price: 50,
      billingPeriod: '/month',
      buttonText:
        currentPlan === 'Tier 1'
          ? isPendingCancellation
            ? `Cancels ${
                normalSubscription?.current_period_end
                  ? new Date(
                      normalSubscription.current_period_end,
                    ).toLocaleDateString()
                  : 'at period end'
              }`
            : 'Cancel Plan'
          : !hasActiveNormalSubscription
            ? 'Start Now'
            : currentPlan === 'Enterprise'
              ? 'Downgrade to Tier 1'
              : 'Upgrade to Tier 1',
      buttonAction:
        currentPlan === 'Tier 1'
          ? isPendingCancellation
            ? null
            : 'cancel_normal_subscription'
          : !hasActiveNormalSubscription
            ? 'subscribe_tier1'
            : 'downgrade_tier1',
      isPrimary: currentPlan !== 'Tier 1' && !isPendingCancellation,
      isDisabled: isPendingCancellation && currentPlan === 'Tier 1',
      badge: '25% OFF',
      features: [
        '5,000 credits / month',
        `Resume Screening: ${currentPlan === 'Tier 1' ? resumeCost : 4} credits`,
        `Screening Interview: ${currentPlan === 'Tier 1' ? interviewCost : 30} credits`,
        'Priority support',
        'Monthly credit allocation',
      ],
    },
    {
      name: 'Enterprise',
      price:
        currentPlan === 'Enterprise' && normalSubscription?.price_cents
          ? normalSubscription.price_cents / 100
          : undefined,
      priceLabel:
        currentPlan === 'Enterprise' && normalSubscription?.price_cents
          ? undefined
          : 'Custom pricing',
      billingPeriod:
        currentPlan === 'Enterprise' && normalSubscription?.billing_period
          ? normalSubscription.billing_period === 'yearly'
            ? '/year'
            : '/month'
          : undefined,
      buttonText:
        currentPlan === 'Enterprise'
          ? isPendingCancellation
            ? `Cancels ${
                normalSubscription?.current_period_end
                  ? new Date(
                      normalSubscription.current_period_end,
                    ).toLocaleDateString()
                  : 'at period end'
              }`
            : 'Cancel Plan'
          : 'Contact Sales',
      buttonAction:
        currentPlan === 'Enterprise'
          ? isPendingCancellation
            ? null
            : 'cancel_normal_subscription'
          : 'contact_sales',
      isPrimary: false,
      isDisabled: isPendingCancellation && currentPlan === 'Enterprise',
      features: [
        'Best-in-class credit rates',
        'Custom pricing for resumes/interviews',
      ],
    },
  ]

  const currentPlanFeatures =
    pricingTiers.find((tier) => tier.name === currentPlan)?.features ?? []

  if (!companyId) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-muted-foreground">
          Your account is not associated with a company.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">← Jobs</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        </div>
      </header>

      <main className="flex-1 p-6">
        {banner ? (
          <div
            role="status"
            data-testid="billing-banner"
            className={cn(
              'mb-4 rounded-lg border px-4 py-3 text-sm',
              banner.kind === 'success' &&
                'border-emerald-200 bg-emerald-50 text-emerald-900',
              banner.kind === 'error' &&
                'border-red-200 bg-red-50 text-red-900',
              banner.kind === 'info' &&
                'border-blue-200 bg-blue-50 text-blue-900',
            )}
          >
            {banner.message}
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-10 mb-6 border-b bg-background">
            <TabsList className="h-10 w-full justify-start gap-2 bg-transparent p-0">
              <TabsTrigger
                value="billing"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4366B0] rounded-none px-4"
                data-testid="billing-tab"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#4366B0] rounded-none px-4"
                data-testid="invoices-tab"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Invoices
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="billing" className="space-y-5">
            <Card className="overflow-hidden shadow-lg" data-testid="current-plan-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#4366B0]/10 p-2.5 text-[#4366B0]">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Current Plan</CardTitle>
                      <CardDescription>
                        Manage your subscription and billing
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => setPlansOpen(true)}
                    className="bg-[#4366B0] hover:bg-[#36528D] text-white"
                    data-testid="view-plans-button"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    View all Plans
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-gradient-to-r from-muted/50 to-muted/30 p-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3
                        className="text-xl font-semibold"
                        data-testid="current-plan-name"
                      >
                        {currentPlan}
                      </h3>
                      {currentPlan !== 'No Plan' ? (
                        <Badge
                          variant="secondary"
                          className="border-[#4366B0]/20 bg-[#4366B0]/10 text-[#4366B0]"
                        >
                          Active
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentPlan === 'No Plan' &&
                        'Set up a payment method to start using credits'}
                      {currentPlan === 'Pay as you go' &&
                        'Wallet-based credits — Top up anytime'}
                      {currentPlan === 'Tier 1' &&
                        '$50/month — 5,000 credits included'}
                      {currentPlan === 'Enterprise' &&
                        'Custom pricing for your organization'}
                    </p>
                  </div>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : currentPlan !== 'No Plan' ? (
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold"
                        data-testid="credit-balance"
                      >
                        {balance.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        credits available
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold"
                        data-testid="credit-balance"
                      >
                        {balance.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        credits
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {currentPlan === 'No Plan' ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Get Started
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Choose Pay as you go (top up credits) or start a Tier 1
                      subscription from View all Plans.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                      Plan Features
                    </h4>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {currentPlanFeatures.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/30 p-2.5"
                        >
                          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4366B0]/10">
                            <Check className="h-3 w-3 text-[#4366B0]" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <CustomTopupInput companyId={companyId} onMessage={onMessage} />

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Credit Costs</CardTitle>
                <CardDescription>
                  Credits required for each service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
                    <div className="rounded-lg bg-[#4366B0]/10 p-2.5 text-[#4366B0]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Resume Screening</h4>
                      <p className="text-xs text-muted-foreground">
                        AI-powered matching for each resume
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{resumeCost}</div>
                      <div className="text-xs text-muted-foreground">
                        credits
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
                    <div className="rounded-lg bg-[#38bdf8]/10 p-2.5 text-[#38bdf8]">
                      <Video className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">
                        Screening Interview
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        AI-driven interview & analysis
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{interviewCost}</div>
                      <div className="text-xs text-muted-foreground">
                        credits
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <InvoicesPanel
              payments={payments}
              isLoading={paymentsLoading}
              error={paymentsError}
              onMessage={onMessage}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={plansOpen} onOpenChange={setPlansOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a plan</DialogTitle>
            <DialogDescription>
              Subscribe, change plan, or cancel from here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-col rounded-xl border p-4"
                data-testid={`plan-card-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{tier.name}</h3>
                  {tier.badge ? (
                    <Badge variant="secondary">{tier.badge}</Badge>
                  ) : null}
                </div>
                <p className="mb-4 text-2xl font-bold">
                  {tier.priceLabel ??
                    (tier.price != null ? `$${tier.price}` : '')}
                  {tier.billingPeriod ? (
                    <span className="text-sm font-normal text-muted-foreground">
                      {tier.billingPeriod}
                    </span>
                  ) : null}
                </p>
                <ul className="mb-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#4366B0]" />
                      {f}
                    </li>
                  ))}
                </ul>
                {tier.buttonAction ? (
                  <Button
                    disabled={
                      tier.isDisabled || actionInProgress === tier.buttonAction
                    }
                    variant={tier.isPrimary ? 'default' : 'outline'}
                    className={
                      tier.isPrimary
                        ? 'bg-[#4366B0] hover:bg-[#36528D] text-white'
                        : undefined
                    }
                    onClick={() => void handlePlanAction(tier.buttonAction!)}
                    data-testid={`plan-action-${tier.buttonAction}`}
                  >
                    {actionInProgress === tier.buttonAction ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {tier.buttonText}
                  </Button>
                ) : (
                  <Button disabled variant="outline">
                    {tier.buttonText}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InvoicesPanel({
  payments,
  isLoading,
  error,
  onMessage,
}: {
  payments: BillingPaymentRow[]
  isLoading: boolean
  error: Error | null
  onMessage: (kind: 'success' | 'error', message: string) => void
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (paymentId: string) => {
    setDownloadingId(paymentId)
    try {
      const { pdfBase64, filename } = await getInvoicePdf({
        data: { paymentId },
      })
      const binary = atob(pdfBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      onMessage('success', `Opened ${filename}`)
    } catch (err) {
      onMessage(
        'error',
        err instanceof Error ? err.message : 'Failed to download invoice',
      )
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-md" data-testid="invoices-panel">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-muted p-2.5">
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Invoice History</CardTitle>
            <CardDescription>
              Your past invoices and payment receipts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No invoices yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b" data-testid={`invoice-row-${payment.id}`}>
                    <td className="px-4 py-3 text-sm">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getPaymentDescription(payment)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      ${(payment.amount_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {payment.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payment.status === 'succeeded' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingId === payment.id}
                          onClick={() => void handleDownload(payment.id)}
                          data-testid={`download-invoice-${payment.id}`}
                        >
                          {downloadingId === payment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span className="ml-2">Download</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
