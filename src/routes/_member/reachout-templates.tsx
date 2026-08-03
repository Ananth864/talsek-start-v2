import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  Loader2,
  Mail,
  RotateCcw,
  Save,
  Video,
} from 'lucide-react'
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

export const Route = createFileRoute('/_member/reachout-templates')({
  component: ReachoutTemplatesPage,
})

function ReachoutTemplatesPage() {
  const { companyId, canManageTemplates } = Route.useRouteContext()
  const { data, isLoading, error } = useReachoutTemplates(companyId)
  const saveTemplate = useSaveReachoutTemplate(companyId)
  const [activeTab, setActiveTab] = useState<'interview' | 'final'>('interview')
  const [isSaving, setIsSaving] = useState(false)
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
  const isActionDisabled = isSaving || !canEdit
  const activeFormId = `reachout-${activeTab}-form`

  const handleReset = () => {
    if (!canEdit) {
      setBanner({
        kind: 'error',
        message: 'You do not have permission to manage templates.',
      })
      return
    }
    if (activeTab === 'interview') {
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
    } else {
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
    }
  }

  return (
    <div
      className="flex w-full flex-col"
      data-testid="reachout-templates-page"
    >
      <header
        className="border-b bg-card"
        data-testid="reachout-templates-header"
      >
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Reachout Templates</h1>
            <p className="text-sm text-muted-foreground">
              Manage the messages used when inviting candidates to interviews
              and sending final reachouts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleReset}
              disabled={isActionDisabled || isLoading}
              data-testid={`reset-template-${activeTab}`}
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
            <Button
              type="submit"
              form={activeFormId}
              className="gap-2"
              disabled={isActionDisabled || isLoading}
              data-testid={`save-template-${activeTab}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-6 py-8">
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
            <TabsList className="grid w-full grid-cols-2 bg-muted/60">
              <TabsTrigger value="interview" className="gap-2">
                <Video className="size-4" />
                Interview Shortlist
              </TabsTrigger>
              <TabsTrigger value="final" className="gap-2">
                <Mail className="size-4" />
                Final Reachout
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interview" className="mt-4 space-y-6">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Video className="h-5 w-5 text-primary" />
                  Interview Shortlist Template
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customize the message candidates receive when they are
                  shortlisted for the screening interview. Remember to include
                  the{' '}
                  <code className="rounded bg-muted px-1">
                    {'{{interview_link}}'}
                  </code>{' '}
                  variable.
                </p>
              </div>
              <ReachoutTemplateForm
                key={`interview-${interviewTemplate.created_at}-${interviewTemplate.subject}`}
                kind="interview"
                template={interviewTemplate}
                disabled={!canEdit}
                onSave={async (template) => {
                  setIsSaving(true)
                  setBanner(null)
                  try {
                    await saveTemplate('interview', template)
                    setLocalInterview(null)
                    setBanner({
                      kind: 'success',
                      message: 'Interview shortlist template saved successfully.',
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
                  } finally {
                    setIsSaving(false)
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="final" className="mt-4 space-y-6">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Mail className="h-5 w-5 text-primary" />
                  Final Reachout Template
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customize the message sent to candidates who complete the
                  process. Personalize using the available variables.
                </p>
              </div>
              <ReachoutTemplateForm
                key={`final-${finalTemplate.created_at}-${finalTemplate.subject}`}
                kind="final"
                template={finalTemplate}
                disabled={!canEdit}
                onSave={async (template) => {
                  setIsSaving(true)
                  setBanner(null)
                  try {
                    await saveTemplate('final', template)
                    setLocalFinal(null)
                    setBanner({
                      kind: 'success',
                      message: 'Final reachout template saved successfully.',
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
                  } finally {
                    setIsSaving(false)
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
