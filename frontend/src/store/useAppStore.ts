import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light'

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

// And this type definition at the top of the file, before the interface:
export interface LiveActivityEntry {
  id: string
  filename: string
  riskType: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
  timestamp: Date
  isLive: boolean
}

export interface Notification {
  id: string
  message: string
  type: 'info' | 'warning' | 'danger' | 'success'
  region?: string
  riskType?: string
  timestamp: Date
  read: boolean
}

interface AppState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // WebSocket connection status (wired up in Phase 7)
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void

  // Live notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  // Add to AppState interface:
  notificationPrefs: {
    highRisk: boolean
    mediumRisk: boolean
    lowRisk: boolean
  }
  setNotificationPref: (
    level: 'highRisk' | 'mediumRisk' | 'lowRisk',
    value: boolean
  ) => void

  // Add to the AppState interface, after the notifications section:
  liveActivityEntries: LiveActivityEntry[]
  addLiveActivityEntry: (entry: LiveActivityEntry) => void

  // Map filters
  mapFilters: {
    riskLevels: ('low' | 'medium' | 'high')[]
    riskTypes: string[]
  }
  setMapFilters: (filters: Partial<AppState['mapFilters']>) => void
  clearLiveActivityEntries: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  // Theme — dark by default as per design direction
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  // Sidebar — expanded by default
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // WebSocket
  connectionStatus: 'disconnected',
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 50), // cap at 50 notifications
    })),
  // Add to the store body:
notificationPrefs: {
  highRisk:   true,
  mediumRisk: true,
  lowRisk:    false,
},
setNotificationPref: (level, value) =>
  set((state) => ({
    notificationPrefs: {
      ...state.notificationPrefs,
      [level]: value,
    },
  })),
  liveActivityEntries: [],
addLiveActivityEntry: (entry) =>
  set((state) => ({
    // Prepend new entry and cap at 20 live entries
    liveActivityEntries: [entry, ...state.liveActivityEntries].slice(0, 20),
  })),
  clearLiveActivityEntries: () => set({ liveActivityEntries: [] }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),

  mapFilters: {
    riskLevels: ['low', 'medium', 'high'],
    riskTypes: ['Drought', 'Flood', 'Wildfire', 'Deforestation', 'Erosion'],
  },
  setMapFilters: (filters) =>
    set((state) => ({
      mapFilters: { ...state.mapFilters, ...filters },
    })),
}))
