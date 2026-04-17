import L from 'leaflet'

// This fixes a well-known Leaflet + bundler bug where the default
// marker icon images (marker-icon.png, marker-shadow.png) can't be
// found because Vite mangles the asset paths during bundling.
// Since we're using custom SVG markers, we just point the default
// icon to empty strings to suppress the broken image errors entirely.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
})