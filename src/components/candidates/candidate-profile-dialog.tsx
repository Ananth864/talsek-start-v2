import { useRef, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Star,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { ScrollArea } from '#/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import type { RequirementWithAnalysis } from '#/lib/requirements'
import {
  candidateProfileModel,
  formatProfileDate,
  parseEmailBody,
} from '#/lib/candidate-profile-model'
import { matchBadgeVariant } from '#/lib/job-applications-shared'
import { useProcessJobApplicationPipeline } from '#/hooks/use-process-job-application-pipeline'
import { useInterviewSession } from '#/hooks/use-interview-session'
import { useFormSubmission } from '#/hooks/use-form-submission'
import { CandidateProfilePDFRenderer } from './candidate-profile-pdf-renderer'
import { InterviewAnalysis } from './interview-analysis'
import { FormAnswersSection } from './form-answers-section'
import type { JobApplicationRow } from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type CandidateProfileDialogProps = {
  application: JobApplicationRow
  job: JobWithCompanyRow
  open: boolean
  onClose: () => void
  /** Opens on this tab when the dialog mounts (final-stage analysis buttons). */
  initialTab?:
    | 'overview'
    | 'requirement-analysis'
    | 'interview'
    | 'resume'
    | 'email'
}

const tabTriggerClass =
  'data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full'

/**
 * Per-requirement verdict cards with the AI's evidence — shared by the
 * Non-Negotiables and Preferred sections of the Requirement Analysis tab.
 */
function RequirementDetailList({
  details,
}: {
  details: RequirementWithAnalysis[]
}) {
  return (
    <div className="space-y-3">
      {details.map((detail, index) => (
        <div
          key={index}
          className={`rounded-lg border p-3 ${
            detail.meets
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-200'
              : 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-900/20 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {detail.meets ? (
              <CheckCircle
                className="mt-0.5 flex-shrink-0 text-emerald-500 dark:text-emerald-300"
                size={16}
              />
            ) : (
              <XCircle
                className="mt-0.5 flex-shrink-0 text-rose-500 dark:text-rose-300"
                size={16}
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{detail.text || 'Requirement'}</p>
              {detail.evidence ? (
                <p className="mt-1 text-sm">{detail.evidence}</p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * The candidate profile detail (tickets #7 / #22; source:
 * `CandidateProfileDialog`). Opens from the board card and reads the same
 * cached board row (same query key), so its data is consistent with the board
 * by construction. Tabs: Overview, Requirement Analysis (plus Form Answers
 * when `processing_source === 'form'`), Interview (session Q&A + conversation
 * transcript), Resume Data, and Email. Header swaps Match → Interview score
 * when a session exists (source parity). "Download PDF" renders the hidden
 * `CandidateProfilePDFRenderer` and saves client-side via jspdf.
 */
export function CandidateProfileDialog({
  application,
  job,
  open,
  onClose,
  initialTab = 'overview',
}: CandidateProfileDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const processPipeline = useProcessJobApplicationPipeline()

  const { session: interviewSession, score: interviewScore } =
    useInterviewSession(application.id, open)
  const isFormSource = application.processing_source === 'form'
  const {
    data: formSubmissionData,
    isLoading: isLoadingFormData,
  } = useFormSubmission(
    application.candidate_id,
    application.job_id,
    open && isFormSource,
  )

  const model = candidateProfileModel(application, job)
  const {
    analysis,
    preferredSummary,
    nonNegotiableSummary,
    matchScore,
    profile,
    email,
    emailBody,
    emailAnalysis,
    hasEmailInsights,
    showEmailContent,
  } = model
  const { overallComponent, bonusComponent, overallWeight, preferredWeight, allNonNegMet } =
    model.scoreBreakdown

  const currentStage = application.current_stage
  const candidateName = model.candidateName ?? 'Candidate Profile'
  const parsedEmail = emailBody ? parseEmailBody(emailBody) : null

  const handleDownloadPdf = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      // Dynamic import keeps jspdf/html2canvas-pro out of the initial bundle
      // (and out of the SSR function — the export is client-only).
      const { exportCandidateProfilePdf } = await import(
        '#/lib/export-candidate-pdf'
      )
      // Wait for the hidden renderer to mount and paint (source parity).
      await new Promise((resolve) => setTimeout(resolve, 300))
      if (!pdfContainerRef.current) throw new Error('PDF renderer not ready')
      await exportCandidateProfilePdf(pdfContainerRef.current, candidateName)
    } catch (error) {
      console.error('PDF export failed:', error)
      setExportError('Failed to export the profile as PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleRerunPipeline = async () => {
    setPipelineError(null)
    try {
      await processPipeline.mutateAsync({ applicationId: application.id })
    } catch (error) {
      console.error('Resume AI pipeline failed:', error)
      setPipelineError(
        error instanceof Error
          ? error.message
          : 'Failed to run the Resume AI pipeline.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        data-testid="candidate-profile-dialog"
        className="flex h-[93vh] max-h-[93vh] w-[92vw] max-w-[70rem] flex-col gap-0 overflow-hidden p-0 sm:w-[80vw]"
      >
        <DialogHeader className="flex-shrink-0 border-b bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold">
                {candidateName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Full candidate profile: scores, requirement analysis, parsed
                resume data, and application source.
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} />
                <span>{email ?? 'No email'}</span>
                <span className="text-border">|</span>
                <Calendar size={14} />
                <span>
                  {/* The source header dated by candidate.created_at; the
                      application date keeps the header consistent with the
                      board card (ADR-0012 §3). */}
                  Applied{' '}
                  {formatProfileDate(
                    application.created_at,
                    'long',
                    'No date provided',
                  )}
                </span>
                <span className="text-border">|</span>
                <span className="font-medium text-primary">
                  {currentStage.hiring_stage.name}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {interviewSession ? (
                <Badge
                  variant={
                    interviewScore.scorePercent !== null &&
                    interviewScore.scorePercent >= 70
                      ? 'default'
                      : 'secondary'
                  }
                  className="px-3 py-1 text-base"
                  data-testid="profile-interview-score"
                >
                  Interview:{' '}
                  {interviewScore.scorePercent !== null
                    ? `${interviewScore.scorePercent}%`
                    : 'NA'}
                </Badge>
              ) : (
                <Badge
                  variant={matchBadgeVariant(matchScore)}
                  className="px-3 py-1 text-base"
                  data-testid="profile-match-score"
                >
                  Match: {matchScore}%
                </Badge>
              )}
              <div className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium">
                {application.meets_all_non_negotiables ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span>
                  {application.meets_all_non_negotiables
                    ? 'Meets Non-Negotiables'
                    : 'Missing Non-Negotiables'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRerunPipeline}
                disabled={processPipeline.isPending || !application.resume_url}
                data-testid="profile-rerun-ai"
              >
                {processPipeline.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Running AI…
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    Re-run AI
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                data-testid="profile-download-pdf"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
          {exportError ? (
            <p className="text-sm text-destructive">{exportError}</p>
          ) : null}
          {pipelineError ? (
            <p
              className="text-sm text-destructive"
              data-testid="profile-rerun-ai-error"
            >
              {pipelineError}
            </p>
          ) : null}
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Tabs
            key={open ? `open-${initialTab}` : 'closed'}
            defaultValue={initialTab}
            className="flex h-full flex-1 flex-col gap-0"
          >
            <div className="flex-shrink-0 border-b bg-card px-6">
              <TabsList className="h-12 w-full justify-start gap-4 rounded-none bg-transparent p-0">
                <TabsTrigger value="overview" className={tabTriggerClass}>
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="requirement-analysis"
                  className={tabTriggerClass}
                >
                  Requirement Analysis
                </TabsTrigger>
                <TabsTrigger value="interview" className={tabTriggerClass}>
                  Interview
                </TabsTrigger>
                <TabsTrigger value="resume" className={tabTriggerClass}>
                  Resume Data
                </TabsTrigger>
                <TabsTrigger value="email" className={tabTriggerClass}>
                  Email
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="min-h-0 flex-1 bg-muted/10">
              <div className="mx-auto max-w-5xl space-y-6 p-6">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-1 pt-4">
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Overall Fit
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="text-2xl font-bold text-primary">
                          {overallComponent}/{overallWeight}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                      <CardHeader className="pb-1 pt-4">
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Bonus Points
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="text-2xl font-bold text-emerald-600">
                          {preferredWeight > 0
                            ? `${bonusComponent}/${preferredWeight}`
                            : '0/0'}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                      <CardHeader className="pb-1 pt-4">
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Final Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="text-2xl font-bold">
                          {matchScore}/100
                        </div>
                        {!allNonNegMet && (
                          <p className="mt-1 text-xs text-rose-500">
                            Reduced by 50%
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {analysis?.recommendation ? (
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-primary" />
                          <CardTitle>AI Recommendation</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="mb-1 font-semibold">Verdict</div>
                          <p className="leading-relaxed text-muted-foreground">
                            {analysis.recommendation.replace(/_/g, ' ')}
                          </p>
                        </div>
                        {analysis.rationale ? (
                          <div>
                            <div className="mb-1 font-semibold">Rationale</div>
                            <p className="leading-relaxed text-muted-foreground">
                              {analysis.rationale}
                            </p>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ) : null}

                  <div className="grid grid-cols-1 gap-6">
                    {analysis &&
                    Array.isArray(analysis.strengths_for_role) &&
                    analysis.strengths_for_role.length > 0 ? (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Key Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
                            {analysis.strengths_for_role.map((strength, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                                <span>{strength}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}

                    {analysis &&
                    Array.isArray(analysis.potential_concerns) &&
                    analysis.potential_concerns.length > 0 ? (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Potential Concerns
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
                            {analysis.potential_concerns.map((concern, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
                                <span>{concern}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent
                  value="requirement-analysis"
                  className="mt-0 space-y-6"
                >
                  {analysis ? (
                    <>
                      {nonNegotiableSummary.included.length > 0 ? (
                        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-semibold text-foreground">
                              Non-Negotiables Analysis
                            </h4>
                            <span
                              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                                nonNegotiableSummary.totalCount > 0 &&
                                nonNegotiableSummary.metCount ===
                                  nonNegotiableSummary.totalCount
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
                              }`}
                            >
                              {nonNegotiableSummary.metCount}/
                              {nonNegotiableSummary.totalCount}
                            </span>
                          </div>
                          <RequirementDetailList
                            details={nonNegotiableSummary.included}
                          />
                        </div>
                      ) : null}

                      {preferredSummary.included.length > 0 ? (
                        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-foreground">
                              Preferred Requirements Analysis
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {preferredSummary.metCount}/
                              {preferredSummary.totalCount} matched
                            </span>
                          </div>
                          <RequirementDetailList
                            details={preferredSummary.included}
                          />
                        </div>
                      ) : null}

                      {isFormSource ? (
                        <FormAnswersSection
                          isLoading={isLoadingFormData}
                          data={formSubmissionData}
                        />
                      ) : null}
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-dashed border-border bg-muted p-12 text-center text-muted-foreground">
                        <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground">
                          No AI analysis available
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          This application has not been analysed yet.
                        </p>
                      </div>
                      {isFormSource ? (
                        <FormAnswersSection
                          isLoading={isLoadingFormData}
                          data={formSubmissionData}
                        />
                      ) : null}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="interview" className="mt-0 space-y-6">
                  {interviewSession ? (
                    <InterviewAnalysis
                      session={interviewSession}
                      candidateName={candidateName}
                      fallbackCreatedAt={application.updated_at}
                    />
                  ) : (
                    <div
                      className="rounded-lg border border-dashed border-border bg-muted p-12 text-center text-muted-foreground"
                      data-testid="interview-empty-state"
                    >
                      <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <h3 className="text-lg font-medium text-foreground">
                        No interview session found
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        This candidate has not participated in an interview
                        session yet.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="resume" className="mt-0 space-y-6">
                  {profile.isEmpty ? (
                    <div className="p-12 text-center text-muted-foreground">
                      No parsed data available.
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Parsed Data</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-10">
                        {(profile.summary || profile.info.length > 0) && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                                <FileText size={18} />
                              </div>
                              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                Candidate Information
                              </h3>
                            </div>
                            {profile.summary ? (
                              <div className="rounded-xl border bg-card p-5 shadow-sm">
                                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                  Summary
                                </h4>
                                <p className="text-sm font-medium text-foreground/90">
                                  {profile.summary}
                                </p>
                              </div>
                            ) : null}
                            {profile.info.length > 0 ? (
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {profile.info.map((entry) => (
                                  <div
                                    key={entry.label}
                                    className="rounded-xl border bg-card p-4 transition-colors hover:border-primary/20"
                                  >
                                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                      {entry.label}
                                    </h4>
                                    <p className="text-sm font-medium text-foreground/90">
                                      {entry.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}

                        {profile.workExperience.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                                <TrendingUp size={18} />
                              </div>
                              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                Work Experience
                              </h3>
                            </div>
                            <div className="relative ml-3 space-y-8 border-l-2 border-primary/20 py-2 pl-6">
                              {profile.workExperience.map((role, index) => (
                                <div key={index} className="relative">
                                  <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-background ring-4 ring-background" />
                                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <h4 className="text-base font-bold leading-tight text-foreground">
                                        {role.role || 'Position'}
                                      </h4>
                                      <div className="mt-0.5 text-sm font-semibold text-primary">
                                        {role.company || 'Company'}
                                      </div>
                                    </div>
                                    {role.duration ? (
                                      <div className="flex shrink-0 items-center gap-2 self-start rounded-md bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">
                                        <Calendar size={12} className="shrink-0" />
                                        <span>{role.duration}</span>
                                      </div>
                                    ) : null}
                                  </div>
                                  {role.experience_details &&
                                  role.experience_details.length > 0 ? (
                                    <ul className="mt-2 space-y-1.5">
                                      {role.experience_details.map(
                                        (point, ptIdx) => (
                                          <li
                                            key={ptIdx}
                                            className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/80"
                                          >
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                                            <span>{point}</span>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {profile.education.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                                <GraduationCap size={18} />
                              </div>
                              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                Education
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {profile.education.map((edu, index) => (
                                <div
                                  key={index}
                                  className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:bg-muted/30"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                      <GraduationCap size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5
                                        className="truncate font-semibold text-foreground"
                                        title={edu.degree}
                                      >
                                        {edu.degree || 'Degree'}
                                        {edu.field ? ` — ${edu.field}` : ''}
                                      </h5>
                                      <p
                                        className="truncate text-sm font-medium text-primary/80"
                                        title={edu.institution}
                                      >
                                        {edu.institution || 'Institution'}
                                      </p>
                                      {edu.year ? (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 font-medium ring-1 ring-inset ring-foreground/10">
                                            {edu.year}
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(profile.technicalSkills.length > 0 ||
                          profile.softSkills.length > 0 ||
                          profile.certifications.length > 0) && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                                <CheckCircle size={18} />
                              </div>
                              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                Skills & Expertise
                              </h3>
                            </div>
                            <div className="space-y-4 rounded-xl border bg-card/50 p-4">
                              {(
                                [
                                  ['Technical skills', profile.technicalSkills],
                                  ['Soft skills', profile.softSkills],
                                ] as const
                              ).map(([label, skills]) =>
                                skills.length > 0 ? (
                                  <div key={label}>
                                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      {label}
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {skills.map((skill, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground"
                                          title={skill.justification}
                                        >
                                          {skill.skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null,
                              )}
                              {profile.certifications.length > 0 ? (
                                <div>
                                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Certifications
                                  </h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {profile.certifications.map((cert, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground"
                                      >
                                        {cert}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="email" className="mt-0 space-y-6">
                  {showEmailContent ? (
                    <>
                      {hasEmailInsights && emailAnalysis ? (
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                          <div className="mb-3 flex items-center text-foreground">
                            <Mail className="mr-2 h-5 w-5 text-primary" />
                            <h4 className="font-semibold">Email Insights</h4>
                          </div>
                          <div className="space-y-4 text-sm text-muted-foreground">
                            {emailAnalysis.candidate_highlights.length > 0 && (
                              <div>
                                <span className="font-medium text-foreground">
                                  Key points about the candidate:
                                </span>
                                <ul className="mt-2 space-y-1">
                                  {emailAnalysis.candidate_highlights.map(
                                    (highlight, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start space-x-2 leading-relaxed"
                                      >
                                        <span className="mt-1 text-primary">
                                          •
                                        </span>
                                        <span>{highlight}</span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                            {emailAnalysis.company_join_highlights.length >
                              0 && (
                              <div>
                                <span className="font-medium text-foreground">
                                  Why the candidate wants to join the company:
                                </span>
                                <ul className="mt-2 space-y-1 leading-relaxed">
                                  {emailAnalysis.company_join_highlights.map(
                                    (highlight, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start space-x-2"
                                      >
                                        <span className="mt-1 text-primary">
                                          •
                                        </span>
                                        <span>{highlight}</span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {parsedEmail ? (
                        <>
                          {parsedEmail.subject ||
                          parsedEmail.from ||
                          parsedEmail.to ||
                          parsedEmail.date ? (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                              <h4 className="mb-3 text-lg font-semibold text-foreground">
                                Email Details
                              </h4>
                              <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-2">
                                {(
                                  [
                                    ['Subject', parsedEmail.subject],
                                    ['From', parsedEmail.from],
                                    ['To', parsedEmail.to],
                                    ['Date', parsedEmail.date],
                                  ] as const
                                ).map(([label, value]) =>
                                  value ? (
                                    <div
                                      key={label}
                                      className="flex items-start space-x-2"
                                    >
                                      <span className="min-w-16 font-medium text-foreground">
                                        {label}:
                                      </span>
                                      <span>{value}</span>
                                    </div>
                                  ) : null,
                                )}
                              </div>
                            </div>
                          ) : null}

                          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h4 className="mb-3 text-lg font-semibold text-foreground">
                              Message Content
                            </h4>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                              {parsedEmail.content || emailBody}
                            </div>
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted p-12 text-center text-muted-foreground">
                      <Mail className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <h3 className="text-lg font-medium text-foreground">
                        Application not submitted through email
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        This candidate applied through another source.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>

      {/* Hidden PDF renderer — mounts while exporting */}
      {isExporting ? (
        <div
          ref={pdfContainerRef}
          className="fixed left-[-9999px] top-0 w-[800px] bg-white"
          aria-hidden="true"
        >
          <CandidateProfilePDFRenderer
            candidates={[application]}
            job={job}
          />
        </div>
      ) : null}
    </Dialog>
  )
}
