import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'
import { SimulatorControlPanel } from '@/components/simulator/SimulatorControlPanel'
import { ProjectedYieldChart } from '@/components/simulator/ProjectedYieldChart'
import { RiskImpactMatrix } from '@/components/simulator/RiskImpactMatrix'
import { SimulationInsightCard } from '@/components/simulator/SimulationInsightCard'
import { SimulatorParams, SimulationOutput, DEFAULT_PARAMS } from '@/types/simulator'
import { runSimulation } from '@/lib/simulationEngine'

export default function SimulatorPage() {
  // params: updates immediately on every slider move (drives the control panel UI)
  const [params, setParams] = useState<SimulatorParams>(DEFAULT_PARAMS)

  // debouncedParams: updates only after 300ms of no changes (drives the chart and matrix)
  // This is the key performance optimization — the simulation only runs once
  // the user has stopped adjusting, not on every individual slider tick.
  const [debouncedParams, setDebouncedParams] = useState<SimulatorParams>(DEFAULT_PARAMS)

  // output: the result of running the simulation on debouncedParams
  const [output, setOutput] = useState<SimulationOutput>(() => runSimulation(DEFAULT_PARAMS))

  // Debounce effect: whenever params changes, set a 300ms timer.
  // If params changes again before 300ms, the timer resets.
  // Only when params is stable for 300ms does debouncedParams update.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedParams(params)
    }, 300)
    return () => clearTimeout(timer)  // cleanup: cancel the pending timer
  }, [params])

  // Simulation effect: whenever debouncedParams changes, re-run the simulation.
  // This is a pure synchronous calculation so no loading state is needed here.
  useEffect(() => {
    const result = runSimulation(debouncedParams)
    setOutput(result)
  }, [debouncedParams])

  return (
    <PageTransition>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
          >
            Climate Simulator
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Adjust parameters to model climate risk scenarios and projected agricultural impact
          </p>
        </div>

        {/* Overall risk score badge — updates with simulation */}
        <motion.div
          key={output.overallRiskScore}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center px-4 py-2 rounded-xl shrink-0"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
            Risk Score
          </p>
          <p
            className="text-2xl font-bold"
            style={{
              fontFamily: 'Syne, sans-serif',
              color: output.overallRiskScore >= 60 ? 'var(--color-red)'
                   : output.overallRiskScore >= 30 ? 'var(--color-amber)'
                   : 'var(--color-emerald)',
            }}
          >
            {output.overallRiskScore}
          </p>
        </motion.div>
      </div>

      {/* Main layout: controls on left (2/5 width), outputs on right (3/5) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left: Control Panel ── */}
        <div className="xl:col-span-2">
          <SimulatorControlPanel params={params} onChange={setParams} />
        </div>

        {/* ── Right: Output Panels ── */}
        <div className="xl:col-span-3 flex flex-col gap-5">
          {/* Yield chart */}
          <ProjectedYieldChart
            data={output.monthlyYield}
            cropType={debouncedParams.cropType}
          />

          {/* Risk matrix */}
          <RiskImpactMatrix cells={output.riskMatrix} />

          {/* AI Insight — receives debouncedParams to avoid regenerating on every tick */}
          <SimulationInsightCard
            params={debouncedParams}
            output={output}
          />
        </div>
      </div>
    </PageTransition>
  )
}