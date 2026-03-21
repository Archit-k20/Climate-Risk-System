import { useState, useRef, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { ReportsTable } from '@/components/reports/ReportsTable'
import { ReportDetailSheet } from '@/components/reports/ReportDetailSheet'
import { mockReports, ReportRecord } from '@/lib/mockData'
import { exportReportToPDF } from '@/lib/pdfExport'
import toast from 'react-hot-toast'
import { useReports } from '@/hooks/useReports'

export default function ReportsPage() {
  // Which report is currently selected for viewing in the detail sheet
  const { reports, isUsingMockData } = useReports()
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null)
  const [isSheetOpen,    setIsSheetOpen]    = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // This ref is forwarded to the ReportDetailSheet's content div.
  // When we call html2canvas(ref.current), it captures exactly the
  // report content area — not the entire page, not the sheet header.
  const reportContentRef = useRef<HTMLDivElement>(null)

  const handleViewReport = useCallback((report: ReportRecord) => {
    setSelectedReport(report)
    setIsSheetOpen(true)
  }, [])

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false)
    // Small delay before clearing the report so the exit animation
    // can complete before the content disappears
    setTimeout(() => setSelectedReport(null), 300)
  }, [])

  const handleDownloadPDF = useCallback(async (report?: ReportRecord) => {
    // If called from the table row's download button, open the sheet first
    // so there's a DOM node for html2canvas to capture
    const targetReport = report ?? selectedReport
    if (!targetReport) return

    // If the sheet isn't open, open it first, then wait for it to render
    if (!isSheetOpen && report) {
      setSelectedReport(report)
      setIsSheetOpen(true)
      // Wait for the sheet animation and DOM painting to complete
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    if (!reportContentRef.current) {
      toast.error('Could not capture report content. Please try again.')
      return
    }

    setIsGeneratingPDF(true)
    try {
      await exportReportToPDF(reportContentRef.current, targetReport)
      toast.success('PDF downloaded successfully!')
    } catch (err) {
      console.error('[PDF Export]', err)
      toast.error('PDF generation failed. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [selectedReport, isSheetOpen])

  return (
    <PageTransition>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}
        >
          <FileText size={18} style={{ color: 'var(--color-amber)' }} />
        </div>
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
          >
            Reports Archive
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {mockReports.length} analyses — search, filter, and export
          </p>
        </div>
      </div>
      {isUsingMockData && (
  <div
    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs"
    style={{
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.2)',
      color: 'var(--color-amber)',
      fontFamily: 'IBM Plex Mono, monospace',
    }}
  >
    ⚠️ Backend offline — showing demo data. Start the backend to see real reports.
  </div>
)}

      {/* Reports Table */}
      <ReportsTable
        reports={reports}
        onViewReport={handleViewReport}
        onDownloadPDF={(report) => handleDownloadPDF(report)}
      />

      {/* Detail Sheet — slides in from the right */}
      <ReportDetailSheet
        ref={reportContentRef}
        report={selectedReport}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        onDownloadPDF={() => handleDownloadPDF()}
        isGeneratingPDF={isGeneratingPDF}
      />
    </PageTransition>
  )
}