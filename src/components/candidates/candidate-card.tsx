import { ExternalLink, Star } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import { cn } from '#/lib/utils'
import { countIncludedRequirements } from '#/lib/requirements'
import { parsedSummary } from '#/lib/parsed-candidate'
import {
  applicationStatusMeta,
  normalizedMatchScore,
  scoreBand,
} from '#/lib/job-applications-shared'
import { ScoreRing } from './score-ring'
import type { JobApplicationRow } from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type CandidateCardProps = {
  application: JobApplicationRow
  job: JobWithCompanyRow
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString()
}

/**
 * A candidate row in the board (read path). Ports the visible surface of the
 * source's `CandidateCard`: match-score ring, name/email/applied date, resume
 * link, parsed-data summary (current role, experience, top skills), requirement
 * badges, and the Processing Status. The action controls (AI Analysis dialog,
 * Shortlist, Reject, star toggle) are write-path surfaces and port with the
 * candidate write-path tickets — the star renders read-only here.
 */
export function CandidateCard({ application, job }: CandidateCardProps) {
  const score = normalizedMatchScore(application)
  const parsed = parsedSummary(application.parsed_candidate_data)
  const email = application.candidate.email
  const name = application.candidate_name || parsed.name || email || 'Candidate'
  const applied = formatDate(application.created_at)
  const status = applicationStatusMeta(application.status)

  const preferredTotal = countIncludedRequirements(
    job.preferred_requirements,
    'preferred',
  )
  const preferredMet = application.preferred_requirements_matched
  const nonNegTotal = countIncludedRequirements(
    job.non_negotiables,
    'non_negotiable',
  )
  const allNonNegMet = application.meets_all_non_negotiables

  return (
    <Card
      data-testid="candidate-card"
      className={cn(
        'border border-l-4 bg-card transition-shadow hover:shadow-md',
        scoreBand(score).border,
      )}
    >
      <CardContent className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 max-w-full items-center gap-3 lg:basis-[34%] lg:max-w-[34%]">
            <ScoreRing score={score} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="truncate text-sm font-semibold" title={name}>
                  {name}
                </h4>
                {application.starred ? (
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                ) : null}
              </div>
              {email && email !== name ? (
                <p className="truncate text-xs text-muted-foreground" title={email}>
                  {email}
                </p>
              ) : null}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                {parsed.currentRole ? (
                  <span className="truncate">{parsed.currentRole}</span>
                ) : null}
                {parsed.years != null ? (
                  <span>· {parsed.years}y exp</span>
                ) : null}
                {parsed.location ? (
                  <span className="truncate">· {parsed.location}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:basis-[66%] lg:max-w-[66%]">
            {parsed.topSkills.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1">
                {parsed.topSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px] font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="font-medium text-muted-foreground">Preferred</span>
                <span className="font-semibold tabular-nums">
                  {preferredMet}/{preferredTotal}
                </span>
              </span>
              {nonNegTotal > 0 ? (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-muted-foreground">
                    Non-negotiables
                  </span>
                  {allNonNegMet ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      all met
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      not all met
                    </span>
                  )}
                </span>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={status.variant} data-testid="candidate-status">
                  {status.label}
                </Badge>
                {applied ? (
                  <span className="text-[11px] text-muted-foreground">
                    Applied {applied}
                  </span>
                ) : null}
              </div>
              {application.resume_url ? (
                <a
                  href={application.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                >
                  Resume
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
