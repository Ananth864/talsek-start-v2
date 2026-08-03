import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas-pro'

/**
 * Client-side candidate-profile PDF export (ticket #7). Ports the source's
 * `utils/exportCandidates.ts` PDF path: rasterise the hidden
 * `CandidateProfilePDFRenderer` section with html2canvas, slice it into
 * A4 pages, and save via jspdf — all in-browser from already-fetched data (no
 * server function). `html2canvas-pro` replaces the source's `html2canvas`:
 * Tailwind v4 emits `oklch()` colors, which the original cannot parse. The
 * bulk Excel/ZIP export lives in `export-candidates.ts` (ticket #27) and
 * reuses `generateCandidateProfilePdf` below.
 */

/** Strip characters that are unsafe in filenames (source parity). */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
}

async function renderElementToCanvas(
  element: HTMLElement,
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })
}

/**
 * Renders one candidate-profile element into a multi-page A4 PDF. JPEG at
 * 0.75 quality (source parity) keeps the output small; long profiles are
 * sliced into page-height canvas chunks.
 */
export async function generateCandidateProfilePdf(
  element: HTMLElement,
): Promise<jsPDF> {
  const quality = 0.75
  const canvas = await renderElementToCanvas(element)
  const imgData = canvas.toDataURL('image/jpeg', quality)

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10

  const imgWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  if (imgHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight)
    return pdf
  }

  // Multi-page: slice the canvas into page-sized chunks.
  const pageContentHeight = pageHeight - margin * 2
  const scaleFactor = imgWidth / canvas.width
  const canvasPageHeight = pageContentHeight / scaleFactor

  let remainingHeight = canvas.height
  let sourceY = 0
  let pageNum = 0

  while (remainingHeight > 0) {
    if (pageNum > 0) pdf.addPage()

    const sliceHeight = Math.min(canvasPageHeight, remainingHeight)

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeight

    const ctx = pageCanvas.getContext('2d')
    if (ctx) {
      // White background prevents transparent artifacts in JPEG.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      )
    }

    const pageImgData = pageCanvas.toDataURL('image/jpeg', quality)
    const sliceImgHeight = sliceHeight * scaleFactor

    pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, sliceImgHeight)

    sourceY += sliceHeight
    remainingHeight -= sliceHeight
    pageNum++
  }

  return pdf
}

/**
 * Finds the rendered profile section inside the hidden renderer container and
 * saves it as `<CandidateName>.pdf`. Throws if the renderer has not mounted.
 */
export async function exportCandidateProfilePdf(
  container: HTMLElement,
  candidateName: string,
): Promise<void> {
  const element = container.querySelector<HTMLElement>('[data-pdf-candidate]')
  if (!element) throw new Error('No candidate profile found to render')

  const pdf = await generateCandidateProfilePdf(element)
  pdf.save(`${sanitizeFilename(candidateName) || 'candidate'}.pdf`)
}
