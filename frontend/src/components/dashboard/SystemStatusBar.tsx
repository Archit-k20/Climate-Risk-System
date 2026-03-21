import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { mockSystemStatus } from '@/lib/mockData'

// Shape of the backend's /health response
interface HealthResponse {
  status: string
  service: string
}

export function SystemStatusBar() {
  // Real API call to your FastAPI health endpoint.
  // refetchInterval: 30000 means it automatically re-checks every 30 seconds.
  const { data, isError } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then((r) => r.data),
    refetchInterval: 30_000,
    retry: 1,
  })

  // Derive the API status from the real response; fall back gracefully
  const apiIsHealthy = !isError && data?.status === 'ok'

  // Combine real API status with mock statuses for the other services
  const services = mockSystemStatus.map((s) =>
    s.name === 'FastAPI' ? { ...s, status: apiIsHealthy ? 'healthy' as const : 'offline' as const } : s
  )

  const statusColor = {
    healthy:  'var(--color-emerald)',
    degraded: 'var(--color-amber)',
    offline:  'var(--color-red)',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-6 px-4 py-2.5 rounded-xl mb-6 flex-wrap"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
      >
        System Status
      </span>

      <div className="flex items-center gap-4 flex-wrap">
        {services.map((service) => (
          <div key={service.name} className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'risk-pulse' : ''}`}
              style={{ background: statusColor[service.status] }}
            />
            <span
              className="text-xs"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {service.name}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}