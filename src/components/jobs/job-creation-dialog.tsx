import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Wand2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
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

  const handleSubmit = async () => {
    setError(null)
    const cleanPreferred = preferred.map((s) => s.trim()).filter(Boolean)
    const cleanNonNeg = nonNegotiables.map((s) => s.trim()).filter(Boolean)
    if (cleanPreferred.length === 0 || cleanNonNeg.length === 0) {
      setError('Add at least one preferred and one non-negotiable requirement.')
      return
    }

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
      setCreatedJobId(result.id)
      setCreatedJobTitle(title.trim())
      setForwardingEmail(result.forwardingEmail)
      setFormLink(null)
      closeCreate()
      setSuccessOpen(true)
    } catch (err) {
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
          className="max-h-[90vh] max-w-xl overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? 'Create a job' : 'Review requirements'}
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? 'Paste a raw job description and Talsek extracts structured requirements.'
                : 'Edit the extracted requirements, then create the job.'}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="jc-title">Job title *</Label>
                <Input
                  id="jc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="jc-code">Job code</Label>
                  <Input
                    id="jc-code"
                    value={jobPostingLink}
                    onChange={(e) => setJobPostingLink(e.target.value)}
                    placeholder="ENG-2026-001"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="jc-service">Service type</Label>
                  <Select
                    value={serviceType}
                    onValueChange={(v) => setServiceType(v as ServiceType)}
                  >
                    <SelectTrigger id="jc-service">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resume_only">Resume only</SelectItem>
                      <SelectItem value="resume_interview">
                        Resume + interview
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="jc-salary">Salary range</Label>
                  <Input
                    id="jc-salary"
                    inputMode="numeric"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="120000"
                  />
                </div>
                <div className="flex w-24 flex-col gap-2">
                  <Label htmlFor="jc-currency">Currency</Label>
                  <Select
                    value={salaryCurrency}
                    onValueChange={(v) => setSalaryCurrency(v as SalaryCurrency)}
                  >
                    <SelectTrigger id="jc-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="jc-jd">Job description *</Label>
                <Textarea
                  id="jc-jd"
                  data-testid="job-description-input"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here…"
                  className="min-h-40"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <DialogFooter>
                <Button variant="outline" onClick={closeCreate} disabled={parsing}>
                  Cancel
                </Button>
                <Button onClick={handleParseAndAdvance} disabled={parsing}>
                  <Wand2 className="size-4" />
                  {parsing ? 'Analysing…' : 'Parse & review'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <RequirementListEditor
                label="Preferred requirements"
                items={preferred}
                onChange={setPreferred}
              />
              <RequirementListEditor
                label="Non-negotiables"
                items={nonNegotiables}
                onChange={setNonNegotiables}
              />

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={creating}
                >
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={creating}>
                  {creating ? 'Creating…' : 'Create job'}
                </Button>
              </DialogFooter>
            </div>
          )}
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
      <p className="text-xs font-medium text-muted-foreground">
        Interview logistics
      </p>
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

/** Minimal editable list of requirement strings (add / remove rows). */
function RequirementListEditor({
  label,
  items,
  onChange,
}: {
  label: string
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

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => update(index, e.target.value)}
              aria-label={`${label} ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
              disabled={items.length <= 1}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={add}
      >
        <Plus className="size-4" />
        Add
      </Button>
    </div>
  )
}
