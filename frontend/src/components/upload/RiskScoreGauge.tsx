import { useEffect, useState } from "react"

interface RiskScoreGaugeProps {
  score: number
  riskLevel: string
}

const SIZE = 220
const STROKE = 14
const R = 90
const CX = SIZE / 2
const CY = SIZE / 2 + 20

const CIRCUMFERENCE = Math.PI * R

function scoreToColor(score: number) {
  if (score < 33) return "#10b981"
  if (score < 66) return "#f59e0b"
  return "#ef4444"
}

export function RiskScoreGauge({ score, riskLevel }: RiskScoreGaugeProps) {

  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const duration = 1200
    const start = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setAnimatedScore(Math.round(eased * score))

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [score])

  const arcColor = scoreToColor(score)

  const dashOffset =
    CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE

  const angle = (animatedScore / 100) * Math.PI
  const needleX = CX + R * Math.cos(Math.PI - angle)
  const needleY = CY - R * Math.sin(Math.PI - angle)

  return (
    <div className="flex flex-col items-center w-full">

      <p
        className="text-xs uppercase tracking-widest mb-3"
        style={{
          color: "var(--color-muted)",
          fontFamily: "IBM Plex Mono, monospace",
        }}
      >
        Risk Score
      </p>

      <svg
        viewBox="0 0 220 160"
        className="w-full max-w-55 h-auto"
      >

        {/* Background Arc */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Score Arc */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={arcColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />

        {/* Needle */}
        <line
          x1={CX}
          y1={CY}
          x2={needleX}
          y2={needleY}
          stroke={arcColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Pivot */}
        <circle cx={CX} cy={CY} r={6} fill={arcColor} />
        <circle cx={CX} cy={CY} r={3} fill="var(--color-bg-base)" />

        {/* Score */}
        <text
          x={CX}
          y={CY - 35}
          textAnchor="middle"
          fill={arcColor}
          fontSize="36"
          fontWeight="800"
          fontFamily="Syne, sans-serif"
        >
          {animatedScore}
        </text>

        <text
          x={CX}
          y={CY - 15}
          textAnchor="middle"
          fill="var(--color-muted)"
          fontSize="8"
          letterSpacing="2"
          fontFamily="IBM Plex Mono, monospace"
        >
          OUT OF 100
        </text>

      </svg>

      <p
        className="text-sm font-bold tracking-widest mt-2"
        style={{
          color: arcColor,
          fontFamily: "Syne, sans-serif",
        }}
      >
        {riskLevel.toUpperCase()} RISK
      </p>

    </div>
  )
}