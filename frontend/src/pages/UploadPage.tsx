import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, FlaskConical } from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { ImageDropzone } from '@/components/upload/ImageDropzone'
import { UploadProgressStepper } from '@/components/upload/UploadProgressStepper'
import { AnalysisResultsPanel } from '@/components/upload/AnalysisResultsPanel'
import { useImageAnalysis } from '@/hooks/useImageAnalysis'
import { EmptyState } from '@/components/ui/EmptyState'


export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { currentStep, result, isProcessing, startAnalysis, reset } = useImageAnalysis()

  // Called when a file lands in the dropzone
  const handleFileAccepted = useCallback((file: File) => {
    setSelectedFile(file)
  }, [])

  // Called when the user clicks "Analyze"
  const handleAnalyze = () => {
    if (!selectedFile) return
    startAnalysis(selectedFile)
  }

  // Reset everything — go back to idle state
  const handleReset = () => {
    setSelectedFile(null)
    reset()
  }

  const showResults  = currentStep === 'complete' && result !== null
  const showStepper  = isProcessing || showResults
  const showAnalyzeBtn = selectedFile && currentStep === 'idle'

  return (
    <PageTransition>
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
          >
            Upload & Analyze
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Submit satellite imagery for AI-powered climate risk assessment
          </p>
        </div>

        {/* Reset button — only visible when there's something to reset */}
        <AnimatePresence>
          {(selectedFile || showResults) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
              style={{
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)',
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              <RotateCcw size={14} />
              New Analysis
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Left Panel: Upload Controls ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Dropzone */}
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Image Input
            </p>
            <ImageDropzone
              onFileAccepted={handleFileAccepted}
              disabled={isProcessing}
            />
          </div>

          {/* Analyze Button */}
          <AnimatePresence>
            {showAnalyzeBtn && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                onClick={handleAnalyze}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-teal), var(--color-amber))',
                  color: 'white',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '15px',
                }}
              >
                <FlaskConical size={18} />
                Analyze Image
              </motion.button>
            )}
          </AnimatePresence>

          {/* Progress Stepper — visible during and after processing */}
          <AnimatePresence>
            {showStepper && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-6"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-5"
                  style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  Pipeline Progress
                </p>
                <UploadProgressStepper currentStep={currentStep} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right Panel: Results ── */}
        <div className="xl:col-span-3">
          <AnimatePresence mode="wait">
            {!showResults ? (
              /* Empty state — shown before any results exist */
              <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl"
              style={{ background: 'var(--color-bg-card)', border: '1px dashed var(--color-border)' }}
            >
              <EmptyState
                icon={<FlaskConical size={24} style={{ color: 'var(--color-muted)' }} />}
                title="No analysis yet"
                description="Upload a satellite image and click Analyze to run the AI pipeline and see climate risk results here."
              />
            </motion.div>
            ) : (
              /* Results panel — shown after successful analysis */
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AnalysisResultsPanel result={result!} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}