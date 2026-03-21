import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { ProcessingStep, StepperStep } from '@/types/analysis'

// The ordered list of pipeline stages. Each stage maps to a
// ProcessingStep type value, giving us type-safe step comparison.
const STEPS: StepperStep[] = [
  { key: 'uploading',         label: 'Upload',         description: 'Transferring image to server' },
  { key: 'preprocessing',     label: 'Preprocess',     description: 'Resizing and normalizing' },
  { key: 'analyzing',         label: 'AI Analysis',    description: 'Running ViT classifier' },
  { key: 'generating_report', label: 'Report',         description: 'Generating mitigation plan' },
  { key: 'complete',          label: 'Complete',       description: 'Analysis ready' },
]

// Determine the numeric index of the current step so we can
// compare "is this step before, at, or after the current one?"
const STEP_ORDER: ProcessingStep[] = [
  'idle', 'uploading', 'preprocessing', 'analyzing', 'generating_report', 'complete'
]

interface UploadProgressStepperProps {
  currentStep: ProcessingStep
}

export function UploadProgressStepper({ currentStep }: UploadProgressStepperProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <div className="w-full">
      {/* Horizontal step track */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const stepIndex = STEP_ORDER.indexOf(step.key)
          const isComplete = stepIndex < currentIndex || step.key === 'complete' && currentStep === 'complete'
          const isActive   = step.key === currentStep && currentStep !== 'complete'

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* ── Step Circle ── */}
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    // Complete = solid green, Active = amber with pulse, Pending = muted border
                    background: isComplete
                      ? 'var(--color-emerald)'
                      : isActive
                      ? 'var(--color-amber)'
                      : 'transparent',
                    borderColor: isComplete
                      ? 'var(--color-emerald)'
                      : isActive
                      ? 'var(--color-amber)'
                      : 'var(--color-border)',
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                >
                  {isComplete ? (
                    <Check size={14} className="text-white" />
                  ) : isActive ? (
                    // Spinning loader for the active step
                    <Loader2
                      size={14}
                      className="text-white animate-spin"
                    />
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      {i + 1}
                    </span>
                  )}
                </motion.div>

                {/* Step label below the circle */}
                <p
                  className="text-xs mt-1.5 text-center w-16"
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: isComplete || isActive ? 'hsl(var(--foreground))' : 'var(--color-muted)',
                    fontSize: '10px',
                  }}
                >
                  {step.label}
                </p>
              </div>

              {/* ── Connector Line between steps ── */}
              {i < STEPS.length - 1 && (
                <motion.div
                  className="flex-1 h-0.5 mx-1 mb-5"
                  animate={{
                    background: isComplete
                      ? 'var(--color-emerald)'
                      : 'var(--color-border)',
                  }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Current step description text */}
      <motion.p
        key={currentStep}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-center mt-3"
        style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
      >
        {STEPS.find(s => s.key === currentStep)?.description ?? ''}
      </motion.p>
    </div>
  )
}