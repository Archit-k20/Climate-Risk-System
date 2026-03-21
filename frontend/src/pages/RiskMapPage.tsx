import { useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { PageTransition } from '@/components/layout/PageTransition'
import { HeatmapLayer } from '@/components/map/HeatmapLayer'
import { RiskMarker } from '@/components/map/RiskMarker'
import { MapFilterPanel } from '@/components/map/MapFilterPanel'
import { MapLegend } from '@/components/map/MapLegend'
import { mockMapPoints } from '@/lib/mockData'
import { useAppStore } from '@/store/useAppStore'

export default function RiskMapPage() {
  const { mapFilters } = useAppStore()

  // Filter the map points based on active filter selections.
  // useMemo prevents recalculating on every render — only recalculates
  // when the filters or the source data actually change.
  const filteredPoints = useMemo(() =>
    mockMapPoints.filter(
      (p) =>
        mapFilters.riskLevels.includes(p.riskLevel) &&
        mapFilters.riskTypes.includes(p.riskType)
    ),
    [mapFilters]
  )

  return (
    <PageTransition>
      {/* Page header */}
      <div className="mb-4">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
        >
          Geospatial Risk Map
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {filteredPoints.length} of {mockMapPoints.length} risk zones displayed
        </p>
      </div>

      {/* Map container — relative positioning allows overlay panels */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          height: 'calc(100vh - 200px)',
          border: '1px solid var(--color-border)',
          minHeight: '500px',
        }}
      >
        {/*
          MapContainer renders the Leaflet map.
          - center: starting view position (centered on Africa/Europe for global coverage)
          - zoom: starting zoom level (3 = continental view)
          - style height 100% fills the parent div
          - zoomControl: false because we'll use the default zoom controls styled via CSS
        */}
        <MapContainer
          center={[20, 10]}
          zoom={3}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          {/*
            OpenStreetMap tile layer — free, no API key required.
            We use the CartoDB dark matter tiles for a dark aesthetic
            that matches our dashboard theme perfectly.
          */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />

          {/* Heatmap overlay — renders the risk intensity gradient */}
          <HeatmapLayer points={filteredPoints} />

          {/* Individual risk markers — one per analyzed image location */}
          {filteredPoints.map((point) => (
            <RiskMarker key={point.id} point={point} />
          ))}
        </MapContainer>

        {/* Filter panel — floats over the map in the top-left */}
        <div className="absolute top-4 left-4" style={{ zIndex: 1000 }}>
          <MapFilterPanel />
        </div>

        {/* Legend — floats over the map in the bottom-right */}
        <div className="absolute bottom-4 right-4" style={{ zIndex: 1000 }}>
          <MapLegend />
        </div>

        {/* Point count badge — top-right */}
        <div
          className="absolute top-4 right-4 px-3 py-1.5 rounded-lg glass"
          style={{ zIndex: 1000 }}
        >
          <span
            className="text-xs"
            style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {filteredPoints.length} zones active
          </span>
        </div>
      </div>
    </PageTransition>
  )
}