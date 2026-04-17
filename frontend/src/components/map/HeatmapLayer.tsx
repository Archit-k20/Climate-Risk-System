import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
// We import leaflet.heat for its side effect — it attaches
// the heatLayer function onto the L object when imported.
import 'leaflet.heat'
import { RiskMapPoint } from '@/lib/mockData'

interface HeatmapLayerProps {
  points: RiskMapPoint[]
}

// Teach TypeScript that L.heatLayer exists after the plugin import.
// Without this, TypeScript doesn't know the plugin added this method to L.
declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: {
      minOpacity?: number
      radius?: number
      blur?: number
      max?: number
      gradient?: Record<string, string>
    }
  ): L.Layer
}

export function HeatmapLayer({ points }: HeatmapLayerProps) {
  // useMap() gives us the raw Leaflet map instance.
  // This hook only works inside a <MapContainer> component tree.
  const map = useMap()

  useEffect(() => {
    // Convert our risk points to the [lat, lng, intensity] format
    // that leaflet.heat expects. Intensity is normalized to 0-1.
    const heatData: [number, number, number][] = points.map((p) => [
      p.lat,
      p.lng,
      p.riskScore / 100,  // normalize: score 74 → intensity 0.74
    ])

    // Define the color gradient from cool (low risk) to hot (high risk).
    // The keys are intensity thresholds (0.0 to 1.0).
    const heatLayer = L.heatLayer(heatData, {
      radius: 40,
      blur: 25,
      maxZoom: 10,
      max: 1.0,
      minOpacity: 0.3,
      gradient: {
        0.0: '#06b6d4',   // teal — very low risk
        0.33: '#10b981',  // emerald — low risk
        0.55: '#f59e0b',  // amber — medium risk
        0.75: '#f97316',  // orange — elevated risk
        1.0: '#ef4444',   // red — high risk
      },
    })

    heatLayer.addTo(map)

    // Cleanup: remove the heat layer when the component unmounts
    // or when the points data changes (it will re-add with new data)
    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, points])

  // This component renders nothing to the DOM directly —
  // it works entirely through Leaflet's imperative API side effects
  return null
}