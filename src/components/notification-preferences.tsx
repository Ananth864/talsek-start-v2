import { Loader2 } from 'lucide-react'
import { useNotificationPreferences } from '#/hooks/use-notification-preferences'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'

type NotificationPreferencesProps = {
  userId: string | null
}

export function NotificationPreferencesPanel({
  userId,
}: NotificationPreferencesProps) {
  const { preferences, isLoading, isSaving, error, updatePreferences } =
    useNotificationPreferences(userId)

  if (!userId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please sign in to manage notification preferences.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4" data-testid="notification-preferences">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="email-notifications" className="text-base font-medium">
            Email Notifications
          </Label>
          <p className="text-sm text-muted-foreground">
            Daily summaries of new job applications
          </p>
        </div>
        <Switch
          id="email-notifications"
          data-testid="email-notifications-switch"
          checked={preferences.email_notifications_enabled}
          onCheckedChange={(enabled) => {
            void updatePreferences({ email_notifications_enabled: enabled })
          }}
          disabled={isSaving}
        />
      </div>

      {isSaving ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Saving...
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" data-testid="notification-prefs-error">
          {error instanceof Error
            ? error.message
            : 'Failed to update notification preferences.'}
        </p>
      ) : null}
    </div>
  )
}
