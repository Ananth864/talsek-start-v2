import { useMemo, useState } from 'react'
import type { FormQuestion } from '#/integrations/supabase/types'
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
import { supabaseBrowser } from '#/lib/supabase'
import {
  prepareFormResumeUpload,
  submitFormApplication,
} from '#/server/fn/forms'

const MAX_PDF_SIZE_BYTES = 1024 * 1024

type CandidateApplyFormProps = {
  questions: FormQuestion[]
  isExpired?: boolean
  token: string
  customQuestionText?: Record<string, string>
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

function validateResume(file: File | null): string | null {
  if (!file) return 'Resume (PDF) is required'
  const typeOk =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!typeOk) return 'Only PDF files are allowed'
  if (file.size > MAX_PDF_SIZE_BYTES) return 'File too large. Maximum size: 1MB'
  return null
}

export function CandidateApplyForm({
  questions,
  isExpired,
  token,
  customQuestionText = {},
}: CandidateApplyFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const q of questions) {
      if (q.type !== 'file') initial[q.id] = ''
    }
    return initial
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const fieldQuestions = useMemo(
    () => questions.filter((q) => q.type !== 'file'),
    [questions],
  )

  const setField = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isExpired) {
      setFormError('This form has expired.')
      return
    }

    const fileError = validateResume(resumeFile)
    if (fileError) {
      setFormError(fileError)
      return
    }

    const emailQ = questions.find((q) => q.baseId === 'email')
    const nameQ = questions.find((q) => q.baseId === 'name')
    const phoneQ = questions.find((q) => q.baseId === 'phone')
    if (!emailQ || !nameQ || !phoneQ) {
      setFormError('Form configuration error: Missing required fields')
      return
    }

    const email = (values[emailQ.id] ?? '').trim()
    const name = (values[nameQ.id] ?? '').trim()
    const phone = (values[phoneQ.id] ?? '').trim()
    if (!name) {
      setFormError('Full name is required')
      return
    }
    if (!email || !email.includes('@')) {
      setFormError('Enter a valid email address')
      return
    }
    if (!phone) {
      setFormError('Phone number is required')
      return
    }

    for (const q of fieldQuestions) {
      if (!q.required && !q.isCustom) continue
      if (q.baseId === 'email' || q.baseId === 'name' || q.baseId === 'phone') {
        continue
      }
      const value = values[q.id] ?? ''
      if (q.required && !String(value).trim()) {
        setFormError(`${q.label} is required`)
        return
      }
      if (q.isCustom && countWords(String(value)) > 150) {
        setFormError('Custom question response must be 150 words or less')
        return
      }
    }

    setFormError('')
    setLoading(true)

    try {
      const prepared = await prepareFormResumeUpload({
        data: { token, email },
      })

      const { error: uploadError } = await supabaseBrowser.storage
        .from('resumes')
        .uploadToSignedUrl(prepared.path, prepared.token, resumeFile!, {
          contentType: 'application/pdf',
        })
      if (uploadError) {
        throw new Error(`Resume upload failed: ${uploadError.message}`)
      }

      const additional: Record<string, string | number> = {}
      for (const q of fieldQuestions) {
        const base = q.baseId
        if (base === 'email' || base === 'name' || base === 'phone') continue
        const raw = values[q.id] ?? ''
        const key = q.isCustom ? q.id : base
        if (q.type === 'number' && raw !== '' && !Number.isNaN(Number(raw))) {
          additional[key] = Number(raw)
        } else {
          additional[key] = raw
        }
      }

      await submitFormApplication({
        data: {
          token,
          name,
          email,
          phone,
          resumePath: prepared.path,
          ...additional,
        },
      })

      setSubmitted(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit application'
      setFormError(message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900"
        data-testid="apply-success"
      >
        Your application has been submitted successfully and is being processed.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="apply-form">
      {fieldQuestions.map((q) => {
        const label =
          q.isCustom && customQuestionText[q.id]
            ? customQuestionText[q.id]
            : q.label
        const value = values[q.id] ?? ''

        return (
          <div key={q.id} className="space-y-2">
            <Label htmlFor={q.id}>
              {label}
              {q.required ? ' *' : ''}
            </Label>

            {q.type === 'select' && q.options?.length ? (
              <Select
                value={value}
                onValueChange={(next) => setField(q.id, next)}
                disabled={isExpired || loading}
              >
                <SelectTrigger id={q.id} className="w-full">
                  <SelectValue placeholder={q.placeholder ?? 'Select…'} />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : q.isCustom || (q.type === 'text' && q.baseId !== 'name') ? (
              <Textarea
                id={q.id}
                value={value}
                placeholder={q.placeholder}
                disabled={isExpired || loading}
                onChange={(e) => setField(q.id, e.target.value)}
                rows={q.isCustom ? 4 : 2}
              />
            ) : (
              <Input
                id={q.id}
                type={q.type === 'email' ? 'email' : q.type === 'url' ? 'url' : 'text'}
                inputMode={q.baseId === 'phone' ? 'tel' : undefined}
                value={value}
                placeholder={
                  q.baseId === 'phone'
                    ? q.placeholder ?? '+1234567890'
                    : q.placeholder
                }
                disabled={isExpired || loading}
                onChange={(e) => setField(q.id, e.target.value)}
                data-testid={
                  q.baseId === 'name'
                    ? 'apply-name'
                    : q.baseId === 'email'
                      ? 'apply-email'
                      : q.baseId === 'phone'
                        ? 'apply-phone'
                        : undefined
                }
              />
            )}

            {q.isCustom ? (
              <p className="text-xs text-muted-foreground">
                {countWords(value)} / 150 words
              </p>
            ) : null}
          </div>
        )
      })}

      <div className="space-y-2">
        <Label htmlFor="resume">Resume (PDF) *</Label>
        <Input
          id="resume"
          type="file"
          accept="application/pdf,.pdf"
          disabled={isExpired || loading}
          data-testid="apply-resume"
          onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">PDF only, max 1MB</p>
      </div>

      {formError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          data-testid="apply-error"
        >
          {formError}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isExpired || loading}
        data-testid="apply-submit"
      >
        {loading ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  )
}
