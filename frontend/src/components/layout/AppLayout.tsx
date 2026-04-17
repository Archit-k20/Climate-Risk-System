import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { TopNavBar } from './TopNavBar'
import { Sidebar } from './Sidebar'
import { useAppStore } from '@/store/useAppStore'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useEffect } from 'react'


interface AppLayoutProps {
  children: ReactNode
}

/**
 * Root layout shell.
 * Structure:
 *   - Fixed TopNavBar (64px tall, full width)
 *   - Fixed Sidebar (left, below navbar)
 *   - Scrollable main content area (right of sidebar, below navbar)
 *
 * The main content area's left margin animates in sync with the sidebar width.
 *
 */



export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed, theme } = useAppStore()
  usePageTitle() 
  useEffect(() => {
    // This is the bridge between the Zustand store and the CSS system.
    // When theme is 'light', the HTML element gets data-theme="light",
    // which activates the [data-theme="light"] CSS block above.
    // When theme is 'dark', we remove the attribute entirely,
    // falling back to the :root defaults which are already dark.
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
      <TopNavBar />
      <Sidebar />

      {/* Main content shifts right to make room for sidebar */}
      <motion.main
        animate={{ marginLeft: sidebarCollapsed ? 64 : 220 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="pt-16 min-h-screen"
      >
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  )
}