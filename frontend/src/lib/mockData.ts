/**
 * Mock data for development. These shapes exactly match what the
 * real backend will return, so swapping to real API calls later
 * requires changing only the data-fetching hooks, not the components.
 */

export const mockKPIs = {
  totalAnalyzed: 1284,
  activeHighRiskZones: 37,
  averageRiskScore: 62,
  reportsGenerated: 218,
}

export const mockRiskDistribution = [
  { name: 'Low Risk',    value: 48, color: '#10b981' },  // emerald
  { name: 'Medium Risk', value: 33, color: '#f59e0b' },  // amber
  { name: 'High Risk',   value: 19, color: '#ef4444' },  // red
]

export const mockActivityFeed = [
  {
    id: '1',
    filename: 'sahel_region_march.jpg',
    riskType: 'Drought',
    confidence: 91,
    riskLevel: 'high' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 3),   // 3 mins ago
  },
  {
    id: '2',
    filename: 'amazon_basin_02.jpg',
    riskType: 'Flood',
    confidence: 78,
    riskLevel: 'medium' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 11),
  },
  {
    id: '3',
    filename: 'california_north_forest.jpg',
    riskType: 'Wildfire',
    confidence: 85,
    riskLevel: 'high' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 28),
  },
  {
    id: '4',
    filename: 'ganges_delta_survey.jpg',
    riskType: 'Flood',
    confidence: 63,
    riskLevel: 'medium' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: '5',
    filename: 'patagonia_grassland.jpg',
    riskType: 'Drought',
    confidence: 44,
    riskLevel: 'low' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 72),
  },
]

export const mockSystemStatus = [
  { name: 'FastAPI',      status: 'healthy'  as const },
  { name: 'PostgreSQL',   status: 'healthy'  as const },
  { name: 'Redis',        status: 'healthy'  as const },
  { name: 'ML Model',     status: 'healthy'  as const },
]

// Sparkline data for each KPI card — 7 days of trend values
export const mockSparklines = {
  totalAnalyzed:       [80, 95, 110, 102, 138, 145, 162],
  activeHighRiskZones: [28, 31, 29, 35, 33, 36, 37],
  averageRiskScore:    [55, 58, 61, 57, 63, 60, 62],
  reportsGenerated:    [12, 18, 15, 22, 19, 24, 21],
}

// ── Risk Map Data ─────────────────────────────────────────────────────────────
// Each entry represents one analyzed satellite image with a geographic location.
// Coordinates are real-world lat/lng pairs spread across different continents
// to make the map visually interesting and globally representative.

export interface RiskMapPoint {
  id: string
  lat: number
  lng: number
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  riskType: 'Drought' | 'Flood' | 'Wildfire' | 'Deforestation' | 'Erosion' | 'Pollution Risk'
  filename: string
  analyzedAt: string
  region: string
}

export const mockMapPoints: RiskMapPoint[] = [
  { id: '1',  lat: 26.9,   lng: 70.9,   riskScore: 88, riskLevel: 'high',   riskType: 'Drought',       filename: 'rajasthan_thar_01.jpg',       analyzedAt: '2026-04-10T08:00:00Z', region: 'Thar Desert, Rajasthan' },
  { id: '2',  lat: 10.0,   lng: 76.3,   riskScore: 79, riskLevel: 'high',   riskType: 'Flood',         filename: 'kerala_backwaters_02.jpg',    analyzedAt: '2026-04-11T09:00:00Z', region: 'Kerala Backwaters, Kerala' },
  { id: '3',  lat: 30.3,   lng: 78.0,   riskScore: 74, riskLevel: 'high',   riskType: 'Wildfire',      filename: 'uttarakhand_forest_03.jpg',   analyzedAt: '2026-04-12T10:00:00Z', region: 'Garhwal Hills, Uttarakhand' },
  { id: '4',  lat: 21.9,   lng: 88.1,   riskScore: 82, riskLevel: 'high',   riskType: 'Erosion',       filename: 'sundarbans_delta_04.jpg',     analyzedAt: '2026-04-13T11:00:00Z', region: 'Sundarbans Delta, West Bengal' },
  { id: '5',  lat: 28.6,   lng: 77.2,   riskScore: 69, riskLevel: 'medium', riskType: 'Pollution Risk', filename: 'delhi_ncr_05.jpg',            analyzedAt: '2026-04-09T12:00:00Z', region: 'Delhi NCR, Delhi' },
  { id: '6',  lat: 25.3,   lng: 82.9,   riskScore: 58, riskLevel: 'medium', riskType: 'Flood',         filename: 'varanasi_ganga_06.jpg',       analyzedAt: '2026-04-08T13:00:00Z', region: 'Ganga Plains, Uttar Pradesh' },
  { id: '7',  lat: 26.1,   lng: 91.7,   riskScore: 76, riskLevel: 'high',   riskType: 'Flood',         filename: 'assam_brahmaputra_07.jpg',    analyzedAt: '2026-04-07T14:00:00Z', region: 'Brahmaputra Valley, Assam' },
  { id: '8',  lat: 14.5,   lng: 75.8,   riskScore: 63, riskLevel: 'medium', riskType: 'Deforestation', filename: 'western_ghats_08.jpg',        analyzedAt: '2026-04-06T15:00:00Z', region: 'Western Ghats, Karnataka' },
  { id: '9',  lat: 19.1,   lng: 72.9,   riskScore: 55, riskLevel: 'medium', riskType: 'Pollution Risk', filename: 'mumbai_coastal_09.jpg',       analyzedAt: '2026-04-05T16:00:00Z', region: 'Mumbai Coastal Zone, Maharashtra' },
  { id: '10', lat: 32.1,   lng: 77.2,   riskScore: 71, riskLevel: 'high',   riskType: 'Wildfire',      filename: 'himachal_pine_10.jpg',        analyzedAt: '2026-04-04T17:00:00Z', region: 'Himachal Pradesh, HP' },
  { id: '11', lat: 23.3,   lng: 85.3,   riskScore: 42, riskLevel: 'medium', riskType: 'Deforestation', filename: 'jharkhand_forest_11.jpg',     analyzedAt: '2026-04-03T18:00:00Z', region: 'Chota Nagpur Plateau, Jharkhand' },
  { id: '12', lat: 17.4,   lng: 78.5,   riskScore: 37, riskLevel: 'low',    riskType: 'Drought',       filename: 'telangana_plateau_12.jpg',    analyzedAt: '2026-04-02T19:00:00Z', region: 'Deccan Plateau, Telangana' },
  { id: '13', lat: 22.5,   lng: 72.9,   riskScore: 29, riskLevel: 'low',    riskType: 'Drought',       filename: 'gujarat_semi_arid_13.jpg',    analyzedAt: '2026-04-01T07:00:00Z', region: 'Saurashtra, Gujarat' },
  { id: '14', lat: 13.1,   lng: 80.3,   riskScore: 44, riskLevel: 'medium', riskType: 'Erosion',       filename: 'chennai_coast_14.jpg',        analyzedAt: '2026-03-31T08:00:00Z', region: 'Coromandel Coast, Tamil Nadu' },
  { id: '15', lat: 20.3,   lng: 85.8,   riskScore: 61, riskLevel: 'medium', riskType: 'Flood',         filename: 'odisha_mahanadi_15.jpg',      analyzedAt: '2026-03-30T09:00:00Z', region: 'Mahanadi Basin, Odisha' },
]

