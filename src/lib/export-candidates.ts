import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { candidateProfileModel } from '#/lib/candidate-profile-model'
import {
  generateCandidateProfilePdf,
  sanitizeFilename,
} from '#/lib/export-candidate-pdf'
import { normalizedMatchScore } from '#/lib/job-applications-shared'
import type { JobApplicationRow } from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** `candidates-export-YYYY-MM-DD_HHmm.xlsx` style filename (source parity). */
function generateFilename(prefix: string, extension: string): string {
  const d = new Date()
  const stamp = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}`
  return `${prefix}-${stamp}.${extension}`
}

function formatAppliedDate(iso: string | null | undefined): string {
  if (!iso) return 'N/A'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function resolveJobForApp(
  app: JobApplicationRow,
  jobsById?: Map<string, JobWithCompanyRow> | null,
  fallbackJob?: JobWithCompanyRow | null,
): JobWithCompanyRow | null {
  return jobsById?.get(app.job_id) ?? fallbackJob ?? null
}

/**
 * Concise Excel export of filtered Job Applications (ticket #27; source
 * `exportCandidatesToExcel`). Uses each application's Job requirements when
 * `jobsById` is provided (cross-job fix over the source's single-job caveat).
 * Scoring/requirement counts go through `candidateProfileModel` so null/partial
 * `ai_analysis` rows do not throw (ADR-0012 defensive accessors).
 */
export async function exportCandidatesToExcel(
  candidates: JobApplicationRow[],
  options?: {
    job?: JobWithCompanyRow | null
    jobsById?: Map<string, JobWithCompanyRow> | null
    filename?: string
  },
): Promise<void> {
  if (candidates.length === 0) {
    throw new Error('No candidates to export')
  }

  const rows = candidates.map((app) => {
    const job = resolveJobForApp(app, options?.jobsById, options?.job)
    const model = candidateProfileModel(app, job)
    const { preferredSummary, nonNegotiableSummary, scoreBreakdown } = model

    return {
      Name: app.candidate_name || 'N/A',
      Email: app.candidate.email || 'N/A',
      'Job Title': job?.title || 'N/A',
      Stage: app.current_stage.hiring_stage.name || 'N/A',
      'Match Score': scoreBreakdown.finalScore,
      'Non-Negotiables': `${nonNegotiableSummary.metCount}/${nonNegotiableSummary.totalCount}`,
      'Preferred Reqs': `${preferredSummary.metCount}/${preferredSummary.totalCount}`,
      'Applied Date': formatAppliedDate(app.created_at),
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates')

  if (rows.length > 0) {
    const firstRow = rows[0]
    const colWidths = Object.keys(firstRow).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...rows.map((row) =>
            String(row[key as keyof typeof firstRow]).length,
          ),
        ) + 2,
    }))
    worksheet['!cols'] = colWidths
  }

  XLSX.writeFile(
    workbook,
    options?.filename || generateFilename('candidates-export', 'xlsx'),
  )
}

/**
 * Full PDF-ZIP export — one multi-page PDF per `[data-pdf-candidate]` section
 * in the hidden renderer container (ticket #27; source `exportCandidatesToZip`).
 * Reuses `generateCandidateProfilePdf` (html2canvas-pro + jspdf).
 */
export async function exportCandidatesToZip(
  container: HTMLElement,
  candidateCount: number,
  filename?: string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  if (candidateCount === 0) {
    throw new Error('No candidates to export')
  }

  const profileElements = container.querySelectorAll<HTMLElement>(
    '[data-pdf-candidate]',
  )
  if (profileElements.length === 0) {
    throw new Error('No candidate profiles found to render')
  }

  const zip = new JSZip()
  const elements = Array.from(profileElements)
  const totalCandidates = elements.length

  for (const [idx, element] of elements.entries()) {
    const rawName = element.getAttribute('data-candidate-name')
    const candidateName =
      rawName && rawName.length > 0 ? rawName : `Candidate_${idx + 1}`
    onProgress?.(idx + 1, totalCandidates)

    const pdf = await generateCandidateProfilePdf(element)
    const pdfBlob = pdf.output('blob')
    const safeName = sanitizeFilename(candidateName)
    zip.file(
      `${safeName.length > 0 ? safeName : `Candidate_${idx + 1}`}.pdf`,
      pdfBlob,
    )
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const finalFilename =
    filename || generateFilename('candidates-full-export', 'zip')

  const link = document.createElement('a')
  link.href = URL.createObjectURL(zipBlob)
  link.download = finalFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export function canExport(candidates: JobApplicationRow[]): boolean {
  return candidates.length > 0
}

/** Headline score helper kept for tests / callers that prefer persisted score. */
export function exportMatchScore(application: JobApplicationRow): number {
  return normalizedMatchScore(application)
}
