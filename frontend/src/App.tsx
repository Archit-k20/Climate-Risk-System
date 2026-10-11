import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
const Dashboard = lazy(() => import("@/pages/DashboardPage"));
const Upload = lazy(() => import("@/pages/UploadPage"));
const Map = lazy(() => import("@/pages/RiskMapPage"));
const Simulator = lazy(() => import("@/pages/SimulatorPage"));
const Reports = lazy(() => import("@/pages/ReportsPage"));
const Settings = lazy(() => import("@/pages/SettingsPage"));
const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
export default function App() {
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">
        <WebSocketProvider>
          <BrowserRouter>
            <AppLayout>
              <Suspense
                fallback={
                  <p className="empty-state" role="status">
                    Opening the observatory…
                  </p>
                }
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/risk-map" element={<Map />} />
                  <Route path="/simulator" element={<Simulator />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="*"
                    element={
                      <div className="empty-state">
                        <h1>Page not found.</h1>
                        <Link to="/">Return to the overview</Link>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </AppLayout>
          </BrowserRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-bg-card)",
                color: "var(--ink)",
                border: "1px solid var(--color-border)",
              },
            }}
          />
        </WebSocketProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
