import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '#/server/fn/notifications'
import type { NotificationPreferences } from '#/server/fn/notifications'

export const notificationPreferencesQueryKey = (userId?: string | null) =>
  ['notification-preferences', userId] as const

const defaultPreferences: NotificationPreferences = {
  email_notifications_enabled: true,
}

export const notificationPreferencesQueryOptions = (userId?: string | null) =>
  queryOptions({
    queryKey: notificationPreferencesQueryKey(userId),
    queryFn: () => fetchNotificationPreferences(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

export function useNotificationPreferences(userId?: string | null) {
  const queryClient = useQueryClient()
  const query = useQuery(notificationPreferencesQueryOptions(userId))

  const mutation = useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      updateNotificationPreferences({ data: prefs }),
    onSuccess: (saved) => {
      queryClient.setQueryData(notificationPreferencesQueryKey(userId), saved)
    },
  })

  return {
    preferences: query.data ?? defaultPreferences,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    error: mutation.error ?? query.error,
    updatePreferences: async (
      next: Partial<NotificationPreferences>,
    ): Promise<void> => {
      const merged = {
        ...(query.data ?? defaultPreferences),
        ...next,
      }
      await mutation.mutateAsync(merged)
    },
  }
}
