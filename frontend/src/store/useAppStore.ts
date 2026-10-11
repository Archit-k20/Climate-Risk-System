import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RiskLevel, AnalysisRecord } from "@/types/analysis";
interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}
interface AppState {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  setConnectionStatus: (status: AppState["connectionStatus"]) => void;
  notificationPrefs: Record<RiskLevel, boolean>;
  setNotificationPref: (level: RiskLevel, value: boolean) => void;
  notifications: Notification[];
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
  recordCompletion: (record: AnalysisRecord) => void;
  seenAnalyses: string[];
  mapFilters: { riskLevels: RiskLevel[]; riskTypes: string[] };
  setMapFilters: (filters: Partial<AppState["mapFilters"]>) => void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      compactMode: false,
      setCompactMode: (compactMode) => set({ compactMode }),
      autoRefresh: true,
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      connectionStatus: "disconnected",
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      notificationPrefs: { high: true, medium: true, low: false },
      setNotificationPref: (level, value) =>
        set((s) => ({
          notificationPrefs: { ...s.notificationPrefs, [level]: value },
        })),
      notifications: [],
      seenAnalyses: [],
      clearNotifications: () => set({ notifications: [] }),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),
      recordCompletion: (record) =>
        set((s) => {
          const id = `${record.id}:${record.completed_at}`;
          if (s.seenAnalyses.includes(id)) return s;
          const notify =
            record.status === "completed" &&
            record.risk_level &&
            s.notificationPrefs[record.risk_level];
          return {
            seenAnalyses: [...s.seenAnalyses, id].slice(-200),
            notifications: notify
              ? [
                  {
                    id,
                    message: `${record.filename} · ${record.risk_level} risk`,
                    timestamp: record.completed_at!,
                    read: false,
                  },
                  ...s.notifications,
                ].slice(0, 50)
              : s.notifications,
          };
        }),
      mapFilters: {
        riskLevels: ["low", "medium", "high"],
        riskTypes: [
          "Drought",
          "Flood",
          "Wildfire",
          "Deforestation",
          "Erosion",
          "Pollution Risk",
        ],
      },
      setMapFilters: (filters) =>
        set((s) => ({ mapFilters: { ...s.mapFilters, ...filters } })),
    }),
    {
      name: "climaterisk-preferences-v2",
      partialize: (s) => ({
        theme: s.theme,
        compactMode: s.compactMode,
        autoRefresh: s.autoRefresh,
        notificationPrefs: s.notificationPrefs,
      }),
    },
  ),
);
