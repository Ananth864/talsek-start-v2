import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Trash2, UploadCloud } from 'lucide-react'
import { fetchJobs } from '#/server/fn/jobs'
import {
  prepareBulkResumeUpload,
  processBulkResumeUpload,
} from '#/server/fn/bulk'
import type { BulkResumeUploadResult } from '#/server/fn/bulk'
import { jobsQueryKey } from '#/lib/jobs-shared'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'
import { supabaseBrowser } from '#/lib/supabase'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

type BulkFileStatus =
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'missing_email'
  | 'insufficient_credits'
  | 'error'

type BulkFileRow = {
  id: string
  file?: File
  fileName: string
  fileSize: number
  status: BulkFileStatus
  message?: string
  candidateEmail?: string
  manualEmail?: string
}

type StoredBulkFileRow = Omit<BulkFileRow, 'file'>

const STORAGE_KEY_ROWS = 'bulk-upload-rows'
const STORAGE_KEY_JOB = 'bulk-upload-selected-job'
const MAX_FILES = 10
const MAX_FILE_BYTES = 1_000_000

const statusColorMap: Record<BulkFileStatus, string> = {
  queued: 'bg-muted text-muted-foreground',
  uploading: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  missing_email:
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  insufficient_credits:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const createRowId = () => crypto.randomUUID()

const toStoredRows = (rowsToStore: BulkFileRow[]): StoredBulkFileRow[] =>
  rowsToStore.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    fileSize: r.fileSize,
    status: r.status,
    message: r.message,
    candidateEmail: r.candidateEmail,
    manualEmail: r.manualEmail,
  }))

const mergeUpdateIntoStorage = (
  id: string,
  updates: Partial<StoredBulkFileRow>,
) => {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY_ROWS) ?? '[]',
    ) as StoredBulkFileRow[]
    const next = stored.map((r) => (r.id === id ? { ...r, ...updates } : r))
    sessionStorage.setItem(STORAGE_KEY_ROWS, JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
}

type BulkUploadPageProps = {
  companyId: string | null
}

/**
 * Member bulk-upload surface (ticket #10). Client uploads each PDF to Storage
 * via a signed URL, then the server fn receives the path only (ADR-0016).
 * Layout chrome matches source BulkUpload (ticket #39 / ADR-0030).
 */
