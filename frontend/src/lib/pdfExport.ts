import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { ReportRecord } from './mockData'

/**
 * Captures a DOM element as a high-resolution image and embeds it
 * into a professionally formatted PDF document.
 *
 * The process has four stages:
 * 1. html2canvas renders the target DOM node to an HTML <canvas> element
 * 2. We convert that canvas to a base64-encoded PNG image string
 * 3. jsPDF creates a new PDF document with a cover page
 * 4. The PNG image is embedded into subsequent pages
 *
 * @param targetElement - The DOM node to screenshot (the report detail content)
 * @param report        - Report metadata for the cover page and filename
 */
export async function exportReportToPDF(
  targetElement: HTMLElement,
  report: ReportRecord
): Promise<void> {

  // ── Stage 1: Capture the DOM node as a canvas ──────────────────────────────
  // scale: 2 means we render at 2x resolution (retina quality).
  // This prevents the text from looking blurry in the PDF.
  // useCORS: true allows cross-origin images (like map tiles) to render.
  // backgroundColor: we set it explicitly because html2canvas sometimes
  // renders transparent backgrounds as black in the PDF.
  const canvas = await html2canvas(targetElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#090e1a',   // matches our --color-bg-base
    logging: false,               // suppress html2canvas console output
  })

  // ── Stage 2: Convert canvas to image data ──────────────────────────────────
  const imgData   = canvas.toDataURL('image/png')
  const imgWidth  = canvas.width
  const imgHeight = canvas.height

  // ── Stage 3: Create the PDF document ──────────────────────────────────────
  // 'p' = portrait orientation, 'mm' = millimeters unit, 'a4' = page size
  const pdf = new jsPDF('p', 'mm', 'a4')

  // A4 dimensions in millimeters
  const pageWidth  = pdf.internal.pageSize.getWidth()   // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight()  // 297mm
  const margin     = 15  // 15mm margin on all sides

  // ── Cover page ────────────────────────────────────────────────────────────
  // We draw the cover page using jsPDF's drawing API rather than capturing
  // HTML. This gives us crisp vector text that scales perfectly at any zoom.

  // Dark background
  pdf.setFillColor(9, 14, 26)     // --color-bg-base in RGB
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  // Amber accent bar at the top
  pdf.setFillColor(245, 158, 11)  // --color-amber
  pdf.rect(0, 0, pageWidth, 3, 'F')

  // Project title
  pdf.setTextColor(245, 158, 11)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CLIMATERISK INTELLIGENCE', margin, 20)

  // Report title
  pdf.setTextColor(235, 240, 250)
  pdf.setFontSize(22)
  pdf.text('Climate Risk Assessment', margin, 45)
  pdf.text('Report', margin, 58)

  // Filename
  pdf.setFontSize(11)
  pdf.setTextColor(74, 85, 104)   // --color-muted
  pdf.text(report.filename, margin, 72)

  // Metadata block
  const metaY = 90
  pdf.setFontSize(9)
  pdf.setTextColor(74, 85, 104)
  pdf.text('LOCATION',     margin,          metaY)
  pdf.text('ANALYZED',     margin + 70,     metaY)
  pdf.text('RISK LEVEL',   margin + 140,    metaY)

  pdf.setTextColor(235, 240, 250)
  pdf.setFontSize(10)
  pdf.text(report.location,                          margin,       metaY + 7)
  pdf.text(new Date(report.analyzedAt).toDateString(), margin + 70,  metaY + 7)
  pdf.text(report.riskLevel.toUpperCase(),           margin + 140, metaY + 7)

  // Risk score — large number as the visual anchor of the cover page
  const scoreColors: Record<string, [number, number, number]> = {
    low:    [16, 185, 129],
    medium: [245, 158, 11],
    high:   [239, 68, 68],
  }
  const [r, g, b] = scoreColors[report.riskLevel]
  pdf.setTextColor(r, g, b)
  pdf.setFontSize(72)
  pdf.setFont('helvetica', 'bold')
  pdf.text(String(report.riskScore), margin, 160)

  pdf.setFontSize(12)
  pdf.setTextColor(74, 85, 104)
  pdf.text('OVERALL RISK SCORE / 100', margin, 170)

  // Dominant risk type
  pdf.setFontSize(14)
  pdf.setTextColor(235, 240, 250)
  pdf.text(`Primary Risk: ${report.dominantRisk}`, margin, 185)

  // Footer on cover page
  pdf.setFontSize(8)
  pdf.setTextColor(74, 85, 104)
  pdf.text(
    `Generated ${new Date().toLocaleString()} · ClimateRisk Intelligence Dashboard`,
    margin,
    pageHeight - 10
  )

  // ── Stage 4: Embed the captured report content on subsequent pages ─────────
  pdf.addPage()

  // Dark background on content page too
  pdf.setFillColor(9, 14, 26)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  // Calculate how wide the image should be to fit within page margins
  const contentWidth  = pageWidth - (margin * 2)
  // Maintain the original aspect ratio so the content isn't stretched
  const contentHeight = (imgHeight / imgWidth) * contentWidth

  // If the content is taller than one page, jsPDF will automatically
  // handle page breaks when we add the image
  let yPosition = margin

  if (contentHeight <= pageHeight - (margin * 2)) {
    // Content fits on one page — center it vertically
    pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, contentHeight)
  } else {
    // Content is taller than one page — split across multiple pages
    const totalPages = Math.ceil(contentHeight / (pageHeight - margin * 2))

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage()
        pdf.setFillColor(9, 14, 26)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      }
      // We shift the image up by one page height each time,
      // creating a "sliding window" effect through the content
      const yOffset = page * (pageHeight - margin * 2)
      pdf.addImage(imgData, 'PNG', margin, margin - yOffset, contentWidth, contentHeight)
    }
  }

  // ── Save the file ──────────────────────────────────────────────────────────
  // This triggers the browser's file download dialog
  const safeFilename = report.filename.replace(/\.[^/.]+$/, '')  // strip extension
  pdf.save(`climate-risk-report_${safeFilename}_${Date.now()}.pdf`)
}