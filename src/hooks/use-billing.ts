import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchActiveSubscriptions,
  fetchBillingSettings,
  fetchCompanyPayments,
  fetchCreditBalance,
  fetchServiceRates,
  fetchUsageStats,
  updateBillingSettings,
} from '#/server/fn/billing'
import type {
  ActiveSubscriptions,
  BillingPaymentRow,
  BillingSettingsRow,
  UsageStats,
} from '#/server/fn/billing'

export const creditBalanceQueryKey = (companyId: string | null) =>
  ['credit-balance', companyId] as const

export const activeSubscriptionsQueryKey = (companyId: string | null) =>
  ['active-subscriptions', companyId] as const

export const companyPaymentsQueryKey = (companyId: string | null) =>
  ['company-payments', companyId] as const

export const serviceRatesQueryKey = (companyId: string | null) =>
  ['service-rates', companyId] as const

export const creditBalanceQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: creditBalanceQueryKey(companyId),
    queryFn: () => fetchCreditBalance(),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  })

export const activeSubscriptionsQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: activeSubscriptionsQueryKey(companyId),
    queryFn: () => fetchActiveSubscriptions(),
    enabled: !!companyId,
    staleTime: 30_000,
  })

export const companyPaymentsQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: companyPaymentsQueryKey(companyId),
    queryFn: () => fetchCompanyPayments(),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })

export const serviceRatesQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: serviceRatesQueryKey(companyId),
    queryFn: () => fetchServiceRates(),
    enabled: !!companyId,
    staleTime: 30 * 60 * 1000,
  })

export function useCreditBalance(companyId: string | null) {
  const query = useQuery(creditBalanceQueryOptions(companyId))
  return {
    balance: query.data?.balance ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useActiveSubscriptions(companyId: string | null) {
  const query = useQuery(activeSubscriptionsQueryOptions(companyId))
  const empty: ActiveSubscriptions = {
    walletAnchor: null,
    normalSubscription: null,
    hasMandateEstablished: false,
    hasActiveNormalSubscription: false,
    currentNormalPlanCode: null,
    isPendingCancellation: false,
  }
  return {
    ...(query.data ?? empty),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCompanyPayments(companyId: string | null) {
  return useQuery(companyPaymentsQueryOptions(companyId))
}

export function useServiceRates(companyId: string | null) {
  return useQuery(serviceRatesQueryOptions(companyId))
}

export const usageStatsQueryKey = (companyId: string | null) =>
  ['usage-stats', companyId] as const

export const usageStatsQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: usageStatsQueryKey(companyId),
    queryFn: () => fetchUsageStats(),
    enabled: !!companyId,
    staleTime: 60_000,
  })

export function useUsageStats(companyId: string | null) {
  const query = useQuery(usageStatsQueryOptions(companyId))
  const empty: UsageStats = {
    dailyUsage: [],
    categoryData: [],
    jobUsageData: [],
    totalCreditsUsed: 0,
  }
  return {
    ...(query.data ?? empty),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export const billingSettingsQueryKey = (companyId: string | null) =>
  ['billing-settings', companyId] as const

export const billingSettingsQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: billingSettingsQueryKey(companyId),
    queryFn: () => fetchBillingSettings(),
    enabled: !!companyId,
    staleTime: 60_000,
  })

export function useBillingSettings(companyId: string | null) {
  const query = useQuery(billingSettingsQueryOptions(companyId))
  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useUpdateBillingSettings(companyId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: {
      auto_refill_enabled: boolean
      auto_refill_threshold_credits: number
      auto_refill_amount_cents: number
    }) => updateBillingSettings({ data: updates }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: billingSettingsQueryKey(companyId),
      })
    },
  })
}

export function useInvalidateBilling(companyId: string | null) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({
      queryKey: creditBalanceQueryKey(companyId),
    })
    void queryClient.invalidateQueries({
      queryKey: activeSubscriptionsQueryKey(companyId),
    })
    void queryClient.invalidateQueries({
      queryKey: companyPaymentsQueryKey(companyId),
    })
    void queryClient.invalidateQueries({
      queryKey: billingSettingsQueryKey(companyId),
    })
    void queryClient.invalidateQueries({
      queryKey: usageStatsQueryKey(companyId),
    })
  }
}

export type {
  BillingPaymentRow,
  ActiveSubscriptions,
  BillingSettingsRow,
  UsageStats,
}
