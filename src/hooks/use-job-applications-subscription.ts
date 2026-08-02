import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabaseBrowser } from '#/lib/supabase'
import {
  jobApplicationsQueryKey,
  jobStagesQueryKey,
} from '#/lib/job-applications-shared'

type JobApplicationRealtimeRow = {
  id?: string
  current_stage_id?: string | null
  status?: string | null
}

/**
 * Realtime bridge for the candidate board — the port's first Realtime
 * subscription (ADR-0007). Mirrors the source's `useJobApplicationsSubscription`:
 * one Supabase Realtime channel per selected Job, scoped to `job_applications`
 * rows for that Job, invalidating the React Query caches that own the board.
 *
 * Event-type narrowing matches the source: invalidate on INSERT, on UPDATE
 * that changes `current_stage_id`, and on UPDATE that changes `status`. Other
 * UPDATEs (e.g. `starred`) are skipped — mutations invalidate their own keys.
 *
 * Because reads go through user-scoped server functions (ADR-0004), the client
 * never reads business data directly — but Realtime channels still authorize
 * via the user JWT on the browser client, and RLS filters the payloads, so the
 * invalidation is the only client-side effect. The board uses job-wide query
 * keys (`['job-applications', jobId, companyId]`, `['job-stages', jobId,
 * companyId]`), so any qualifying change refetches the whole board — the
 * source's per-stage narrowing ports when the per-stage infinite query lands.
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

    const invalidateBoard = () => {
      for (const key of keysToInvalidate) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    }

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
        (payload: RealtimePostgresChangesPayload<JobApplicationRealtimeRow>) => {
          const next = payload.new as JobApplicationRealtimeRow | Record<string, never>
          const prev = payload.old as JobApplicationRealtimeRow | Record<string, never>

          const isNewApplication = payload.eventType === 'INSERT'
          const isStageChange =
            payload.eventType === 'UPDATE' &&
            'current_stage_id' in next &&
            'current_stage_id' in prev &&
            next.current_stage_id !== prev.current_stage_id
          const isStatusChange =
            payload.eventType === 'UPDATE' &&
            'status' in next &&
            'status' in prev &&
            next.status !== prev.status

          // Source parity: mutations that only touch fields like `starred`
          // handle their own cache invalidation; skip the double-fetch here.
          if (isNewApplication || isStageChange || isStatusChange) {
            invalidateBoard()
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
