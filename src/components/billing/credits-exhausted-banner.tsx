/**
 * Persistent banner when credits are exhausted or below the resume-screening
 * cost (source `CreditsExhaustedBanner`). Non-dismissible until balance is
 * topped up; CTA routes to Billing.
 */
import { AlertTriangle, ArrowRight, Wallet } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button'
import { useCreditBalance, useServiceRates } from '#/hooks/use-billing'
import { cn } from '#/lib/utils'

type CreditsExhaustedBannerProps = {
  companyId: string | null
  /** Minimum credits threshold to show warning (default: resume screening cost) */
  warningThreshold?: number
}

export function CreditsExhaustedBanner({
  companyId,
  warningThreshold,
}: CreditsExhaustedBannerProps) {
  const { balance, isLoading: isBalanceLoading } = useCreditBalance(companyId)
  const { data: serviceRates, isLoading: isRatesLoading } =
    useServiceRates(companyId)

  const isLoading = isBalanceLoading || isRatesLoading
  const effectiveThreshold =
    warningThreshold ?? serviceRates?.resume_screening_cost ?? 50

  if (!companyId || isLoading || balance >= effectiveThreshold) {
    return null
  }

  const isExhausted = balance <= 0

  return (
    <div
      data-testid="credits-exhausted-banner"
      data-state={isExhausted ? 'exhausted' : 'low'}
      className={`fixed bottom-4 right-4 z-[100] max-w-xs rounded-md border shadow-md ${
        isExhausted
          ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950'
          : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
      }`}
    >
      <div className="p-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
              isExhausted
                ? 'bg-red-100 dark:bg-red-900/50'
                : 'bg-amber-100 dark:bg-amber-900/50'
            }`}
          >
            <AlertTriangle
              className={`h-3 w-3 ${
                isExhausted
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={`text-xs font-semibold ${
                  isExhausted
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-amber-800 dark:text-amber-200'
                }`}
              >
                {isExhausted ? 'Credits Exhausted' : 'Low Credits'}
              </h4>
              <div
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  isExhausted
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                }`}
              >
                <Wallet className="h-2.5 w-2.5" />
                <span data-testid="credits-banner-balance">
                  {balance.toLocaleString()}
                </span>
              </div>
            </div>

            <p
              className={`mt-0.5 text-[10px] leading-tight ${
                isExhausted
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {isExhausted
                ? 'Add credits to process applicants'
                : `${balance.toLocaleString()} remaining`}
            </p>
          </div>

          {/*
            Plain Link (not Button asChild): dashboard replace-navigates
            ?jobId=/&stageId= while this overlay is open; reloadDocument makes
            the CTA win that race. SVG keeps pointer events so center-clicks
            don't fall through onto the board.
          */}
          <Link
            to="/billing"
            reloadDocument
            data-testid="credits-banner-add"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'h-6 gap-1 px-2 text-[10px] [&_svg]:pointer-events-auto',
              isExhausted
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-600 text-white hover:bg-amber-700',
            )}
          >
            Add
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
