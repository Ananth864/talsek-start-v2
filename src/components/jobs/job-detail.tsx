import { useState } from 'react'
import { Globe, Mail, MapPin, Banknote } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { JobFormConfigDialog } from '#/components/forms/job-form-config-dialog'
import { countIncludedRequirements } from '#/lib/requirements'
import { getFormConfig, jobStatusMeta } from '#/lib/jobs-shared'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type JobDetailProps = {
  job?: JobWithCompanyRow
  companyId?: string | null
  canManageForms?: boolean
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString()
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

/**
 * The selected Job's detail context (the right-hand pane). Ports the read-only
 * fields of the source's `JobDetails` surface. The applicant pipeline that the
 * source shows alongside it is a later ticket; this pane establishes the
 * detail context a selected Job opens into.
 */
export function JobDetail({
  job,
  companyId = null,
  canManageForms = false,
}: JobDetailProps) {
  const [formConfigOpen, setFormConfigOpen] = useState(false)

  if (!job) {
    return (
      <div
        data-testid="job-detail-empty"
        className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground"
      >
        Select a job to view its details.
      </div>
    )
  }

  const created = formatDate(job.created_at)
  const preferredCount = countIncludedRequirements(
    job.preferred_requirements,
    'preferred',
  )
  const nonNegotiableCount = countIncludedRequirements(
    job.non_negotiables,
    'non_negotiable',
  )

  return (
    <div data-testid="job-detail" className="shrink-0 border-b p-4 md:p-5">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <Badge variant={jobStatusMeta(job.status).variant}>
              {jobStatusMeta(job.status).label}
            </Badge>
          </div>
          {job.companies.name ? (
            <p className="text-sm text-muted-foreground">{job.companies.name}</p>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {job.location ? (
            <DetailRow icon={MapPin} label="Location" value={job.location} />
          ) : null}
          {job.salary_range ? (
            <DetailRow
              icon={Banknote}
              label="Salary range"
              value={job.salary_range}
            />
          ) : null}
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
          {created ? <DetailRow label="Created" value={created} /> : null}

          <Separator />

          <DetailRow
            label="Preferred requirements"
            value={`${preferredCount} included`}
          />
          <DetailRow
            label="Non-negotiables"
            value={`${nonNegotiableCount} included`}
          />

          <Separator />

          <FormState
            job={job}
            canManageForms={canManageForms}
            onConfigure={() => setFormConfigOpen(true)}
          />
        </CardContent>
      </Card>

      <JobFormConfigDialog
        open={formConfigOpen}
        onOpenChange={setFormConfigOpen}
        companyId={companyId}
        jobId={job.id}
        jobTitle={job.title}
      />
    </div>
  )
}
