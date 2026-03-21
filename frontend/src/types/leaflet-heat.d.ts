// Manual type declaration for leaflet.heat plugin.
// This tells TypeScript what the module exports so we can import it
// without "module not found" errors. We only declare what we actually use.
declare module 'leaflet.heat' {
  import * as L from 'leaflet'

  // HeatLatLng is [latitude, longitude, intensity] where intensity is 0-1
  type HeatLatLng = [number, number, number]

  interface HeatMapOptions {
    minOpacity?: number
    maxZoom?: number
    max?: number
    radius?: number
    blur?: number
    gradient?: Record<number, string>
  }

  // Extends Leaflet's Layer class with the heat layer functionality
  function heatLayer(
    latlngs: HeatLatLng[],
    options?: HeatMapOptions
  ): L.Layer

  export { heatLayer, HeatLatLng, HeatMapOptions }
}