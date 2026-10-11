import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { isDemo } from "@/lib/config";
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className="toggle"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}
export default function SettingsPage() {
  const s = useAppStore();
  return (
    <PageTransition>
      <PageHeader
        number="06"
        title="Make room for your perspective."
        description="A few considered preferences for how you explore the observatory. Your choices are saved in this browser."
      />
      <div className="settings-layout">
        <section className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-row">
            <div>
              <h3>Colour theme</h3>
              <p>Paper and green, or a quieter dark canvas.</p>
            </div>
            <div className="segmented" aria-label="Colour theme">
              <button
                aria-pressed={s.theme === "light"}
                onClick={() => s.setTheme("light")}
              >
                Light
              </button>
              <button
                aria-pressed={s.theme === "dark"}
                onClick={() => s.setTheme("dark")}
              >
                Dark
              </button>
            </div>
          </div>
          <div className="setting-row">
            <div>
              <h3>Compact layout</h3>
              <p>Reduce spacing in panels, tables, and lists.</p>
            </div>
            <Toggle
              label="Compact layout"
              checked={s.compactMode}
              onChange={s.setCompactMode}
            />
          </div>
        </section>
        <section className="settings-section">
          <h2>Notifications</h2>
          {(["high", "medium", "low"] as const).map((level) => (
            <div className="setting-row" key={level}>
              <div>
                <h3>{level[0].toUpperCase() + level.slice(1)}-risk analyses</h3>
                <p>Notify when a connected analysis completes at this level.</p>
              </div>
              <Toggle
                label={`${level} risk notifications`}
                checked={s.notificationPrefs[level]}
                onChange={(value) => s.setNotificationPref(level, value)}
              />
            </div>
          ))}
          <div className="setting-row">
            <p>{s.notifications.length} notifications in this session</p>
            <button
              className="button secondary"
              onClick={s.clearNotifications}
              disabled={!s.notifications.length}
            >
              Clear notifications
            </button>
          </div>
        </section>
        <section className="settings-section">
          <h2>Workspace</h2>
          <div className="setting-row">
            <div>
              <h3>Automatic refresh</h3>
              <p>
                Refresh connected dashboards and reports every 30 seconds.
                Active analyses still check their own status.
              </p>
            </div>
            <Toggle
              label="Automatic refresh"
              checked={s.autoRefresh}
              onChange={s.setAutoRefresh}
            />
          </div>
          <div className="setting-row">
            <div>
              <h3>Current mode</h3>
              <p>
                {isDemo
                  ? "Demonstration · Sample records, no backend connections."
                  : "Connected · Results come from the configured backend."}
              </p>
            </div>
          </div>
          <p className="record-meta">
            The map remains illustrative and the simulator uses local heuristic
            formulas in both modes.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
