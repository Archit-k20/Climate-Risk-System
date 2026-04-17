import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { mockSystemStatus } from '@/lib/mockData'
import { Activity } from 'lucide-react'

interface HealthResponse {
  status: string
  service: string
}

export function SystemStatusBar() {
  const { data, isError } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then((r) => r.data),
    refetchInterval: 30_000,
    retry: 1,
  })

  const apiIsHealthy = !isError && data?.status === 'ok'

  const services = mockSystemStatus.map((s) =>
    s.name === 'FastAPI'
      ? { ...s, status: apiIsHealthy ? 'healthy' as const : 'offline' as const }
      : s
  )

  const allHealthy = services.every(s => s.status === 'healthy')

  const statusConfig = {
    healthy:  { color: 'var(--color-emerald)' },
    degraded: { color: 'var(--color-amber)'   },
    offline:  { color: 'var(--color-red)'     },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between px-5 py-3 rounded-2xl mb-5 flex-wrap gap-3"
      style={{
        background: 'linear-gradient(90deg, #0d1424 0%, #090e1a 100%)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Left: overall status */}
      <div className="flex items-center gap-2.5">
        <Activity size={13} style={{ color: allHealthy ? 'var(--color-emerald)' : 'var(--color-amber)' }} />
        <span className="text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: allHealthy ? 'var(--color-emerald)' : 'var(--color-amber)', fontFamily: 'IBM Plex Mono, monospace' }}>
          {allHealthy ? 'All Systems Operational' : 'Partial Degradation'}
        </span>
      </div>

      {/* Right: individual service dots */}
      <div className="flex items-center gap-5">
        {services.map((service) => {
          const status = service.status as keyof typeof statusConfig
          const cfg = statusConfig[status]
          return (
            <div key={service.name} className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${status === 'healthy' ? 'risk-pulse' : ''}`}
                style={{ background: cfg.color }}
              />
              <span className="text-xs" style={{ color: 'hsl(var(--foreground) / 0.6)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {service.name}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}