import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { formatDistanceToNow } from 'date-fns'
import { RiskMapPoint } from '@/lib/mockData'

interface RiskMarkerProps {
  point: RiskMapPoint
}

// Maps risk level to our established color tokens
const RISK_COLORS = {
  low:    '#10b981',
  medium: '#f59e0b',
  high:   '#ef4444',
}

const RISK_SIZES = {
  low:    10,
  medium: 13,
  high:   16,
}

/**
 * Creates a custom Leaflet DivIcon using an SVG circle.
 * High-risk markers have a pulsing ring animation.
 * The icon is created outside React's render cycle because
 * Leaflet needs a plain L.Icon object, not a React component.
 */
function createRiskIcon(point: RiskMapPoint): L.DivIcon {
  const color = RISK_COLORS[point.riskLevel]
  const size  = RISK_SIZES[point.riskLevel]

  // The pulse ring is an extra circle that grows and fades for high-risk markers
  const pulseRing = point.riskLevel === 'high'
    ? `<circle cx="20" cy="20" r="${size + 4}" fill="none" stroke="${color}" 
        stroke-width="2" opacity="0.6">
        <animate attributeName="r" values="${size + 2};${size + 10};${size + 2}" 
          dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" 
          dur="2s" repeatCount="indefinite"/>
       </circle>`
    : ''

  const svgIcon = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      ${pulseRing}
      <circle cx="20" cy="20" r="${size}" fill="${color}" opacity="0.9"/>
      <circle cx="20" cy="20" r="${size - 4}" fill="${color}" opacity="0.4"/>
    </svg>
  `

  return L.divIcon({
    html: svgIcon,
    className: '',      // empty string removes Leaflet's default white box background
    iconSize: [40, 40],
    iconAnchor: [20, 20],   // anchor at center so the dot is exactly on the coordinate
    popupAnchor: [0, -20],  // popup appears above the marker
  })
}

export function RiskMarker({ point }: RiskMarkerProps) {
  const icon = createRiskIcon(point)
  const color = RISK_COLORS[point.riskLevel]

  return (
    <Marker position={[point.lat, point.lng]} icon={icon}>
      <Popup>
        {/*
          Popup content is regular HTML/JSX.
          The dark styling comes from our Leaflet CSS overrides in index.css.
        */}
        <div style={{ minWidth: '200px', fontFamily: 'IBM Plex Mono, monospace' }}>
          {/* Risk level badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: color, flexShrink: 0,
            }} />
            <span style={{
              fontSize: '11px', fontWeight: '700', letterSpacing: '1px',
              color, textTransform: 'uppercase',
            }}>
              {point.riskLevel} Risk — {point.riskType}
            </span>
          </div>

          {/* Region name */}
          <p style={{
            fontSize: '13px', fontWeight: '600', marginBottom: '4px',
            color: 'hsl(var(--foreground))',
          }}>
            {point.region}
          </p>

          {/* Filename */}
          <p style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '10px' }}>
            {point.filename}
          </p>

          {/* Risk score bar */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>Risk Score</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color }}>{point.riskScore}</span>
            </div>
            <div style={{
              height: '4px', borderRadius: '2px',
              background: 'var(--color-border)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                width: `${point.riskScore}%`, background: color,
              }} />
            </div>
          </div>

          {/* Timestamp */}
          <p style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
            {formatDistanceToNow(new Date(point.analyzedAt), { addSuffix: true })}
          </p>
        </div>
      </Popup>
    </Marker>
  )
}