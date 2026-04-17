import { SimulatorParams, SimulationOutput, MonthlyYieldPoint, RiskMatrixCell } from '@/types/simulator'

// Month labels for the X axis of our chart
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Baseline yield in kg/ha for each crop type under ideal conditions.
// These are realistic agronomic values derived from FAO data.
const BASE_YIELDS: Record<SimulatorParams['cropType'], number> = {
  wheat:   3500,
  rice:    4200,
  maize:   5800,
  soybean: 2800,
  cotton:  1800,
}

// Each crop has a natural seasonal growth curve — yield peaks at
// different months depending on the crop's growing season.
// These multipliers shape the baseline curve across 12 months.
const SEASONAL_CURVES: Record<SimulatorParams['cropType'], number[]> = {
  wheat:   [0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 0.9, 0.7, 0.5, 0.4, 0.3, 0.2],
  rice:    [0.3, 0.3, 0.4, 0.6, 0.8, 1.0, 1.0, 0.9, 0.7, 0.5, 0.4, 0.3],
  maize:   [0.1, 0.2, 0.4, 0.7, 1.0, 1.0, 0.9, 0.8, 0.6, 0.3, 0.2, 0.1],
  soybean: [0.2, 0.3, 0.5, 0.8, 1.0, 1.0, 0.9, 0.7, 0.5, 0.3, 0.2, 0.2],
  cotton:  [0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.0, 0.9, 0.7, 0.4, 0.2, 0.1],
}

/**
 * The core simulation function. It takes the user's parameter choices
 * and returns a full SimulationOutput object with monthly projections
 * and risk assessments.
 *
 * The math here is intentionally simplified — it's a linear stress model
 * that applies penalty multipliers for each unfavorable condition.
 * A real agronomic model would use differential equations, but this
 * captures the directional relationships correctly and produces
 * realistic-looking output for a portfolio project.
 */
export function runSimulation(params: SimulatorParams): SimulationOutput {
  const baseYield = BASE_YIELDS[params.cropType]
  const seasonal  = SEASONAL_CURVES[params.cropType]

  // ── Calculate stress multipliers ───────────────────────────────────────────
  // Each factor returns a value between 0 and 1 where 1 = no stress, 0 = total failure.
  // Think of them as "what fraction of potential yield survives this stress?"

  // Rainfall stress: optimal around 250mm, too little or too much hurts yield
  const rainfallOptimal = 250
  const rainfallDeviation = Math.abs(params.rainfall - rainfallOptimal) / rainfallOptimal
  const rainfallStress = Math.max(0.2, 1 - rainfallDeviation * 0.8)

  // Temperature stress: warming generally hurts yield, cold snaps can help wheat
  // Each +1°C above baseline reduces yield by about 5% (IPCC research basis)
  const tempStress = params.temperatureDelta > 0
    ? Math.max(0.3, 1 - (params.temperatureDelta * 0.05))
    : Math.min(1.05, 1 - (params.temperatureDelta * 0.02))  // slight cold boost for some crops

  // Soil moisture stress
  const soilStressMap = { dry: 0.65, moderate: 1.0, wet: 0.82 }
  const soilStress = soilStressMap[params.soilMoisture]

  // Humidity has a mild effect — very high humidity promotes disease
  const humidityStress = params.humidity > 80
    ? 0.9                   // high humidity → slight disease pressure
    : params.humidity < 30
    ? 0.85                  // very dry air → moisture stress
    : 1.0                   // normal range → no penalty

  // Combined yield multiplier: all stresses compound multiplicatively
  const yieldMultiplier = rainfallStress * tempStress * soilStress * humidityStress

  // ── Build monthly yield projections ────────────────────────────────────────
  const monthlyYield: MonthlyYieldPoint[] = MONTHS.map((month, i) => ({
    month,
    baseline:  Math.round(baseYield * seasonal[i]),
    projected: Math.round(baseYield * seasonal[i] * yieldMultiplier),
  }))

  // ── Calculate risk matrix ──────────────────────────────────────────────────
  // Each risk type responds differently to the input parameters.
  // Drought risk increases with low rainfall and high temperature.
  // Flood risk increases with high rainfall and wet soil.
  // Wildfire risk increases with low humidity and high temperature.

  const droughtScore = Math.round(
    Math.min(100,
      (Math.max(0, (rainfallOptimal - params.rainfall) / rainfallOptimal) * 50) +
      (Math.max(0, params.temperatureDelta) * 5) +
      (params.soilMoisture === 'dry' ? 25 : 0)
    )
  )

  const floodScore = Math.round(
    Math.min(100,
      (Math.max(0, (params.rainfall - rainfallOptimal) / rainfallOptimal) * 60) +
      (params.soilMoisture === 'wet' ? 30 : 0) +
      (params.humidity > 75 ? 10 : 0)
    )
  )

  const wildfireScore = Math.round(
    Math.min(100,
      (Math.max(0, params.temperatureDelta) * 6) +
      (Math.max(0, (50 - params.humidity)) * 0.8) +
      (params.soilMoisture === 'dry' ? 20 : 0) +
      (Math.max(0, (rainfallOptimal - params.rainfall) / rainfallOptimal) * 25)
    )
  )

  // Convert raw score to probability label
  const scoreToProbability = (score: number): 'low' | 'medium' | 'high' =>
    score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'

  const riskMatrix: RiskMatrixCell[] = [
    { riskType: 'Drought',  score: droughtScore,  probability: scoreToProbability(droughtScore) },
    { riskType: 'Flood',    score: floodScore,    probability: scoreToProbability(floodScore) },
    { riskType: 'Wildfire', score: wildfireScore, probability: scoreToProbability(wildfireScore) },
  ]

  const overallRiskScore = Math.round(
    (droughtScore * 0.4) + (floodScore * 0.35) + (wildfireScore * 0.25)
  )

  return { monthlyYield, riskMatrix, overallRiskScore }
}