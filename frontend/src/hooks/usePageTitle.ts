import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Maps route paths to human-readable page titles
const ROUTE_TITLES: Record<string, string> = {
  '/':          'Overview',
  '/upload':    'Upload & Analyze',
  '/risk-map':  'Risk Map',
  '/simulator': 'Climate Simulator',
  '/reports':   'Reports Archive',
  '/settings':  'Settings',
}

/**
 * Updates the browser tab title whenever the route changes.
 * This is the kind of detail that makes a portfolio project feel
 * like a real product — the tab shows "Risk Map | ClimateRisk"
 * instead of just "ClimateRisk" on every page.
 */
export function usePageTitle() {
  const location = useLocation()

  useEffect(() => {
    const pageTitle = ROUTE_TITLES[location.pathname] ?? 'ClimateRisk'
    document.title = `${pageTitle} | ClimateRisk Intelligence`
  }, [location.pathname])
}