export function BulkUploadPage({ companyId }: BulkUploadPageProps) {
  const queryClient = useQueryClient()
  const { data: jobs = [], isLoading: isJobsLoading } = useQuery({
    queryKey: jobsQueryKey(companyId),
    queryFn: () => fetchJobs(),
  })
  const [selectedJobId, setSelectedJobId] = useState('')
  const [rows, setRows] = useState<BulkFileRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY_ROWS)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredBulkFileRow[]
        setRows(parsed.map((r) => ({ ...r, file: undefined })))
      } catch {
        // ignore
      }
    }
    const storedJob = sessionStorage.getItem(STORAGE_KEY_JOB)
    if (storedJob) setSelectedJobId(storedJob)
  }, [])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_ROWS, JSON.stringify(toStoredRows(rows)))
  }, [rows])

  useEffect(() => {
    if (selectedJobId) {
      sessionStorage.setItem(STORAGE_KEY_JOB, selectedJobId)
    } else {
      sessionStorage.removeItem(STORAGE_KEY_JOB)
    }
  }, [selectedJobId])

  const selectedJobName = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId)?.title ?? ''
  }, [jobs, selectedJobId])

  const uploadOne = useMutation({
    mutationFn: async ({
      file,
      jobId,
      manualEmail,
    }: {
      file: File
      jobId: string
      manualEmail?: string
    }): Promise<BulkResumeUploadResult> => {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error('File exceeds 1 MB limit.')
      }

      const prepared = await prepareBulkResumeUpload({ data: { jobId } })
      const { error: uploadError } = await supabaseBrowser.storage
        .from('resumes')
        .uploadToSignedUrl(prepared.path, prepared.token, file, {
          contentType: 'application/pdf',
        })
      if (uploadError) {
        throw new Error(`Resume upload failed: ${uploadError.message}`)
      }

      return processBulkResumeUpload({
        data: {
          jobId,
          resumePath: prepared.path,
          email: manualEmail ?? '',
        },
      })
    },
  })

  const updateRow = (id: string, updates: Partial<BulkFileRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...updates } : row)),
    )
    mergeUpdateIntoStorage(id, updates)
  }

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setBanner(null)

    const incoming = Array.from(fileList)
    let rejectedForType = 0
    let rejectedForSize = 0

    const filtered = incoming.filter((file) => {
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        rejectedForType += 1
        return false
      }
      if (file.size > MAX_FILE_BYTES) {
        rejectedForSize += 1
        return false
      }
      return true
    })

    if (rejectedForType > 0) {
      setBanner(`Only PDF files are allowed. Skipped ${rejectedForType} file(s).`)
    } else if (rejectedForSize > 0) {
      setBanner(`Skipped ${rejectedForSize} file(s) larger than 1 MB.`)
    }

    const limited = filtered.slice(0, MAX_FILES)
    if (filtered.length > MAX_FILES) {
      setBanner(
        `You can upload up to ${MAX_FILES} resumes at a time. Extra files were ignored.`,
      )
    }

    setRows((prev) => [
      ...limited.map((file) => ({
        id: createRowId(),
        file,
        fileName: file.name,
        fileSize: file.size,
        status: 'queued' as const,
      })),
      ...prev,
    ])
  }

  const handleUpload = async () => {
    if (!selectedJobId) {
      setBanner('Select a job first.')
      return
    }

    const queuedRows = rows.filter((r) => r.status === 'queued' && r.file)
    if (queuedRows.length === 0) {
      setBanner('Upload a new resume to analyze.')
      return
    }

    const invalid = queuedRows.filter(
      (r) =>
        r.manualEmail &&
        r.manualEmail.trim() !== '' &&
        !isValidEmail(r.manualEmail.trim()),
    )
    if (invalid.length > 0) {
      setBanner('Some emails are invalid. Please fix them before analyzing.')
      return
    }

    setBanner(null)
    setIsProcessing(true)

    await Promise.all(
      queuedRows.map(async (row) => {
        if (!row.file) return
        updateRow(row.id, { status: 'uploading', message: undefined })
        try {
          updateRow(row.id, { status: 'processing' })
          const result = await uploadOne.mutateAsync({
            file: row.file,
            jobId: selectedJobId,
            manualEmail: row.manualEmail?.trim(),
          })
          const reason = result.reason
          const message = result.message || 'Processed'

          switch (reason) {
            case 'ok':
              updateRow(row.id, {
                status: 'done',
                message,
                candidateEmail: result.candidateEmail,
              })
              break
            case 'missing_email':
              updateRow(row.id, { status: 'missing_email', message })
              break
            case 'insufficient_credits':
            case 'credit_check_failed':
              updateRow(row.id, { status: 'insufficient_credits', message })
              break
            default:
              updateRow(row.id, { status: 'error', message })
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unexpected error during processing.'
          updateRow(row.id, { status: 'error', message })
        }
      }),
    )

    void queryClient.invalidateQueries({
      queryKey: JOB_APPLICATIONS_QUERY_KEY_PREFIX,
    })
    setIsProcessing(false)
  }

  const handleClear = () => {
    setRows([])
    sessionStorage.removeItem(STORAGE_KEY_ROWS)
  }

  const removeRow = (id: string) => {
    if (isProcessing) return
    setRows((prev) => prev.filter((row) => row.id !== id))
  }

  const hasQueuedRows = rows.some((r) => r.status === 'queued' && r.file)

  return (
    <div className="space-y-6 p-6" data-testid="bulk-upload-page">
      {banner ? (
        <p className="text-sm text-destructive" role="alert">
          {banner}
        </p>
      ) : null}

      <Card data-testid="bulk-upload-job-files">
        <CardHeader>
          <CardTitle>Job &amp; Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Target Job</p>
              <Select
                value={selectedJobId}
                onValueChange={setSelectedJobId}
                disabled={isJobsLoading || isProcessing}
              >
                <SelectTrigger data-testid="bulk-upload-job-select">
                  <SelectValue
                    placeholder={
                      isJobsLoading ? 'Loading jobs…' : 'Select a job'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedJobName ? (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedJobName}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <p className="text-sm font-medium">
                Select PDFs (max {MAX_FILES}, &lt; 1 MB each)
              </p>
              <label
                data-testid="bulk-upload-dropzone"
                className={`flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 ${
                  isProcessing
                    ? 'opacity-60'
                    : selectedJobId
                      ? 'animate-throb'
                      : 'hover:border-primary'
                }`}
              >
                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col text-sm">
                  <span>Click to choose files or drop them here</span>
                  <span className="text-xs text-muted-foreground">
                    PDF only, up to 1 MB each, max {MAX_FILES}
                  </span>
                </div>
                <Input
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  disabled={isProcessing}
                  data-testid="bulk-upload-file-input"
                  onChange={(e) => {
                    handleFilesSelected(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="bulk-upload-batch-status">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle>Batch Status</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isProcessing || rows.length === 0}
            >
              Clear
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isProcessing || !selectedJobId || !hasQueuedRows}
              className={
                !isProcessing && selectedJobId && hasQueuedRows
                  ? 'animate-throb'
                  : undefined
              }
              data-testid="bulk-upload-analyze"
            >
              {isProcessing ? 'Processing…' : 'Analyze'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="bulk-upload-table">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="w-1/5 py-2 pr-3 font-medium" scope="col">
                    File
                  </th>
                  <th className="w-1/4 py-2 pr-3 font-medium" scope="col">
                    <div className="flex flex-col">
                      <span>Email</span>
                      <span className="text-[10px] font-normal">
                        Auto-extracted; enter to override
                      </span>
                    </div>
                  </th>
                  <th className="w-[120px] py-2 pr-3 font-medium" scope="col">
                    Status
                  </th>
                  <th className="w-1/3 py-2 pr-3 font-medium" scope="col">
                    Message
                  </th>
                  <th className="w-[60px] py-2 font-medium" scope="col" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No files selected. Add up to {MAX_FILES} PDFs to start a
                      batch.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0"
                      data-testid="bulk-upload-row"
                      data-status={row.status}
                    >
                      <td className="max-w-[200px] py-2 pr-3">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{row.fileName}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        {row.status === 'queued' && row.file ? (
                          <Input
                            type="email"
                            placeholder="Auto-extracted or enter email"
                            value={row.manualEmail ?? ''}
                            onChange={(e) =>
                              updateRow(row.id, {
                                manualEmail: e.target.value,
                              })
                            }
                            disabled={isProcessing}
                            className="h-8 text-sm"
                            data-testid="bulk-upload-email"
                          />
                        ) : (
                          <span className="block truncate">
                            {row.candidateEmail ?? ''}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge
                          className={statusColorMap[row.status]}
                          variant="outline"
                        >
                          {row.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="max-w-xs break-words py-2 pr-3">
                        {row.message ?? ''}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={isProcessing}
                          aria-label="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
