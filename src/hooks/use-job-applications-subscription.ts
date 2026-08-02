import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabaseBrowser } from '#/lib/supabase'
import {
  jobApplicationsQueryKey,
  jobStagesQueryKey,
} from '#/lib/job-applications-shared'

/**
 * Realtime bridge for the candidate board — the port's first Realtime
 * subscription (ADR-0007). Mirrors the source's `useJobApplicationsSubscription`:
 * one Supabase Realtime channel per selected Job, scoped to `job_applications`
 * rows for that Job, invalidating the React Query caches that own the board.
 *
 * Because reads go through user-scoped server functions (ADR-0004), the client
 * never reads business data directly — but Realtime channels still authorize
 * via the user JWT on the browser client, and RLS filters the payloads, so the
 * invalidation is the only client-side effect. The board uses job-wide query
 * keys (`['job-applications', jobId, companyId]`, `['job-stages', jobId,
 * companyId]`), so any change to the Job's applications refetches the whole
 * board — the source's per-stage narrowing ports when the per-stage infinite
 * query lands.
 *
 * @param jobId     the selected Job id (no-op when empty)
 * @param companyId the Member's company id (namespaces the invalidated keys)
 */
export function useJobApplicationsSubscription(
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!jobId || !companyId) return

    const applicationsKey = jobApplicationsQueryKey(jobId, companyId)
    const stagesKey = jobStagesQueryKey(jobId, companyId)
    const keysToInvalidate: QueryKey[] = [applicationsKey, stagesKey]

    if (channelRef.current) {
      supabaseBrowser.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Unique channel name per mount (Date.now) prevents collisions across
    // rapid job selections (source parity).
    const channelName = `job-applications-${jobId}-${Date.now()}`
    channelRef.current = supabaseBrowser
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          // Any INSERT / UPDATE / DELETE on this Job's applications refreshes
          // the board. (The source narrows per affected stage; the job-wide key
          // makes that unnecessary here — a background refetch re-sorts the
          // whole board.) `payload` is intentionally unused beyond triggering.
          void payload
          for (const key of keysToInvalidate) {
            void queryClient.invalidateQueries({ queryKey: key })
          }
        },
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabaseBrowser.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [jobId, companyId, queryClient])
}
