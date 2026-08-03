import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchActiveSubscriptions,
  fetchCompanyPayments,
  fetchCreditBalance,
  fetchServiceRates,
} from '#/server/fn/billing'
import type {
  ActiveSubscriptions,
  BillingPaymentRow,
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
  }
}

export type { BillingPaymentRow, ActiveSubscriptions }
