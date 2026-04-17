import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { SimulatorParams, SimulationOutput } from '@/types/simulator'

interface SimulationInsightCardProps {
  params: SimulatorParams
  output: SimulationOutput
}

/**
 * Generates a plain-language insight from the current simulation state.
 *
 * When the backend is available, this calls the LLM endpoint.
 * When offline, it generates a deterministic local insight so the
 * UI always has something meaningful to show.
 */
function generateLocalInsight(params: SimulatorParams, output: SimulationOutput): string {
  const { riskMatrix, overallRiskScore } = output
  const highRisks = riskMatrix.filter(r => r.probability === 'high').map(r => r.riskType)
  const dominant  = riskMatrix.reduce((a, b) => a.score > b.score ? a : b)

  const cropLabel = params.cropType.charAt(0).toUpperCase() + params.cropType.slice(1)

  let insight = `Under these conditions, ${cropLabel} cultivation faces `

  if (overallRiskScore >= 60) {
    insight += `significant climate stress. `
  } else if (overallRiskScore >= 30) {
    insight += `moderate climate pressure. `
  } else {
    insight += `relatively favorable conditions. `
  }

  if (highRisks.length > 0) {
    insight += `${highRisks.join(' and ')} risk${highRisks.length > 1 ? 's are' : ' is'} the primary concern, `
    insight += `driven by ${params.rainfall < 150 ? 'critically low rainfall' : params.temperatureDelta > 4 ? 'severe temperature increase' : 'combined climatic stressors'}. `
  }

  insight += `The projected yield deficit of approximately ${Math.round((1 - output.monthlyYield[5].projected / output.monthlyYield[5].baseline) * 100)}% `
  insight += `suggests ${overallRiskScore > 60 ? 'urgent intervention' : overallRiskScore > 30 ? 'proactive management' : 'routine monitoring'} is warranted. `
  insight += `${dominant.riskType} mitigation should be prioritized in the near-term planning horizon.`

  return insight
}

/**
 * Typewriter effect: reveals the text character by character.
 * This is achieved by tracking how many characters to show,
 * then using a setInterval to increment that count every 20ms
 * until the full text is visible. The component re-runs this
 * effect whenever the insight text changes.
 */
function useTypewriter(text: string, speed: number = 18) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')  // reset when text changes
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return displayed
}

export function SimulationInsightCard({ params, output }: SimulationInsightCardProps) {
  const [insight, setInsight]   = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const displayedText = useTypewriter(insight, 18)

  useEffect(() => {
    setIsLoading(true)
    setInsight('')

    // Simulate a brief loading delay, then generate the insight.
    // In production, replace this with: api.post('/simulate/insight', { params, output })
    const timer = setTimeout(() => {
      const text = generateLocalInsight(params, output)
      setInsight(text)
      setIsLoading(false)
    }, 800)  // 800ms feels natural — long enough to notice the loading state

    return () => clearTimeout(timer)
  }, [params, output])

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        backgroundImage: 'radial-gradient(ellipse at top left, rgba(245,158,11,0.05), transparent 60%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}
        >
          <Sparkles size={12} style={{ color: 'var(--color-amber)' }} />
        </div>
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          AI Insight
        </p>
      </div>

      {/* Content area — shows skeleton while loading, text when ready */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {/* Three shimmer lines of decreasing width */}
            {[100, 90, 70].map((width, i) => (
              <div
                key={i}
                className="skeleton h-3 rounded"
                style={{ width: `${width}%` }}
              />
            ))}
            <div className="flex items-center gap-1.5 mt-1">
              <Loader2 size={10} className="animate-spin" style={{ color: 'var(--color-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                Generating insight...
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm leading-relaxed"
            style={{
              color: 'hsl(var(--foreground))',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '13px',
              lineHeight: '1.7',
            }}
          >
            {displayedText}
            {/* Blinking cursor at the end while text is still typing */}
            {displayedText.length < insight.length && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ color: 'var(--color-amber)' }}
              >
                |
              </motion.span>
            )}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}