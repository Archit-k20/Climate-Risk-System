import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { it, expect, vi } from "vitest";
import type { ReactNode } from "react";
vi.mock("@/lib/config", () => ({ isDemo: true, apiURL: "/api/v1" }));
import { api } from "@/lib/api";
import { useReports, useSummary, useDistribution } from "@/hooks/useReports";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
it("serves all demo data without API requests", async () => {
  const get = vi.spyOn(api, "get"),
    post = vi.spyOn(api, "post");
  const { result } = renderHook(
    () => ({
      reports: useReports(),
      summary: useSummary(),
      distribution: useDistribution(),
      upload: useImageAnalysis(),
    }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.reports.isSuccess).toBe(true));
  expect(result.current.summary.data?.total_analyzed).toBe(6);
  expect(result.current.distribution.data?.total).toBe(6);
  await result.current.upload.analyze(new File(["x"], "sample.png"));
  expect(get).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();
});
