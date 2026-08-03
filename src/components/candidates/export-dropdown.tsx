import { useCallback, useRef, useState } from 'react'
import { Download, FileArchive, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { CandidateProfilePDFRenderer } from '#/components/candidates/candidate-profile-pdf-renderer'
import {
  canExport,
  exportCandidatesToExcel,
  exportCandidatesToZip,
} from '#/lib/export-candidates'
import { cn } from '#/lib/utils'
import type { JobApplicationRow } from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type ExportDropdownProps = {
  candidates: JobApplicationRow[]
  job?: JobWithCompanyRow | null
  jobsById?: Map<string, JobWithCompanyRow> | null
  disabled?: boolean
}

/**
 * Concise (Excel) + Full (PDF-ZIP) export control for the Candidates page
 * (ticket #27; source `ExportDropdown`). PDF path mounts the hidden
 * `CandidateProfilePDFRenderer`, waits for paint, then zips per-candidate PDFs.
 */
export function ExportDropdown({
  candidates,
  job,
  jobsById,
  disabled,
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [showPDFRenderer, setShowPDFRenderer] = useState(false)
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  const hasCandidates = canExport(candidates)

  const handleExcelExport = useCallback(async () => {
    if (!hasCandidates) {
      setStatus('No candidates to export')
      return
    }

    setIsExporting(true)
    setStatus(null)
    try {
      await exportCandidatesToExcel(candidates, { job, jobsById })
      setStatus(`Exported ${candidates.length} candidates to Excel`)
    } catch (error) {
      console.error('Excel export failed:', error)
      setStatus('Failed to export candidates to Excel')
    } finally {
      setIsExporting(false)
    }
  }, [candidates, job, jobsById, hasCandidates])

  const handleZipExport = useCallback(async () => {
    if (!hasCandidates) {
      setStatus('No candidates to export')
      return
    }

    setIsExporting(true)
    setStatus(null)
    setShowPDFRenderer(true)

    // Wait for the hidden renderer to mount and paint (source parity).
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      if (!pdfContainerRef.current) {
        throw new Error('PDF renderer not ready')
      }

      await exportCandidatesToZip(
        pdfContainerRef.current,
        candidates.length,
      )

      setStatus(`Exported ${candidates.length} candidate profiles to ZIP`)
    } catch (error) {
      console.error('ZIP export failed:', error)
      setStatus('Failed to export candidates to ZIP')
    } finally {
      setIsExporting(false)
      setShowPDFRenderer(false)
    }
  }, [candidates, hasCandidates])

  const isDisabled = disabled || !hasCandidates || isExporting

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={hasCandidates ? 'default' : 'outline'}
            size="sm"
            disabled={isDisabled}
            className={cn('gap-2')}
            data-testid="candidates-export"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => void handleExcelExport()}
            disabled={!hasCandidates || isExporting}
            className="cursor-pointer gap-2"
            data-testid="candidates-export-excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">Concise Export</span>
              <span className="text-xs text-muted-foreground">
                Excel spreadsheet with key info
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void handleZipExport()}
            disabled={!hasCandidates || isExporting}
            className="cursor-pointer gap-2"
            data-testid="candidates-export-zip"
          >
            <FileArchive className="h-4 w-4 text-violet-600" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">Full Export</span>
              <span className="text-xs text-muted-foreground">
                ZIP with individual PDF profiles
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {status ? (
        <p
          className="max-w-xs text-right text-xs text-muted-foreground"
          role="status"
          data-testid="candidates-export-status"
        >
          {status}
        </p>
      ) : null}

      {showPDFRenderer ? (
        <div
          ref={pdfContainerRef}
          className="fixed left-[-9999px] top-0 w-[800px] bg-white"
          aria-hidden="true"
          data-testid="candidates-pdf-renderer"
        >
          <CandidateProfilePDFRenderer
            candidates={candidates}
            job={job}
            jobsById={jobsById}
          />
        </div>
      ) : null}
    </div>
  )
}