// ── Reports Archive Data ───────────────────────────────────────────────────────
// Each ReportRecord represents one completed analysis that has been saved.
// In production these come from GET /api/v1/images — the backend database.
// The structure mirrors the AnalysisResult type but adds archive-specific
// fields like a human-readable location and a saved/starred flag.

export interface ReportRecord {
  id: string
  filename: string
  location: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  dominantRisk: 'Drought' | 'Flood' | 'Wildfire' | 'Deforestation' | 'Erosion'
  analyzedAt: string   // ISO date string
  starred: boolean
}

export const mockReports: ReportRecord[] = [
  { id: 'r1',  filename: 'sahel_region_march.jpg',      location: 'Sahel, Sudan',             riskScore: 88, riskLevel: 'high',   dominantRisk: 'Drought',       analyzedAt: '2026-03-15T08:00:00Z', starred: true  },
  { id: 'r2',  filename: 'amazon_basin_07.jpg',          location: 'Amazon Basin, Brazil',     riskScore: 79, riskLevel: 'high',   dominantRisk: 'Deforestation', analyzedAt: '2026-03-14T14:30:00Z', starred: false },
  { id: 'r3',  filename: 'california_sierra_03.jpg',     location: 'Sierra Nevada, CA',        riskScore: 72, riskLevel: 'high',   dominantRisk: 'Wildfire',      analyzedAt: '2026-03-14T10:00:00Z', starred: true  },
  { id: 'r4',  filename: 'ganges_delta_02.jpg',          location: 'Ganges Delta, Bangladesh', riskScore: 65, riskLevel: 'medium', dominantRisk: 'Flood',         analyzedAt: '2026-03-13T16:00:00Z', starred: false },
  { id: 'r5',  filename: 'mozambique_coast_01.jpg',      location: 'Mozambique Coast',         riskScore: 58, riskLevel: 'medium', dominantRisk: 'Drought',       analyzedAt: '2026-03-13T09:00:00Z', starred: false },
  { id: 'r6',  filename: 'cape_town_region_02.jpg',      location: 'Cape Town, South Africa',  riskScore: 44, riskLevel: 'medium', dominantRisk: 'Drought',       analyzedAt: '2026-03-12T11:00:00Z', starred: false },
  { id: 'r7',  filename: 'delhi_outskirts_01.jpg',       location: 'Delhi NCR, India',         riskScore: 61, riskLevel: 'medium', dominantRisk: 'Erosion',       analyzedAt: '2026-03-12T08:30:00Z', starred: true  },
  { id: 'r8',  filename: 'finland_lakes_01.jpg',         location: 'Helsinki Region, Finland', riskScore: 18, riskLevel: 'low',    dominantRisk: 'Flood',         analyzedAt: '2026-03-11T13:00:00Z', starred: false },
  { id: 'r9',  filename: 'australia_outback_05.jpg',     location: 'Central Australia',        riskScore: 83, riskLevel: 'high',   dominantRisk: 'Wildfire',      analyzedAt: '2026-03-11T07:00:00Z', starred: false },
  { id: 'r10', filename: 'tokyo_bay_survey.jpg',         location: 'Tokyo Bay, Japan',         riskScore: 31, riskLevel: 'low',    dominantRisk: 'Flood',         analyzedAt: '2026-03-10T15:00:00Z', starred: false },
  { id: 'r11', filename: 'lima_coastal_survey.jpg',      location: 'Lima Coast, Peru',         riskScore: 53, riskLevel: 'medium', dominantRisk: 'Erosion',       analyzedAt: '2026-03-10T10:00:00Z', starred: false },
  { id: 'r12', filename: 'patagonia_grassland_04.jpg',   location: 'Patagonia, Argentina',     riskScore: 39, riskLevel: 'medium', dominantRisk: 'Drought',       analyzedAt: '2026-03-09T12:00:00Z', starred: false },
]