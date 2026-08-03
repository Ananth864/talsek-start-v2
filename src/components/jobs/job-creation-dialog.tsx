import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Minus,
  Plus,
  Video,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import { JobCreationSuccessDialog } from '#/components/jobs/job-creation-success-dialog'
import { JobFormConfigDialog } from '#/components/forms/job-form-config-dialog'
import { useCreateJob } from '#/hooks/use-create-job'
import { useParseJobDescription } from '#/hooks/use-parse-job-description'
import {
  JOBS_QUERY_KEY_PREFIX,
  SALARY_CURRENCY_PREFIX,
  getJobApplyFormLink,
} from '#/lib/jobs-shared'
import {
  DEFAULT_LOGISTICS,
  EXPECTED_JOINING_DATE_VALUES,
  HYBRID_WORK_ARRANGEMENT_LABELS,
  HYBRID_WORK_ARRANGEMENT_VALUES,
  LOCATION_MODE_VALUES,
  SHIFT_TIME_VALUES,
  SHIFT_TIMINGS_TYPE_VALUES,
  TRAVEL_PERCENTAGE_VALUES,
  TRAVEL_REQUIRED_VALUES,
  buildScreeningInfo,
  getJobLocationValue,
  logisticsParseContext,
  validateLogisticsForParse,
} from '#/lib/job-creation-shared'
import type {
  ExpectedJoiningDate,
  JobLogisticsFields,
  LocationMode,
  ServiceType,
  ShiftTimingsType,
  TravelRequired,
} from '#/lib/job-creation-shared'
import type { CreateJobInput, JobWithCompanyRow } from '#/server/fn/jobs'
import type { ParsedJobDataJson } from '#/integrations/supabase/types'

type SalaryCurrency = keyof typeof SALARY_CURRENCY_PREFIX

type JobCreationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyName: string
  companyId: string | null
  canManageForms?: boolean
}

const EMPTY_PARSED: ParsedJobDataJson = {
  preferred_requirements: [],
  non_negotiables: [],
  role_readiness_summary: '',
  role_readiness_questions: [],
}

/**
 * Create-Job dialog (focused port of the source's `JobCreationDialog`).
 *
 * Keeps the 2-step flow from #5 (details → review) and restores the logistics
 * fields the 4-step collapse dropped (#28): joining date, location mode /
 * details / hybrid arrangement, shift, and travel. Those values populate
 * `screening_interview_information` (interview-question generation) and a
 * logistics context block on the JD parse input. Post-create success + Form
 * Config are opt-in surfaces, not forced wizard steps.
 */
