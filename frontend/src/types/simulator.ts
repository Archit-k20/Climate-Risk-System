// These are the input knobs the user controls on the left panel
export interface SimulatorParams {
  rainfall: number        // mm — range 0 to 500
  temperatureDelta: number // °C change from baseline — range -5 to +10
  humidity: number        // percentage — range 0 to 100
  soilMoisture: 'dry' | 'moderate' | 'wet'
  cropType: 'wheat' | 'rice' | 'maize' | 'soybean' | 'cotton'
}

// The outputs that the simulation produces from those inputs
export interface SimulationOutput {
  monthlyYield: MonthlyYieldPoint[]   // 12 months of baseline vs projected yield
  riskMatrix: RiskMatrixCell[]        // how each risk type is affected
  overallRiskScore: number            // 0-100 composite risk score
}

export interface MonthlyYieldPoint {
  month: string
  baseline: number    // yield under current/historical conditions (kg/ha)
  projected: number   // yield under the simulated parameters (kg/ha)
}

export interface RiskMatrixCell {
  riskType: 'Drought' | 'Flood' | 'Wildfire'
  probability: 'low' | 'medium' | 'high'
  score: number   // 0-100
}

// Default parameters — what the simulator shows on first load
export const DEFAULT_PARAMS: SimulatorParams = {
  rainfall: 250,
  temperatureDelta: 0,
  humidity: 60,
  soilMoisture: 'moderate',
  cropType: 'wheat',
}