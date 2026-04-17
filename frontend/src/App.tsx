import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { WebSocketProvider } from '@/providers/WebSocketProvider'

const DashboardPage  = lazy(() => import('@/pages/DashboardPage'))
const UploadPage     = lazy(() => import('@/pages/UploadPage'))
const RiskMapPage    = lazy(() => import('@/pages/RiskMapPage'))
const SimulatorPage  = lazy(() => import('@/pages/SimulatorPage'))
const ReportsPage    = lazy(() => import('@/pages/ReportsPage'))
const SettingsPage   = lazy(() => import('@/pages/SettingsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full risk-pulse"
            style={{
              background: 'var(--color-amber)',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/*
        WebSocketProvider must wrap BrowserRouter and everything inside it.
        This ensures every page, every component, every hook in the entire
        app can call useSocket() and receive the same shared socket instance.
        
        Previously this was broken because WebSocketProvider was a sibling
        of BrowserRouter (sitting next to it), not a parent of it.
        The provider must be an ANCESTOR, not a sibling.
      */}
      <WebSocketProvider serverUrl="http://localhost:8000">
        <BrowserRouter>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/"          element={<DashboardPage />}  />
                  <Route path="/upload"    element={<UploadPage />}     />
                  <Route path="/risk-map"  element={<RiskMapPage />}    />
                  <Route path="/simulator" element={<SimulatorPage />}  />
                  <Route path="/reports"   element={<ReportsPage />}    />
                  <Route path="/settings"  element={<SettingsPage />}   />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </AppLayout>
        </BrowserRouter>

        {/*
          Toaster sits inside WebSocketProvider but outside BrowserRouter
          because toast notifications don't need routing context —
          they render in a fixed portal above everything else anyway.
        */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-bg-card)',
              color: 'hsl(var(--foreground))',
              border: '1px solid var(--color-border)',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '13px',
            },
          }}
        />
      </WebSocketProvider>
    </QueryClientProvider>
  )
}