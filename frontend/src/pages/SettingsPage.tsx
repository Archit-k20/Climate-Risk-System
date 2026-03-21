import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'
import { useAppStore } from '@/store/useAppStore'
import {
  Bell, Palette, Database,
  Monitor, Moon, Sun, Check, Info
} from 'lucide-react'
import toast from 'react-hot-toast'

// Each settings section is visually grouped in its own card.
// This pattern is used by every major settings UI (macOS, Linear, Vercel).
function SettingsSection({
  title,
  description,
  children,
  icon: Icon,
}: {
  title: string
  description: string
  children: React.ReactNode
  icon: React.ElementType
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}
        >
          <Icon size={15} style={{ color: 'var(--color-amber)' }} />
        </div>
        <div>
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
          >
            {title}
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Section content */}
      <div style={{ background: 'var(--color-bg-card)' }}>
        {children}
      </div>
    </motion.div>
  )
}

// A single settings row — label on left, control on right.
// Used for toggles, selects, and button controls.
function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div>
        <p
          className="text-sm"
          style={{ color: 'hsl(var(--foreground))', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

// A styled toggle switch component
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all duration-200"
      style={{
        background: checked ? 'var(--color-emerald)' : 'var(--color-border)',
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="absolute top-1 w-4 h-4 rounded-full"
        style={{ background: 'white' }}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { theme, setTheme, clearNotifications } = useAppStore()

  // Local settings state — in production these would be persisted
  // to localStorage or a user preferences API endpoint
  const { notificationPrefs, setNotificationPref } = useAppStore()  
  const [autoRefresh,      setAutoRefresh]      = useState(true)
  const [compactMode,      setCompactMode]      = useState(false)

  const handleClearNotifications = () => {
    clearNotifications()
    toast.success('All notifications cleared')
  }

  return (
    <PageTransition>
      {/* Page Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
        >
          Settings
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          Customize your dashboard experience and notification preferences
        </p>
      </div>

      <div className="flex flex-col gap-5 max-w-2xl">

        {/* ── Appearance ── */}
        <SettingsSection
          title="Appearance"
          description="Control the visual style of your dashboard"
          icon={Palette}
        >
          <SettingsRow
            label="Theme"
            description="Choose between dark and light mode"
          >
            <div className="flex items-center gap-2">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: theme === t ? 'rgba(245,158,11,0.15)' : 'transparent',
                    border: `1px solid ${theme === t ? 'var(--color-amber)' : 'var(--color-border)'}`,
                    color: theme === t ? 'var(--color-amber)' : 'var(--color-muted)',
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  {t === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {theme === t && <Check size={10} />}
                </button>
              ))}
            </div>
          </SettingsRow>

          <SettingsRow
            label="Compact Mode"
            description="Reduce spacing for more information density"
          >
            <Toggle checked={compactMode} onChange={setCompactMode} />
          </SettingsRow>
        </SettingsSection>

        {/* ── Notifications ── */}
        <SettingsSection
          title="Notifications"
          description="Configure which risk events trigger alerts"
          icon={Bell}
        >
          <SettingsRow
            label="High Risk Alerts"
            description="Show banner and toast for high risk detections"
          >
            <Toggle
              checked={notificationPrefs.highRisk}
              onChange={(v) => setNotificationPref('highRisk', v)}
            />
          </SettingsRow>

          <SettingsRow
            label="Medium Risk Warnings"
            description="Show toast notifications for medium risk events"
          >
            <Toggle
              checked={notificationPrefs.mediumRisk}
              onChange={(v) => setNotificationPref('mediumRisk', v)}
            />
          </SettingsRow>

          <SettingsRow
            label="Low Risk Updates"
            description="Show subtle notifications for low risk analyses"
          >
            <Toggle
              checked={notificationPrefs.lowRisk}
              onChange={(v) => setNotificationPref('lowRisk', v)}
            />
          </SettingsRow>

          <div className="px-6 py-4">
            <button
              onClick={handleClearNotifications}
              className="text-xs px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
              style={{
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)',
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              Clear all notifications
            </button>
          </div>
        </SettingsSection>

        {/* ── Data & Refresh ── */}
        <SettingsSection
          title="Data & Refresh"
          description="Control how the dashboard fetches and updates data"
          icon={Database}
        >
          <SettingsRow
            label="Auto Refresh"
            description="Automatically refresh system status every 30 seconds"
          >
            <Toggle checked={autoRefresh} onChange={setAutoRefresh} />
          </SettingsRow>

          <SettingsRow
            label="Backend URL"
            description="FastAPI server endpoint for all API calls"
          >
            <span
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                background: 'rgba(6,182,212,0.1)',
                color: 'var(--color-teal)',
                fontFamily: 'IBM Plex Mono, monospace',
                border: '1px solid rgba(6,182,212,0.2)',
              }}
            >
              localhost:8000
            </span>
          </SettingsRow>
        </SettingsSection>

        {/* ── System Info ── */}
        <SettingsSection
          title="System Information"
          description="Version and build details"
          icon={Monitor}
        >
          {[
            { label: 'Dashboard Version', value: 'v1.0.0' },
            { label: 'React Version',     value: '18.3.1' },
            { label: 'Build Mode',        value: import.meta.env.MODE },
            { label: 'ML Model',          value: 'ViT-Base-Patch16' },
            { label: 'Dataset',           value: 'EuroSAT (10 classes)' },
          ].map(({ label, value }) => (
            <SettingsRow key={label} label={label}>
              <span
                className="text-xs"
                style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {value}
              </span>
            </SettingsRow>
          ))}
        </SettingsSection>

        {/* ── Security notice ── */}
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.2)',
          }}
        >
          <Info size={14} style={{ color: 'var(--color-teal)', flexShrink: 0, marginTop: '2px' }} />
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace' }}
          >
            This dashboard is a portfolio demonstration. In a production deployment,
            settings would be persisted server-side with user authentication via JWT tokens.
            The ML pipeline uses EuroSAT-trained ViT, ResNet, and XGBoost ensemble models.
          </p>
        </div>

      </div>
    </PageTransition>
  )
}