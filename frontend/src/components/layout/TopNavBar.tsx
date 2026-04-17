import { Bell, Search, Satellite } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

/**
 * Fixed top navigation bar with frosted glass effect.
 * Shows the project logo, search bar, notification bell, and connection status.
 */
export function TopNavBar() {
  const { notifications, connectionStatus } = useAppStore()
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header
      className="glass fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--color-teal), var(--color-amber))' }}
        >
          <Satellite size={16} className="text-white" />
        </div>
        <div>
          <h1
            className="text-sm font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--color-amber)' }}
          >
            ClimateRisk
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-muted)', fontSize: '10px' }}>
            Intelligence Dashboard
          </p>
        </div>
      </div>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
        >
          <Search size={14} />
          <span style={{ fontSize: '13px' }}>Search regions, reports...</span>
          <kbd
            className="ml-4 px-1.5 py-0.5 rounded text-xs"
            style={{ background: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Connection Status Dot */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'risk-pulse' : ''}`}
            style={{
              background:
                connectionStatus === 'connected'
                  ? 'var(--color-emerald)'
                  : connectionStatus === 'reconnecting'
                  ? 'var(--color-amber)'
                  : 'var(--color-muted)',
            }}
          />
          <span className="text-xs hidden sm:block" style={{ color: 'var(--color-muted)' }}>
            {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <Bell size={16} style={{ color: 'var(--color-muted)' }} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ background: 'var(--color-amber)', color: 'var(--color-bg-base)', fontSize: '10px' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--color-teal), var(--color-amber))',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          CR
        </div>
      </div>
    </header>
  )
}