export function JobCreationDialog({
  open,
  onOpenChange,
  companyName,
  companyId,
  canManageForms = false,
}: JobCreationDialogProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [jobPostingLink, setJobPostingLink] = useState('')
  const [location, setLocation] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState<SalaryCurrency>('USD')
  const [serviceType, setServiceType] = useState<ServiceType>('resume_only')
  const [logistics, setLogistics] = useState<JobLogisticsFields>(DEFAULT_LOGISTICS)
  const [jobDescription, setJobDescription] = useState('')
  const [preferred, setPreferred] = useState<string[]>([])
  const [nonNegotiables, setNonNegotiables] = useState<string[]>([])
  const [parsedJobData, setParsedJobData] =
    useState<ParsedJobDataJson>(EMPTY_PARSED)
  const [error, setError] = useState<string | null>(null)

  const [successOpen, setSuccessOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [createdJobId, setCreatedJobId] = useState<string | null>(null)
  const [createdJobTitle, setCreatedJobTitle] = useState('')
  const [forwardingEmail, setForwardingEmail] = useState('')
  const [formLink, setFormLink] = useState<string | null>(null)
  const [formConfigOpen, setFormConfigOpen] = useState(false)

  const parseMutation = useParseJobDescription()
  const createMutation = useCreateJob()

  const patchLogistics = (patch: Partial<JobLogisticsFields>) => {
    setLogistics((prev) => ({ ...prev, ...patch }))
  }

  const reset = () => {
    setStep(1)
    setTitle('')
    setJobPostingLink('')
    setLocation('')
    setSalaryRange('')
    setSalaryCurrency('USD')
    setServiceType('resume_only')
    setLogistics(DEFAULT_LOGISTICS)
    setJobDescription('')
    setPreferred([])
    setNonNegotiables([])
    setParsedJobData(EMPTY_PARSED)
    setError(null)
  }

  const closeCreate = () => {
    onOpenChange(false)
    // Defer reset so the close animation isn't interrupted mid-flight.
    setTimeout(reset, 200)
  }

  const refreshFormLink = async (jobId: string) => {
    await queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY_PREFIX })
    await queryClient.refetchQueries({ queryKey: JOBS_QUERY_KEY_PREFIX })
    const jobs = queryClient.getQueriesData<JobWithCompanyRow[]>({
      queryKey: JOBS_QUERY_KEY_PREFIX,
    })
    for (const [, data] of jobs) {
      const job = data?.find((row) => row.id === jobId)
      if (!job) continue
      const link = getJobApplyFormLink(job, window.location.origin)
      if (link) {
        setFormLink(link)
        return
      }
    }
  }

  const handleParseAndAdvance = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Job title is required.')
      return
    }
    if (!jobDescription.trim()) {
      setError('Paste a job description so it can be analysed.')
      return
    }
    const logisticsError = validateLogisticsForParse(serviceType, logistics)
    if (logisticsError) {
      setError(logisticsError)
      return
    }

    const locationForParse = getJobLocationValue(
      serviceType,
      logistics,
      location,
    )
    const descriptionForParse =
      serviceType === 'resume_interview'
        ? `${jobDescription.trim()}\n\n${logisticsParseContext(logistics)}`
        : jobDescription

    try {
      const result = await parseMutation.mutateAsync({
        title: title.trim(),
        location: locationForParse,
        salary: salaryRange,
        jobDescription: descriptionForParse,
        companyName,
      })
      setParsedJobData(result)
      setPreferred(
        result.preferred_requirements.length
          ? result.preferred_requirements
          : [''],
      )
      setNonNegotiables(
        result.non_negotiables.length ? result.non_negotiables : [''],
      )
      setStep(2)
    } catch {
      // Source parity: still advance to manual entry on parse failure.
      setPreferred([''])
      setNonNegotiables([''])
      setStep(2)
    }
  }

  const requestCreate = () => {
    setError(null)
    const cleanPreferred = preferred.map((s) => s.trim()).filter(Boolean)
    const cleanNonNeg = nonNegotiables.map((s) => s.trim()).filter(Boolean)
    if (cleanPreferred.length === 0 || cleanNonNeg.length === 0) {
      setError('Add at least one preferred and one non-negotiable requirement.')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmedSubmit = async () => {
    setError(null)
    const cleanPreferred = preferred.map((s) => s.trim()).filter(Boolean)
    const cleanNonNeg = nonNegotiables.map((s) => s.trim()).filter(Boolean)

    const formattedSalary = salaryRange
      ? `${SALARY_CURRENCY_PREFIX[salaryCurrency]}${salaryRange}`
      : ''

    const payload: CreateJobInput = {
      title: title.trim(),
      jobPostingLink: jobPostingLink.trim(),
      location: getJobLocationValue(serviceType, logistics, location),
      salaryRange: formattedSalary,
      jobDescription,
      preferredRequirements: cleanPreferred,
      nonNegotiables: cleanNonNeg,
      serviceType,
      parsedJobData: {
        ...parsedJobData,
        preferred_requirements: cleanPreferred,
        non_negotiables: cleanNonNeg,
      },
      screeningInterviewInformation: buildScreeningInfo(serviceType, logistics),
    }

    try {
      const result = await createMutation.mutateAsync(payload)
      setConfirmOpen(false)
      setCreatedJobId(result.id)
      setCreatedJobTitle(title.trim())
      setForwardingEmail(result.forwardingEmail)
      setFormLink(null)
      closeCreate()
      setSuccessOpen(true)
    } catch (err) {
      setConfirmOpen(false)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create the job. Please try again.',
      )
    }
  }

  const parsing = parseMutation.isPending
  const creating = createMutation.isPending

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeCreate()
        }}
      >
        <DialogContent
          data-testid="job-creation-dialog"
          className="flex h-[95vh] max-h-[95vh] w-full max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[95vw]"
        >
          <div className="z-10 border-b bg-background px-6 py-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {step === 1 ? 'Job Details' : 'Review Requirements'}
                </DialogTitle>
                <div
                  className="text-sm font-medium text-muted-foreground"
                  data-testid="job-creation-step"
                >
                  Step {step} of 2
                </div>
              </div>
              <div
                className="flex gap-1.5 pt-1"
                data-testid="job-creation-progress"
                aria-hidden
              >
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-all duration-300',
                      step >= n ? 'bg-primary' : 'bg-muted',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {step === 1 ? (
                <div className="flex flex-col gap-8">
                  <ServiceTypeSelection
                    selectedType={serviceType}
                    onSelect={setServiceType}
                  />

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="order-1 flex flex-col gap-4 lg:col-span-5">
                      <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                        <h3 className="mb-2 flex items-center text-sm font-semibold text-foreground/80">
                          <FileText className="mr-2 size-4" />
                          Key Details
                        </h3>

                        <div className="flex flex-col gap-2">
                          <Label htmlFor="jc-title">Job Title *</Label>
                          <Input
                            id="jc-title"
                            value={title}
                            onChange={(e) =>
                              setTitle(e.target.value.slice(0, 40))
                            }
                            placeholder="e.g., Senior Software Engineer"
                            maxLength={40}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label htmlFor="jc-code">Job Code</Label>
                          <Input
                            id="jc-code"
                            value={jobPostingLink}
                            onChange={(e) => setJobPostingLink(e.target.value)}
                            placeholder="ENG-2026-001"
                          />
                        </div>

                        {serviceType === 'resume_interview' ? (
                          <LogisticsFields
                            logistics={logistics}
                            onChange={patchLogistics}
                          />
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="jc-location">Location</Label>
                            <Input
                              id="jc-location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="e.g. Bengaluru, IN"
                            />
                          </div>
                        )}

                        <div className="flex items-end gap-2">
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <Label htmlFor="jc-salary">Yearly CTC</Label>
                            <Input
                              id="jc-salary"
                              inputMode="numeric"
                              value={salaryRange}
                              onChange={(e) => setSalaryRange(e.target.value)}
                              placeholder="120000"
                            />
                          </div>
                          <div className="flex w-20 flex-col gap-2">
                            <Label htmlFor="jc-currency" className="sr-only">
                              Currency
                            </Label>
                            <Select
                              value={salaryCurrency}
                              onValueChange={(v) =>
                                setSalaryCurrency(v as SalaryCurrency)
                              }
                            >
                              <SelectTrigger id="jc-currency" className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">$</SelectItem>
                                <SelectItem value="INR">₹</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="order-2 flex min-h-[320px] flex-col lg:col-span-7 lg:min-h-[480px]">
                      <div className="flex h-full min-h-0 flex-col gap-2">
                        <Label htmlFor="jc-jd">Job Description *</Label>
                        <Textarea
                          id="jc-jd"
                          data-testid="job-description-input"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste the full job description here…"
                          className="min-h-[280px] flex-1 resize-none lg:min-h-[420px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          This formatting will be preserved in application forms
                        </p>
                      </div>
                    </div>
                  </div>

                  {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2">
                  <RequirementListEditor
                    label="Preferred Requirements"
                    description="Nice-to-have qualifications"
                    tone="preferred"
                    items={preferred}
                    onChange={setPreferred}
                  />
                  <RequirementListEditor
                    label="Non-Negotiables"
                    description="Must-have qualifications"
                    tone="nonNegotiable"
                    items={nonNegotiables}
                    onChange={setNonNegotiables}
                  />
                  {error ? (
                    <p
                      className="text-sm text-destructive md:col-span-2"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t bg-background px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreate}
                  disabled={parsing || creating}
                >
                  Cancel
                </Button>
                {step === 2 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setError(null)
                      setStep(1)
                    }}
                    disabled={creating}
                  >
                    Back
                  </Button>
                ) : null}
              </div>
              {step === 1 ? (
                <Button
                  type="button"
                  onClick={handleParseAndAdvance}
                  disabled={parsing}
                  data-testid="job-creation-next"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={requestCreate}
                  disabled={creating}
                  data-testid="job-creation-create"
                >
                  Create Job Posting
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          data-testid="job-creation-confirm"
          className="max-w-md border border-amber-200 bg-card shadow-xl dark:border-amber-400/40"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              Confirm Job Creation
            </DialogTitle>
            <div className="space-y-2 leading-relaxed text-foreground">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/40 dark:bg-amber-900/20">
                <div className="mb-2 font-medium text-amber-800 dark:text-amber-200">
                  Please review before creating:
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-100">
                  <li>Form configurations cannot be updated later</li>
                  <li>Preferred requirements cannot be changed</li>
                  <li>Non-negotiables cannot be modified</li>
                </ul>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Make sure all settings are correct before proceeding.
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-400/40 dark:text-amber-200 dark:hover:bg-amber-900/10"
              onClick={() => setConfirmOpen(false)}
              disabled={creating}
            >
              Go Back to Editing
            </Button>
            <Button
              type="button"
              className="flex-1 bg-amber-600 text-amber-50 hover:bg-amber-700 dark:bg-amber-500 dark:text-amber-100 dark:hover:bg-amber-600"
              onClick={handleConfirmedSubmit}
              disabled={creating}
              data-testid="job-creation-confirm-submit"
            >
              {creating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Confirm & Create Job'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <JobCreationSuccessDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        forwardingEmail={forwardingEmail}
        formLink={formLink}
        canManageForms={canManageForms}
        onConfigureForm={
          createdJobId
            ? () => {
                setFormConfigOpen(true)
              }
            : undefined
        }
      />

      {createdJobId ? (
        <JobFormConfigDialog
          open={formConfigOpen}
          onOpenChange={(next) => {
            setFormConfigOpen(next)
            if (!next) {
              void refreshFormLink(createdJobId)
            }
          }}
          companyId={companyId}
          jobId={createdJobId}
          jobTitle={createdJobTitle}
        />
      ) : null}
    </>
  )
}

function ServiceTypeSelection({
  selectedType,
  onSelect,
}: {
  selectedType: ServiceType
  onSelect: (type: ServiceType) => void
}) {
  return (
    <div className="space-y-6" data-testid="job-service-type-selection">
      <div className="text-center">
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          Choose Your Screening Process
        </h3>
        <p className="text-sm text-muted-foreground">
          Select how you want to evaluate candidates for this role
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ServiceTypeCard
          selected={selectedType === 'resume_only'}
          onSelect={() => onSelect('resume_only')}
          icon={<FileText className="size-6" />}
          title="Resume Screening Only"
          description="AI-powered resume analysis and candidate scoring"
          bullets={[
            'Automated resume parsing and evaluation',
            'Candidate ranking based on job requirements',
            'Fast initial screening process',
          ]}
        />
        <ServiceTypeCard
          selected={selectedType === 'resume_interview'}
          onSelect={() => onSelect('resume_interview')}
          icon={<Video className="size-6" />}
          title="Resume + Screening Interview"
          description="Complete evaluation with AI interviews for deeper insights"
          bullets={[
            'Everything in Resume Screening',
            'AI-powered screening interviews',
            'Comprehensive candidate assessment',
          ]}
        />
      </div>
    </div>
  )
}

function ServiceTypeCard({
  selected,
  onSelect,
  icon,
  title,
  description,
  bullets,
}: {
  selected: boolean
  onSelect: () => void
  icon: ReactNode
  title: string
  description: string
  bullets: string[]
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'cursor-pointer gap-0 border-2 py-0 transition-all duration-300 hover:shadow-lg',
        selected
          ? 'border-primary bg-primary/10 shadow-lg'
          : 'border-border hover:border-primary/40',
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'rounded-lg p-3',
                selected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-primary',
              )}
            >
              {icon}
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {selected ? (
            <div className="rounded-full bg-primary p-1 text-primary-foreground">
              <Check className="size-4" />
            </div>
          ) : null}
        </div>
        <CardDescription className="mt-3">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start">
              <Check className="mt-0.5 mr-2 size-4 shrink-0 text-accent-foreground" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function LogisticsFields({
  logistics,
  onChange,
}: {
  logistics: JobLogisticsFields
  onChange: (patch: Partial<JobLogisticsFields>) => void
}) {
  return (
    <div
      data-testid="job-logistics-fields"
      className="flex flex-col gap-3 rounded-md border border-dashed p-3"
    >
      <p className="text-xs font-medium text-muted-foreground">Logistics</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="jc-joining">Joining date</Label>
          <Select
            value={logistics.expectedJoiningDate}
            onValueChange={(v) =>
              onChange({ expectedJoiningDate: v as ExpectedJoiningDate })
            }
          >
            <SelectTrigger id="jc-joining" data-testid="jc-joining">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPECTED_JOINING_DATE_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="jc-locmode">Location type</Label>
          <Select
            value={logistics.locationMode}
            onValueChange={(v) =>
              onChange({
                locationMode: v as LocationMode,
                locationDetails: '',
                workArrangement: '',
              })
            }
          >
            <SelectTrigger id="jc-locmode" data-testid="jc-locmode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_MODE_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v === 'Work From office' ? 'Work from office' : v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {logistics.locationMode !== 'Remote (Anywhere)' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="jc-location-details">
              {logistics.locationMode === 'Remote (In Country)'
                ? 'Country'
                : 'Office location'}
            </Label>
            <Input
              id="jc-location-details"
              data-testid="jc-location-details"
              value={logistics.locationDetails}
              onChange={(e) => onChange({ locationDetails: e.target.value })}
              placeholder={
                logistics.locationMode === 'Remote (In Country)'
                  ? 'Country'
                  : 'Office location'
              }
            />
          </div>
          {logistics.locationMode === 'Hybrid' ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="jc-hybrid">Hybrid arrangement</Label>
              <Select
                value={logistics.workArrangement || undefined}
                onValueChange={(v) => onChange({ workArrangement: v })}
              >
                <SelectTrigger id="jc-hybrid" data-testid="jc-hybrid">
                  <SelectValue placeholder="Select arrangement" />
                </SelectTrigger>
                <SelectContent>
                  {HYBRID_WORK_ARRANGEMENT_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {HYBRID_WORK_ARRANGEMENT_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 border-t border-dashed pt-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="jc-shift">Shift</Label>
          <Select
            value={logistics.shiftTimingsType}
            onValueChange={(v) => {
              const shiftTimingsType = v as ShiftTimingsType
              onChange(
                shiftTimingsType === 'Custom'
                  ? { shiftTimingsType }
                  : {
                      shiftTimingsType,
                      shiftStartTime: '',
                      shiftEndTime: '',
                    },
              )
            }}
          >
            <SelectTrigger id="jc-shift" data-testid="jc-shift">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIFT_TIMINGS_TYPE_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v === 'Standard (9 AM - 5 PM)' ? 'Standard' : v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="jc-travel">Travel</Label>
          <Select
            value={logistics.travelRequired}
            onValueChange={(v) => {
              const travelRequired = v as TravelRequired
              onChange(
                travelRequired === 'Yes'
                  ? { travelRequired }
                  : { travelRequired, travelPercentage: '' },
              )
            }}
          >
            <SelectTrigger id="jc-travel" data-testid="jc-travel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRAVEL_REQUIRED_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {logistics.shiftTimingsType === 'Custom' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="jc-shift-start">Start time</Label>
            <Select
              value={logistics.shiftStartTime || undefined}
              onValueChange={(v) => onChange({ shiftStartTime: v })}
            >
              <SelectTrigger id="jc-shift-start" data-testid="jc-shift-start">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_TIME_VALUES.map((time) => (
                  <SelectItem key={time} value={time}>
                    {formatShiftLabel(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="jc-shift-end">End time</Label>
            <Select
              value={logistics.shiftEndTime || undefined}
              onValueChange={(v) => onChange({ shiftEndTime: v })}
            >
              <SelectTrigger id="jc-shift-end" data-testid="jc-shift-end">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_TIME_VALUES.map((time) => (
                  <SelectItem key={time} value={time}>
                    {formatShiftLabel(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {logistics.travelRequired === 'Yes' ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="jc-travel-pct">Travel %</Label>
          <Select
            value={logistics.travelPercentage || undefined}
            onValueChange={(v) => onChange({ travelPercentage: v })}
          >
            <SelectTrigger id="jc-travel-pct" data-testid="jc-travel-pct">
              <SelectValue placeholder="Select travel percentage" />
            </SelectTrigger>
            <SelectContent>
              {TRAVEL_PERCENTAGE_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  )
}

function formatShiftLabel(time: string): string {
  const hour = Number.parseInt(time.split(':')[0] ?? '0', 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${time} – ${displayHour} ${ampm}`
}

/** Side-by-side review panel matching source requirement editors. */
function RequirementListEditor({
  label,
  description,
  tone,
  items,
  onChange,
}: {
  label: string
  description: string
  tone: 'preferred' | 'nonNegotiable'
  items: string[]
  onChange: (items: string[]) => void
}) {
  const update = (index: number, value: string) => {
    const next = [...items]
    next[index] = value
    onChange(next)
  }
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }
  const add = () => {
    onChange([...items, ''])
  }

  const panelClass =
    tone === 'preferred'
      ? 'border-blue-100 bg-blue-50/50 dark:border-blue-900/20 dark:bg-blue-950/10'
      : 'border-rose-100 bg-rose-50/50 dark:border-rose-900/20 dark:bg-rose-950/10'
  const rowBorder =
    tone === 'preferred'
      ? 'border-blue-100 dark:border-blue-900/20'
      : 'border-rose-100 dark:border-rose-900/20'

  return (
    <div
      className={cn(
        'flex min-h-[360px] flex-col overflow-hidden rounded-xl border',
        panelClass,
      )}
    >
      <div
        className={cn(
          'border-b bg-background/50 px-5 py-4 backdrop-blur-sm',
          rowBorder,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold tracking-tight text-foreground">
                {label}
              </Label>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {items.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            type="button"
            onClick={add}
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-primary/30 px-3 text-xs font-medium text-primary hover:border-primary hover:bg-primary/10"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-2 w-4 shrink-0 select-none text-center text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
            <Textarea
              value={item}
              onChange={(e) => update(index, e.target.value)}
              aria-label={`${label} ${index + 1}`}
              rows={1}
              className={cn(
                'min-h-[38px] flex-1 resize-none bg-background py-2',
                rowBorder,
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
              className="size-8 shrink-0 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <Minus className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
