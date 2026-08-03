import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle,
  Globe,
  Mail,
  MapPin,
  Banknote,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Separator } from '#/components/ui/separator'
import { JobFormConfigDialog } from '#/components/forms/job-form-config-dialog'
import { useUpdateJobRequirements } from '#/hooks/use-update-job-requirements'
import {
  countIncludedRequirements,
  normalizeRequirementList,
} from '#/lib/requirements'
import { getFormConfig, jobStatusMeta } from '#/lib/jobs-shared'
import type { RequirementItemJson } from '#/integrations/supabase/types'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type JobDetailProps = {
  job?: JobWithCompanyRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId?: string | null
  canManageForms?: boolean
  /** Job-management capability (`canCreateJob`) — gates requirements edit. */
  canCreateJob?: boolean
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US')
}

function FormState({
  job,
  onConfigure,
  canManageForms,
}: {
  job: JobWithCompanyRow
  onConfigure: () => void
  canManageForms: boolean
}) {
  const formConfig = getFormConfig(job)
  const expired =
    formConfig?.expires_at && new Date(formConfig.expires_at) < new Date()
  const state = !formConfig
    ? 'Not configured'
    : !formConfig.is_enabled
      ? 'Disabled'
      : expired
        ? 'Expired'
        : 'Enabled'
  const detail = formConfig
    ? `${state} · token ${formConfig.form_url_token.slice(0, 8)}…`
    : state

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">Form Config</span>
      <div className="flex flex-col items-end gap-1">
        <span className="text-right font-medium break-words">{detail}</span>
        {canManageForms ? (
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={onConfigure}
            data-testid="configure-job-form"
          >
            {formConfig ? 'Edit form' : 'Configure form'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {Icon ? <Icon className="size-4" /> : null}
        {label}
      </span>
      <span className="text-right font-medium break-words">{value}</span>
    </div>
  )
}

function nextRequirementId(
  list: RequirementItemJson[],
  prefix: 'preferred' | 'non_negotiable',
): string {
  let max = 0
  for (const item of list) {
    const match = new RegExp(`^${prefix}_(\\d+)$`).exec(item.id)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `${prefix}_${max + 1}`
}

const toggleRequirement = (
  list: RequirementItemJson[],
  id: string,
  onChange: (next: RequirementItemJson[]) => void,
) => {
  onChange(
    list.map((req) =>
      req.id === id
        ? { ...req, include: req.include === false ? true : false }
        : req,
    ),
  )
}

const updateRequirementText = (
  list: RequirementItemJson[],
  id: string,
  text: string,
  onChange: (next: RequirementItemJson[]) => void,
) => {
  onChange(list.map((req) => (req.id === id ? { ...req, text } : req)))
}

const removeRequirement = (
  list: RequirementItemJson[],
  id: string,
  onChange: (next: RequirementItemJson[]) => void,
) => {
  onChange(list.filter((req) => req.id !== id))
}

const addRequirement = (
  list: RequirementItemJson[],
  prefix: 'preferred' | 'non_negotiable',
  onChange: (next: RequirementItemJson[]) => void,
) => {
  onChange([
    ...list,
    { id: nextRequirementId(list, prefix), text: '', include: true },
  ])
}

/**
 * Editable preferred / non-negotiable list: include/exclude, add, remove, and
 * text edit while in edit mode. View mode shows strikethrough for excluded
 * rows (source JobDetails parity).
 */
function RequirementsEditor({
  preferred,
  nonNegotiables,
  editing,
  onPreferredChange,
  onNonNegotiablesChange,
}: {
  preferred: RequirementItemJson[]
  nonNegotiables: RequirementItemJson[]
  editing: boolean
  onPreferredChange: (next: RequirementItemJson[]) => void
  onNonNegotiablesChange: (next: RequirementItemJson[]) => void
}) {
  const renderList = (
    label: string,
    testId: string,
    list: RequirementItemJson[],
    prefix: 'preferred' | 'non_negotiable',
    onChange: (next: RequirementItemJson[]) => void,
    Icon: React.ComponentType<{ className?: string }>,
    accent: string,
  ) => (
    <div
      data-testid={testId}
      className={`rounded-lg border border-l-4 ${accent} p-3`}
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4" />
        {label}
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">None yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((requirement) => (
            <li
              key={requirement.id}
              className="flex items-start gap-2 text-sm"
              data-testid={`requirement-row-${requirement.id}`}
            >
              {editing ? (
                <>
                  <Checkbox
                    checked={requirement.include !== false}
                    onCheckedChange={() =>
                      toggleRequirement(list, requirement.id, onChange)
                    }
                    aria-label={`Include ${requirement.text || 'requirement'}`}
                    data-testid={`requirement-include-${requirement.id}`}
                    className="mt-1"
                  />
                  <Input
                    value={requirement.text}
                    onChange={(e) =>
                      updateRequirementText(
                        list,
                        requirement.id,
                        e.target.value,
                        onChange,
                      )
                    }
                    aria-label={`${label} text`}
                    data-testid={`requirement-text-${requirement.id}`}
                    className="h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() =>
                      removeRequirement(list, requirement.id, onChange)
                    }
                    aria-label={`Remove ${label.toLowerCase()} row`}
                    data-testid={`requirement-remove-${requirement.id}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className={`mt-2 size-1.5 shrink-0 rounded-full ${
                      prefix === 'preferred'
                        ? 'bg-primary/40'
                        : 'bg-destructive/40'
                    }`}
                  />
                  <span
                    className={
                      requirement.include === false
                        ? 'min-w-0 break-words leading-relaxed text-muted-foreground line-through opacity-50'
                        : 'min-w-0 break-words leading-relaxed text-muted-foreground'
                    }
                  >
                    {requirement.text}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-fit"
          onClick={() => addRequirement(list, prefix, onChange)}
          data-testid={`requirement-add-${prefix}`}
        >
          <Plus className="size-4" />
          Add
        </Button>
      ) : null}
    </div>
  )

  return (
    <div
      data-testid="job-requirements"
      className="flex flex-col gap-3 md:grid md:grid-cols-2"
    >
      {renderList(
        'Non-negotiables',
        'job-requirements-non-negotiables',
        nonNegotiables,
        'non_negotiable',
        onNonNegotiablesChange,
        XCircle,
        'border-l-destructive/50',
      )}
      {renderList(
        'Preferred',
        'job-requirements-preferred',
        preferred,
        'preferred',
        onPreferredChange,
        CheckCircle,
        'border-l-primary/50',
      )}
    </div>
  )
}

/**
 * Job Details modal — ports the source's `JobDetails` Dialog. Opened from the
 * job-card edit control; selecting a Job for the candidate board remains a
 * separate list click (`?jobId=`).
 */
export function JobDetail({
  job,
  open,
  onOpenChange,
  companyId = null,
  canManageForms = false,
  canCreateJob = false,
}: JobDetailProps) {
  const [formConfigOpen, setFormConfigOpen] = useState(false)
  const [isEditingRequirements, setIsEditingRequirements] = useState(false)
  const [preferredDraft, setPreferredDraft] = useState<RequirementItemJson[]>(
    [],
  )
  const [nonNegotiableDraft, setNonNegotiableDraft] = useState<
    RequirementItemJson[]
  >([])
  const [requirementsError, setRequirementsError] = useState<string | null>(
    null,
  )
  const updateRequirements = useUpdateJobRequirements()

  const preferredList = useMemo(
    () => normalizeRequirementList(job?.preferred_requirements, 'preferred'),
    [job?.preferred_requirements],
  )
  const nonNegotiableList = useMemo(
    () => normalizeRequirementList(job?.non_negotiables, 'non_negotiable'),
    [job?.non_negotiables],
  )

  useEffect(() => {
    if (!isEditingRequirements) {
      setPreferredDraft(preferredList)
      setNonNegotiableDraft(nonNegotiableList)
    }
  }, [preferredList, nonNegotiableList, isEditingRequirements])

  // Reset edit mode when the modal closes or the Job changes.
  useEffect(() => {
    if (!open) {
      setIsEditingRequirements(false)
      setRequirementsError(null)
    }
  }, [open])

  useEffect(() => {
    setIsEditingRequirements(false)
    setRequirementsError(null)
  }, [job?.id])

  const created = formatDate(job?.created_at)
  const preferredCount = countIncludedRequirements(
    isEditingRequirements ? preferredDraft : job?.preferred_requirements,
    'preferred',
  )
  const nonNegotiableCount = countIncludedRequirements(
    isEditingRequirements ? nonNegotiableDraft : job?.non_negotiables,
    'non_negotiable',
  )

  const startEditingRequirements = () => {
    setPreferredDraft(preferredList)
    setNonNegotiableDraft(nonNegotiableList)
    setRequirementsError(null)
    setIsEditingRequirements(true)
  }

  const cancelEditingRequirements = () => {
    setPreferredDraft(preferredList)
    setNonNegotiableDraft(nonNegotiableList)
    setRequirementsError(null)
    setIsEditingRequirements(false)
  }

  const saveRequirements = () => {
    if (!job) return
    setRequirementsError(null)
    const preferred = preferredDraft
      .map((req) => ({ ...req, text: req.text.trim() }))
      .filter((req) => req.text.length > 0)
    const nonNegotiables = nonNegotiableDraft
      .map((req) => ({ ...req, text: req.text.trim() }))
      .filter((req) => req.text.length > 0)

    if (!preferred.some((req) => req.include !== false)) {
      setRequirementsError('Select at least one preferred requirement to save.')
      return
    }
    if (!nonNegotiables.some((req) => req.include !== false)) {
      setRequirementsError(
        'Select at least one non-negotiable requirement to save.',
      )
      return
    }

    updateRequirements.mutate(
      {
        jobId: job.id,
        preferred,
        nonNegotiables,
      },
      {
        onSuccess: () => {
          setIsEditingRequirements(false)
          setRequirementsError(null)
        },
        onError: (err) => {
          setRequirementsError(
            err instanceof Error
              ? err.message
              : 'Failed to update requirements',
          )
        },
      },
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-testid="job-detail"
          className="flex max-h-[90svh] max-w-5xl flex-col gap-0 overflow-hidden p-0"
        >
          {!job ? null : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b bg-muted/20 p-6 pb-4">
                <DialogHeader className="mb-3">
                  <div className="flex items-start justify-between gap-4 pr-8">
                    <div className="space-y-1">
                      <DialogTitle className="text-2xl font-bold tracking-tight">
                        {job.title}
                      </DialogTitle>
                      {job.companies.name ? (
                        <p className="text-sm text-muted-foreground">
                          {job.companies.name}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={jobStatusMeta(job.status).variant}>
                      {jobStatusMeta(job.status).label}
                    </Badge>
                  </div>
                </DialogHeader>
                <div className="flex flex-wrap gap-2">
                  {job.location ? (
                    <Badge variant="secondary" className="gap-1.5">
                      <MapPin className="size-3.5" />
                      {job.location}
                    </Badge>
                  ) : null}
                  {job.salary_range ? (
                    <Badge variant="outline" className="gap-1.5">
                      <Banknote className="size-3.5" />
                      {job.salary_range}
                    </Badge>
                  ) : null}
                  {created ? (
                    <Badge variant="secondary">Posted {created}</Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
                <div className="mx-auto flex max-w-5xl flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold tracking-tight">
                        Requirements
                      </h3>
                      {canCreateJob ? (
                        !isEditingRequirements ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={startEditingRequirements}
                            data-testid="edit-job-requirements"
                          >
                            Edit Requirements
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditingRequirements}
                              disabled={updateRequirements.isPending}
                              data-testid="cancel-job-requirements"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={saveRequirements}
                              disabled={updateRequirements.isPending}
                              data-testid="save-job-requirements"
                            >
                              {updateRequirements.isPending
                                ? 'Saving…'
                                : 'Save Changes'}
                            </Button>
                          </div>
                        )
                      ) : null}
                    </div>

                    <DetailRow
                      label="Preferred requirements"
                      value={`${preferredCount} included`}
                    />
                    <DetailRow
                      label="Non-negotiables"
                      value={`${nonNegotiableCount} included`}
                    />

                    <RequirementsEditor
                      preferred={
                        isEditingRequirements ? preferredDraft : preferredList
                      }
                      nonNegotiables={
                        isEditingRequirements
                          ? nonNegotiableDraft
                          : nonNegotiableList
                      }
                      editing={isEditingRequirements}
                      onPreferredChange={setPreferredDraft}
                      onNonNegotiablesChange={setNonNegotiableDraft}
                    />

                    {requirementsError ? (
                      <p
                        className="text-sm text-destructive"
                        role="alert"
                        data-testid="job-requirements-error"
                      >
                        {requirementsError}
                      </p>
                    ) : null}
                  </div>

                  <Separator />

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {job.job_posting_link ? (
                        <DetailRow
                          icon={Globe}
                          label="Posting link"
                          value={
                            <a
                              href={job.job_posting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {job.job_posting_link}
                            </a>
                          }
                        />
                      ) : null}
                      {job.forwarding_email ? (
                        <DetailRow
                          icon={Mail}
                          label="Forwarding email"
                          value={job.forwarding_email}
                        />
                      ) : null}
                      <FormState
                        job={job}
                        canManageForms={canManageForms}
                        onConfigure={() => setFormConfigOpen(true)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {job ? (
        <JobFormConfigDialog
          open={formConfigOpen}
          onOpenChange={setFormConfigOpen}
          companyId={companyId}
          jobId={job.id}
          jobTitle={job.title}
        />
      ) : null}
    </>
  )
}
