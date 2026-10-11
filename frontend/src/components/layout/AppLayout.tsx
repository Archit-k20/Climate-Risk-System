import { useEffect, type ReactNode } from "react";
import { TopNavBar } from "./TopNavBar";
import { useAppStore } from "@/store/useAppStore";
import { usePageTitle } from "@/hooks/usePageTitle";
import { isDemo } from "@/lib/config";
export function AppLayout({ children }: { children: ReactNode }) {
  const theme = useAppStore((s) => s.theme);
  const compact = useAppStore((s) => s.compactMode);
  usePageTitle();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <div className={`app-shell ${compact ? "compact" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopNavBar />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <span>ClimateRisk / An environmental perspective</span>
        <span>
          {isDemo
            ? "Illustrative data · No live analysis"
            : "Heuristic analysis · Not calibrated scientific confidence"}
        </span>
      </footer>
    </div>
  );
}
