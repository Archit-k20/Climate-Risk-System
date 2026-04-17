import { useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { PageTransition } from '@/components/layout/PageTransition'
import { HeatmapLayer } from '@/components/map/HeatmapLayer'
import { RiskMarker } from '@/components/map/RiskMarker'
import { MapFilterPanel } from '@/components/map/MapFilterPanel'
import { MapLegend } from '@/components/map/MapLegend'
import { mockMapPoints } from '@/lib/mockData'
import { useAppStore } from '@/store/useAppStore'
import { Globe, MapPin } from 'lucide-react'

export default function RiskMapPage() {
  const { mapFilters } = useAppStore()

  const filteredPoints = useMemo(() =>
    mockMapPoints.filter(
      (p) =>
        mapFilters.riskLevels.includes(p.riskLevel) &&
        (mapFilters.riskTypes.includes(p.riskType) || mapFilters.riskTypes.length === 0)
    ),
    [mapFilters]
  )

  const highCount   = filteredPoints.filter(p => p.riskLevel === 'high').length
  const mediumCount = filteredPoints.filter(p => p.riskLevel === 'medium').length
  const lowCount    = filteredPoints.filter(p => p.riskLevel === 'low').length

  return (
    <PageTransition>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={13} style={{ color: 'var(--color-teal)' }} />
            <span
              className="text-xs uppercase tracking-[0.15em]"
              style={{ color: 'var(--color-teal)', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              India Climate Risk Atlas
            </span>
          </div>
          <h2
            className="text-3xl font-black"
            style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
          >
            Geospatial Risk Map
          </h2>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {filteredPoints.length} of {mockMapPoints.length} risk zones displayed across India
          </p>
        </div>

        {/* Risk level summary pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} />
            <span className="text-xs font-bold" style={{ color: '#ef4444', fontFamily: 'IBM Plex Mono, monospace' }}>
              {highCount} High
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
            <span className="text-xs font-bold" style={{ color: '#f59e0b', fontFamily: 'IBM Plex Mono, monospace' }}>
              {mediumCount} Medium
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
            <span className="text-xs font-bold" style={{ color: '#10b981', fontFamily: 'IBM Plex Mono, monospace' }}>
              {lowCount} Low
            </span>
          </div>
        </div>
      </div>

      {/* ── Map Container ───────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          height: 'calc(100vh - 220px)',
          border: '1px solid var(--color-border)',
          minHeight: '520px',
          boxShadow: '0 0 0 1px rgba(6,182,212,0.08)',
        }}
      >
        <MapContainer
          center={[20.5, 78.9]}   // Geographic centre of India
          zoom={5}                 // Country-level zoom
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          minZoom={4}
          maxZoom={14}
        >
          {/* Dark CartoDB tiles — matches our dashboard theme */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />

          {/* Heatmap overlay */}
          <HeatmapLayer points={filteredPoints} />

          {/* Individual risk markers */}
          {filteredPoints.map((point) => (
            <RiskMarker key={point.id} point={point} />
          ))}
        </MapContainer>

        {/* Filter panel — top-left overlay */}
        <div className="absolute top-4 left-4" style={{ zIndex: 1000 }}>
          <MapFilterPanel />
        </div>

        {/* Legend — bottom-right overlay */}
        <div className="absolute bottom-4 right-4" style={{ zIndex: 1000 }}>
          <MapLegend />
        </div>

        {/* Zone count badge — top-right */}
        <div
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{
            zIndex: 1000,
            background: 'rgba(13,20,36,0.85)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <MapPin size={11} style={{ color: 'var(--color-teal)' }} />
          <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}>
            {filteredPoints.length} zones active
          </span>
        </div>
      </div>
    </PageTransition>
  )
}