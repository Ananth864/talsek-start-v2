import { useEffect, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  ArrowUpRight,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Receipt,
  Video,
  X,
  Zap,
} from 'lucide-react'
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
  useUsageStats,
} from '#/hooks/use-billing'
import type { BillingPaymentRow } from '#/hooks/use-billing'
import {
  getPaymentDescription,
  PLAN_CODES,
  resolveCurrentPlanLabel,
} from '#/lib/billing-shared'
import type { PlanType } from '#/lib/billing-shared'
import { AutoRefillSettings } from '#/components/billing/auto-refill-settings'
import { CustomTopupInput } from '#/components/billing/custom-topup-input'
import { UsagePanel } from '#/components/billing/usage-panel'
import { CalBookingDialog } from '#/components/marketing/cal-booking-dialog'
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
  Sheet,
  SheetContent,
  SheetTitle,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_member/billing')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { status?: string; stub?: string } => ({
    status: typeof search.status === 'string' ? search.status : undefined,
    stub: typeof search.stub === 'string' ? search.stub : undefined,
  }),
  // Sidebar entry is admin-only; route stays open for deep links (source
  // parity — Billing had no route guard).
  component: BillingPage,
})

function BillingPage() {
  const { companyId } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('billing')
  const [plansOpen, setPlansOpen] = useState(false)
  const [calOpen, setCalOpen] = useState(false)
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
  const {
    dailyUsage,
    categoryData,
    jobUsageData,
    totalCreditsUsed,
    isLoading: usageLoading,
    error: usageError,
  } = useUsageStats(companyId)

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
      setCalOpen(true)
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
      <div className="mx-auto max-w-6xl p-6" data-testid="billing-page">
        <p className="text-muted-foreground">
          Your account is not associated with a company.
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-svh flex-col bg-background text-foreground"
      data-testid="billing-page"
    >
      <main className="min-w-0 flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-6xl">
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
            <div className="sticky top-0 z-10 -mx-6 mb-6 border-b bg-background px-6">
              <TabsList className="h-10 w-full justify-start gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="billing"
                  className="h-full rounded-none px-4 font-medium text-muted-foreground transition-colors data-[state=active]:border-b-2 data-[state=active]:border-[#4366B0] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  data-testid="billing-tab"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </TabsTrigger>
                <TabsTrigger
                  value="usage"
                  className="h-full rounded-none px-4 font-medium text-muted-foreground transition-colors data-[state=active]:border-b-2 data-[state=active]:border-[#4366B0] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  data-testid="usage-tab"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Usage
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="h-full rounded-none px-4 font-medium text-muted-foreground transition-colors data-[state=active]:border-b-2 data-[state=active]:border-[#4366B0] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  data-testid="invoices-tab"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Invoices
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="billing" className="space-y-5">
              <Card
                className="overflow-hidden bg-card shadow-lg"
                data-testid="current-plan-card"
              >
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
                      className="bg-[#4366B0] text-white hover:bg-[#36528D]"
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
                    ) : null}
                  </div>

                  <Separator />

                  {currentPlan === 'No Plan' ? (
                    <div className="space-y-4" data-testid="billing-get-started">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Get Started
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-xl border border-[#4366B0]/20 p-4">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4366B0]/10 text-sm font-semibold text-[#4366B0]">
                            1
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground">
                              Pay as you go
                            </h5>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              Set up a payment method and top up credits
                              anytime. Only pay for what you use.
                            </p>
                            <Button
                              variant="link"
                              className="mt-2 h-auto p-0 text-[#4366B0]"
                              onClick={() => setPlansOpen(true)}
                            >
                              Add payment method →
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border border-border p-4">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                            2
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground">
                              Subscription
                            </h5>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              Get monthly credits at discounted rates. Best for
                              teams with regular hiring needs.
                            </p>
                            <Button
                              variant="link"
                              className="mt-2 h-auto p-0"
                              onClick={() => setPlansOpen(true)}
                            >
                              View subscription plans →
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border border-border p-4">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                            3
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground">
                              Enterprise
                            </h5>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              Custom pricing with the best rates for high-volume
                              hiring and HR consultancies.
                            </p>
                            <Button
                              variant="link"
                              className="mt-2 h-auto p-0"
                              onClick={() => setCalOpen(true)}
                            >
                              Contact sales →
                            </Button>
                          </div>
                        </div>
                      </div>
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

              <div
                className="grid grid-cols-1 gap-5 lg:grid-cols-2"
                data-testid="billing-topup-grid"
              >
                <CustomTopupInput companyId={companyId} onMessage={onMessage} />
                <AutoRefillSettings
                  companyId={companyId}
                  onMessage={onMessage}
                />
              </div>

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
                        <h4 className="text-sm font-medium">
                          Resume Screening
                        </h4>
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
                          AI-driven video interview & analysis
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {interviewCost}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          credits
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <UsagePanel
                balance={balance}
                usage={{
                  dailyUsage,
                  categoryData,
                  jobUsageData,
                  totalCreditsUsed,
                }}
                isLoading={usageLoading || balanceLoading}
                error={usageError instanceof Error ? usageError : null}
              />
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
        </div>
      </main>

      <Sheet open={plansOpen} onOpenChange={setPlansOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-0 p-0 sm:max-w-4xl"
          data-testid="plans-sheet"
        >
          <div className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur-lg">
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-4">
                <SheetTitle className="text-xl font-semibold">
                  Choose Your Plan
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  data-testid="view-full-pricing"
                >
                  <Link to="/pricing" target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Full Pricing
                  </Link>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPlansOpen(false)}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {pricingTiers.map((tier) => {
                const isCurrentPlan = tier.name === currentPlan
                return (
                  <Card
                    key={tier.name}
                    className={cn(
                      'relative overflow-hidden border-border/50 transition-shadow',
                      isCurrentPlan && 'bg-muted/5 ring-2 ring-[#4366B0]',
                    )}
                    data-testid={`plan-card-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardContent className="relative flex h-full flex-col p-6">
                      <div className="mb-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                            {tier.name}
                          </h3>
                          {tier.badge ? (
                            <Badge variant="outline">{tier.badge}</Badge>
                          ) : isCurrentPlan ? (
                            <Badge variant="outline">Current Plan</Badge>
                          ) : null}
                        </div>
                        <div className="flex items-baseline gap-1">
                          {tier.priceLabel ? (
                            <span className="text-xl font-bold tracking-tight">
                              {tier.priceLabel}
                            </span>
                          ) : tier.price !== undefined ? (
                            <>
                              <span className="text-2xl font-bold tracking-tight">
                                ${tier.price}
                              </span>
                              <span className="text-sm font-medium text-muted-foreground">
                                {tier.billingPeriod || '/month'}
                              </span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold tracking-tight">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>

                      {tier.buttonAction ? (
                        <Button
                          className={cn(
                            'mb-6 h-9 w-full font-medium',
                            tier.isPrimary &&
                              'bg-[#4366B0] text-white hover:bg-[#36528D]',
                          )}
                          disabled={
                            tier.isDisabled ||
                            actionInProgress === tier.buttonAction
                          }
                          variant={
                            !tier.isDisabled && !tier.isPrimary
                              ? 'outline'
                              : 'default'
                          }
                          onClick={() =>
                            void handlePlanAction(tier.buttonAction!)
                          }
                          data-testid={`plan-action-${tier.buttonAction}`}
                        >
                          {actionInProgress === tier.buttonAction ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              {tier.buttonText}
                              {!tier.isDisabled && tier.isPrimary ? (
                                <ArrowUpRight className="ml-1 h-4 w-4" />
                              ) : null}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          variant="outline"
                          className="mb-6 h-9 w-full"
                        >
                          {tier.buttonText}
                        </Button>
                      )}

                      <div className="space-y-3 border-t border-border/50 pt-6">
                        {tier.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-3">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4366B0]" />
                            <span className="text-sm leading-tight text-muted-foreground">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CalBookingDialog open={calOpen} onOpenChange={setCalOpen} />
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
    <Card
      className="overflow-hidden border-0 shadow-md"
      data-testid="invoices-panel"
    >
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
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Loading payments...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <p className="text-sm text-destructive">
                      Failed to load payments
                    </p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-muted/50 p-3">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No invoices yet
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Your payment history will appear here
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const totalCents =
                    payment.amount_cents + payment.tax_amount_cents
                  return (
                    <tr
                      key={payment.id}
                      className="border-b last:border-0"
                      data-testid={`invoice-row-${payment.id}`}
                    >
                      <td className="px-6 py-4 text-sm">
                        {new Date(payment.created_at).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {getPaymentDescription(payment)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        ${(totalCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">
                        {payment.status}
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === 'succeeded' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            disabled={downloadingId === payment.id}
                            onClick={() => void handleDownload(payment.id)}
                            data-testid={`download-invoice-${payment.id}`}
                          >
                            {downloadingId === payment.id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-1 h-4 w-4" />
                            )}
                            PDF
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
