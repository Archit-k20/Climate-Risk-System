import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './lib/leafletConfig'  // add this line
import './index.css'

// Leaflet CSS must be imported before any Leaflet components are used.
// Without this, map tiles render at wrong positions and popups are unstyled.
import 'leaflet/dist/leaflet.css'

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)