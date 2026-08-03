import { useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
} from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Loader2, Mail, Video } from 'lucide-react'
import { getAuthState } from '#/server/fn/auth'
import { fetchMemberProfile } from '#/server/fn/jobs'
import {
  useReachoutTemplates,
  useSaveReachoutTemplate,
} from '#/hooks/use-reachout-templates'
import { ReachoutTemplateForm } from '#/components/templates/reachout-template-form'
import {
  DEFAULT_INTERVIEW_TEMPLATE,
  DEFAULT_PROFESSIONAL_TEMPLATE,
  DEFAULT_REPLY_TO_EMAIL,
} from '#/lib/reachout-template-shared'
import { Button } from '#/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'

export const Route = createFileRoute('/reachout-templates')({
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (!user) {
      throw redirect({
        to: '/signin',
        search: { redirect: '/reachout-templates' },
      })
    }
    const profile = await fetchMemberProfile()
    return {
      companyId: profile?.company_id ?? null,
      canManageTemplates: Boolean(profile?.permissions.canManageTemplates),
    }
  },
  component: ReachoutTemplatesPage,
})

function ReachoutTemplatesPage() {
  const { companyId, canManageTemplates } = Route.useRouteContext()
  const { data, isLoading, error } = useReachoutTemplates(companyId)
  const saveTemplate = useSaveReachoutTemplate(companyId)
  const [activeTab, setActiveTab] = useState<'interview' | 'final'>('interview')
  const [banner, setBanner] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)
  const [localInterview, setLocalInterview] = useState<
    typeof DEFAULT_INTERVIEW_TEMPLATE | null
  >(null)
  const [localFinal, setLocalFinal] = useState<
    typeof DEFAULT_PROFESSIONAL_TEMPLATE | null
  >(null)

  const interviewTemplate =
    localInterview ?? data?.interview ?? DEFAULT_INTERVIEW_TEMPLATE
  const finalTemplate =
    localFinal ?? data?.reachout ?? DEFAULT_PROFESSIONAL_TEMPLATE
  const canEdit = canManageTemplates || Boolean(data?.canManageTemplates)

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/dashboard">
              <ArrowLeft className="size-4" />
              Jobs
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reachout Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage interview shortlist and final reachout messages.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/form-settings" data-testid="form-settings-nav">
            Forms
          </Link>
        </Button>
      </header>

      <main className="flex-1 space-y-4 p-4">
        {!canEdit ? (
          <div
            className="flex items-start gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            data-testid="templates-permission-alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            You don&apos;t have permission to update templates. Contact an admin
            to request access.
          </div>
        ) : null}

        {banner ? (
          <p
            className={
              banner.kind === 'error'
                ? 'rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'
                : 'rounded-md border px-3 py-2 text-sm'
            }
            data-testid="templates-banner"
          >
            {banner.message}
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading templates…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load templates'}
          </p>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as 'interview' | 'final')
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="interview" className="gap-2">
                <Video className="size-4" />
                Interview Shortlist
              </TabsTrigger>
              <TabsTrigger value="final" className="gap-2">
                <Mail className="size-4" />
                Final Reachout
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interview" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Must include{' '}
                <code className="rounded bg-muted px-1">{'{{interview_link}}'}</code>
                .
              </p>
              <ReachoutTemplateForm
                key={`interview-${interviewTemplate.created_at}-${interviewTemplate.subject}`}
                kind="interview"
                template={interviewTemplate}
                disabled={!canEdit}
                onResetLocal={() => {
                  setLocalInterview({
                    ...DEFAULT_INTERVIEW_TEMPLATE,
                    reply_to_email: DEFAULT_REPLY_TO_EMAIL,
                    created_at: new Date().toISOString(),
                  })
                  setBanner({
                    kind: 'success',
                    message:
                      'Interview template reset locally. Save to apply the changes.',
                  })
                }}
                onSave={async (template) => {
                  try {
                    await saveTemplate('interview', template)
                    setLocalInterview(null)
                    setBanner({
                      kind: 'success',
                      message: 'Interview shortlist template saved.',
                    })
                  } catch (err) {
                    setBanner({
                      kind: 'error',
                      message:
                        err instanceof Error
                          ? err.message
                          : 'Failed to save interview template.',
                    })
                    throw err
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="final" className="mt-4">
              <ReachoutTemplateForm
                key={`final-${finalTemplate.created_at}-${finalTemplate.subject}`}
                kind="final"
                template={finalTemplate}
                disabled={!canEdit}
                onResetLocal={() => {
                  setLocalFinal({
                    ...DEFAULT_PROFESSIONAL_TEMPLATE,
                    reply_to_email: DEFAULT_REPLY_TO_EMAIL,
                    created_at: new Date().toISOString(),
                  })
                  setBanner({
                    kind: 'success',
                    message:
                      'Reachout template reset locally. Save to apply the changes.',
                  })
                }}
                onSave={async (template) => {
                  try {
                    await saveTemplate('final', template)
                    setLocalFinal(null)
                    setBanner({
                      kind: 'success',
                      message: 'Final reachout template saved.',
                    })
                  } catch (err) {
                    setBanner({
                      kind: 'error',
                      message:
                        err instanceof Error
                          ? err.message
                          : 'Failed to save reachout template.',
                    })
                    throw err
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
