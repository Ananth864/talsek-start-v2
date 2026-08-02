import { useState } from 'react'
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
import { useCreateJob } from '#/hooks/use-create-job'
import { useParseJobDescription } from '#/hooks/use-parse-job-description'
import { SALARY_CURRENCY_PREFIX } from '#/lib/jobs-shared'
import type { CreateJobInput } from '#/server/fn/jobs'
import type {
  ParsedJobDataJson,
  ScreeningInterviewInformationJson,
} from '#/integrations/supabase/types'

type ServiceType = 'resume_only' | 'resume_interview'
type SalaryCurrency = keyof typeof SALARY_CURRENCY_PREFIX
type LocationMode = ScreeningInterviewInformationJson['job_type']['mode']

type JobCreationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyName: string
}

const DEFAULT_SCREENING: ScreeningInterviewInformationJson = {
  expected_joining_date: 'Immediately (0-1 Month)',
  job_type: { mode: 'Remote (Anywhere)', location: '', work_arrangement: '' },
  shift_timings: { start: '09:00', end: '17:00' },
  travel_requirements: 'No',
}

const EMPTY_PARSED: ParsedJobDataJson = {
  preferred_requirements: [],
  non_negotiables: [],
  role_readiness_summary: '',
  role_readiness_questions: [],
}

/**
 * Builds the screening-interview configuration from the dialog state. Mirrors
 * the source's `buildScreeningInterviewInfo`, simplified to the fields this
 * dialog captures: `resume_only` stores the default shape; `resume_interview`
 * derives the job-type mode from the selected location type. The full
 * shift/travel form ports with the interview-config domain.
 */
function buildScreeningInfo(
  serviceType: ServiceType,
  locationMode: LocationMode,
  location: string,
): ScreeningInterviewInformationJson {
  if (serviceType === 'resume_only') return DEFAULT_SCREENING
  return {
    ...DEFAULT_SCREENING,
    job_type: {
      mode: locationMode,
      location: locationMode === 'Remote (Anywhere)' ? '' : location,
      work_arrangement: '',
    },
  }
}

/**
 * Create-Job dialog (focused port of the source's `JobCreationDialog`).
 *
 * The source is a 4-step wizard (service type → details → review → form config);
 * this port collapses it to the two steps the #5 acceptance criteria exercise —
 * **details** and **review parsed requirements** — and defers the application-
 * form-config step to #11/#12. Parse fires on the details → review transition
 * (source parity: not a button, onPaste, or debounce), populating the editable
 * requirement lists; on failure the dialog still advances to manual entry.
 */
export function JobCreationDialog({
  open,
  onOpenChange,
  companyName,
}: JobCreationDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [jobPostingLink, setJobPostingLink] = useState('')
  const [location, setLocation] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState<SalaryCurrency>('USD')
  const [serviceType, setServiceType] = useState<ServiceType>('resume_only')
  const [locationMode, setLocationMode] = useState<LocationMode>('Hybrid')
  const [jobDescription, setJobDescription] = useState('')
  const [preferred, setPreferred] = useState<string[]>([])
  const [nonNegotiables, setNonNegotiables] = useState<string[]>([])
  const [parsedJobData, setParsedJobData] =
    useState<ParsedJobDataJson>(EMPTY_PARSED)
  const [error, setError] = useState<string | null>(null)

  const parseMutation = useParseJobDescription()
  const createMutation = useCreateJob()

  const reset = () => {
    setStep(1)
    setTitle('')
    setJobPostingLink('')
    setLocation('')
    setSalaryRange('')
    setSalaryCurrency('USD')
    setServiceType('resume_only')
    setLocationMode('Hybrid')
    setJobDescription('')
    setPreferred([])
    setNonNegotiables([])
    setParsedJobData(EMPTY_PARSED)
    setError(null)
  }

  const close = () => {
    onOpenChange(false)
    // Defer reset so the close animation isn't interrupted mid-flight.
    setTimeout(reset, 200)
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
    try {
      const result = await parseMutation.mutateAsync({
        title: title.trim(),
        location,
        salary: salaryRange,
        jobDescription,
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
      location:
        serviceType === 'resume_only'
          ? location.trim()
          : locationMode === 'Remote (Anywhere)'
            ? 'Remote (Anywhere)'
            : location.trim(),
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
      screeningInterviewInformation: buildScreeningInfo(
        serviceType,
        locationMode,
        location.trim(),
      ),
    }

    try {
      await createMutation.mutateAsync(payload)
      close()
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent
        data-testid="job-creation-dialog"
        className="max-w-xl"
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="jc-locmode">Location type</Label>
                <Select
                  value={locationMode}
                  onValueChange={(v) => setLocationMode(v as LocationMode)}
                >
                  <SelectTrigger id="jc-locmode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote (Anywhere)">
                      Remote (Anywhere)
                    </SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Work From office">
                      Work from office
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {serviceType === 'resume_only' ||
            locationMode !== 'Remote (Anywhere)' ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="jc-location">Location</Label>
                <Input
                  id="jc-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, IN"
                />
              </div>
            ) : null}
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
              <Button variant="outline" onClick={close} disabled={parsing}>
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
  )
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
