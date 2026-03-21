import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Upload,
  Map,
  FlaskConical,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

// ─── Navigation Config ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/upload',     icon: Upload,          label: 'Upload & Analyze' },
  { to: '/risk-map',   icon: Map,             label: 'Risk Map'   },
  { to: '/simulator',  icon: FlaskConical,    label: 'Simulator'  },
  { to: '/reports',    icon: FileText,        label: 'Reports'    },
  { to: '/settings',   icon: Settings,        label: 'Settings'   },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Collapsible left sidebar.
 * In expanded mode: shows icons + labels.
 * In collapsed mode: shows icons only (saves horizontal space).
 * The width transition is handled by Framer Motion.
 */
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 z-40 flex flex-col overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* ── Nav Items ── */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}  // "end" ensures "/" only matches exactly
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive ? 'active-nav-item' : 'hover:bg-white/5'
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-amber)' : 'var(--color-muted)',
            })}
          >
            {({ isActive }) => (
              <>
                {/* Active left-border accent */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                    style={{ background: 'var(--color-amber)' }}
                  />
                )}

                <Icon size={18} className="shrink-0" />

                {/* Label — only rendered when sidebar is expanded */}
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      style={{
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: '12px',
                        color: isActive ? 'var(--color-amber)' : undefined,
                      }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={toggleSidebar}
        className="m-2 p-2 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
        style={{
          border: '1px solid var(--color-border)',
          color: 'var(--color-muted)',
        }}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  )
}