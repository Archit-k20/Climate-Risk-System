import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { ProcessingStep, AnalysisResult, ImageUploadResponse, TaskStatusResponse } from '@/types/analysis'
import { adaptBackendResponse } from '@/lib/backendAdapter'
import toast from 'react-hot-toast'

// ── Polling Configuration ─────────────────────────────────────────────────────
// How often to ask the backend "is the task done yet?"
// 2 seconds is a good balance — responsive without hammering the server.
const POLL_INTERVAL_MS = 2000

// Maximum number of polling attempts before we give up and show an error.
// 60 attempts × 2 seconds = 2 minutes maximum wait time.
const MAX_POLL_ATTEMPTS = 60

// ── Mock Fallback ─────────────────────────────────────────────────────────────
// Used when the backend is offline. This lets you continue developing
// the frontend even without the backend running.
const MOCK_BACKEND_RESPONSE = {
  land_class:    'SeaLake',
  risk_level:    'Medium',
  risk_type:     'Flood Risk',
  description:   'Water bodies can overflow during extreme rainfall events.',
  dynamic_report: undefined,
}

// ── Polling Helper ────────────────────────────────────────────────────────────
/**
 * Polls the task status endpoint until the task completes or fails.
 * Returns the completed result or throws an error.
 *
 * Think of this like repeatedly checking a package tracking page —
 * you check every 2 seconds until it says "Delivered" or "Failed".
 */
async function pollTaskCompletion(taskId: string): Promise<TaskStatusResponse> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    // Wait before polling (except on the very first attempt —
    // give the task a moment to start before we even ask)
    await delay(POLL_INTERVAL_MS)

    const response = await api.get<TaskStatusResponse>(
      `/images/tasks/${taskId}`
    )
    const taskData = response.data

    if (taskData.status === 'Completed') {
      return taskData
    }

    if (taskData.status === 'Failed') {
      throw new Error(taskData.details ?? 'Task failed on the server')
    }

    // Status is 'Pending' or something else — keep polling
  }

  throw new Error('Analysis timed out after 2 minutes')
}

// ── The Main Hook ─────────────────────────────────────────────────────────────
interface UseImageAnalysisReturn {
  currentStep:  ProcessingStep
  result:       AnalysisResult | null
  isProcessing: boolean
  isBackendOnline: boolean
  startAnalysis: (file: File) => Promise<void>
  reset:        () => void
}

export function useImageAnalysis(): UseImageAnalysisReturn {
  const [currentStep,      setCurrentStep]      = useState<ProcessingStep>('idle')
  const [result,           setResult]           = useState<AnalysisResult | null>(null)
  const [isBackendOnline,  setIsBackendOnline]  = useState(true)

  const startAnalysis = useCallback(async (file: File) => {
    setResult(null)

    try {
      // ── Step 1: Upload the image ──────────────────────────────────────────
      setCurrentStep('uploading')

      let imageId: number | null = null
      let useMockData = false

      try {
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await api.post<ImageUploadResponse>(
          '/images/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30_000 }
        )

        imageId = uploadResponse.data.id
        setIsBackendOnline(true)
        console.log('[useImageAnalysis] Uploaded successfully, image ID:', imageId)

      } catch (uploadError) {
        // Backend is offline or upload failed — switch to mock mode
        console.warn('[useImageAnalysis] Backend offline, using mock data:', uploadError)
        setIsBackendOnline(false)
        useMockData = true
        toast('Backend offline — showing demo results', { icon: '⚠️', duration: 4000 })
      }

      // ── Step 2: Preprocessing ─────────────────────────────────────────────
      // This step represents the backend resizing and normalizing the image.
      // In the async flow, this is happening inside the Celery task.
      // We show it as a UI step with a realistic delay so the user sees
      // the pipeline progressing rather than jumping straight to "analyzing".
      setCurrentStep('preprocessing')
      await delay(useMockData ? 1200 : 800)

      // ── Step 3: Dispatch the async analysis task ───────────────────────────
      setCurrentStep('analyzing')

      let taskId: string | null = null

      if (!useMockData && imageId !== null) {
        try {
          const taskResponse = await api.post<{ task_id: string; status: string }>(
            `/images/${imageId}/analyze-async`
          )
          taskId = taskResponse.data.task_id
          console.log('[useImageAnalysis] Task dispatched, task ID:', taskId)
        } catch (taskError) {
          console.warn('[useImageAnalysis] Failed to dispatch task:', taskError)
          useMockData = true
        }
      }

      // ── Step 4: Poll for task completion ──────────────────────────────────
      setCurrentStep('generating_report')

      let finalResult: AnalysisResult

      if (!useMockData && taskId !== null) {
        try {
          const taskResult = await pollTaskCompletion(taskId)

          if (!taskResult.result) {
            throw new Error('Task completed but returned no result')
          }

          // Use the adapter to convert the raw backend shape into the
          // rich AnalysisResult shape that our UI components expect
          finalResult = adaptBackendResponse(
            taskResult.result,
            imageId!,
            file.name
          )

        } catch (pollError) {
          console.warn('[useImageAnalysis] Polling failed, using mock data:', pollError)
          finalResult = adaptBackendResponse(MOCK_BACKEND_RESPONSE, 0, file.name)
          toast('Analysis timed out — showing demo results', { icon: '⚠️' })
        }
      } else {
        // Backend was offline — use mock data with a realistic delay
        await delay(2000)
        finalResult = adaptBackendResponse(MOCK_BACKEND_RESPONSE, 0, file.name)
      }

      // ── Step 5: Complete ──────────────────────────────────────────────────
      await delay(500)
      setCurrentStep('complete')
      setResult(finalResult)

    } catch (err) {
      setCurrentStep('error')
      toast.error('Analysis failed unexpectedly. Please try again.')
      console.error('[useImageAnalysis] Fatal error:', err)
    }
  }, [])

  const reset = useCallback(() => {
    setCurrentStep('idle')
    setResult(null)
    setIsBackendOnline(true)
  }, [])

  return {
    currentStep,
    result,
    isProcessing: !['idle', 'complete', 'error'].includes(currentStep),
    isBackendOnline,
    startAnalysis,
    reset,
  }
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}