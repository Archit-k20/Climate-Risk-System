import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
vi.mock("@/lib/config", () => ({ isDemo: false, apiURL: "/api/v1" }));
vi.mock("@/lib/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
  errorMessage: (error: Error) => error.message,
}));
import { api } from "@/lib/api";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { useReports } from "@/hooks/useReports";
import { demoReports } from "@/lib/demoData";
const file = new File(["image"], "image.png", { type: "image/png" });
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.useRealTimers());
describe("connected uploads", () => {
  it("never replaces upload failure with sample success", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("Upload rejected"));
    const { result } = renderHook(() => useImageAnalysis(), { wrapper });
    await act(async () => {
      await result.current.analyze(file);
    });
    expect(result.current.state).toBe("error");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe("Upload rejected");
  });
  it("preserves the canonical saved result", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 7 } })
      .mockResolvedValueOnce({ data: { task_id: "task" } });
    const record = { ...demoReports[0], provenance: "model" };
    vi.mocked(api.get).mockResolvedValue({
      data: { status: "completed", result: record },
    });
    const { result } = renderHook(() => useImageAnalysis(), { wrapper });
    await act(async () => {
      await result.current.analyze(file);
    });
    expect(result.current.result).toEqual(record);
    expect(result.current.state).toBe("complete");
  });
  it("does not let an old request repopulate a cleared file", async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(api.post).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = renderHook(() => useImageAnalysis(), { wrapper });
    let request: Promise<void>;
    act(() => {
      request = result.current.analyze(file);
    });
    act(() => result.current.reset());
    await act(async () => {
      finish({ data: { id: 7 } });
      await request;
    });
    expect(result.current.state).toBe("idle");
    expect(result.current.result).toBeNull();
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it("shows failed model tasks as errors", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 7 } })
      .mockResolvedValueOnce({ data: { task_id: "task" } });
    vi.mocked(api.get).mockResolvedValue({
      data: { status: "failed", details: "Models unavailable" },
    });
    const { result } = renderHook(() => useImageAnalysis(), { wrapper });
    await act(async () => {
      await result.current.analyze(file);
    });
    expect(result.current.state).toBe("error");
    expect(result.current.error).toBe("Models unavailable");
  });
  it("retains a slow task for subsequent status checks", async () => {
    vi.useFakeTimers();
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 7 } })
      .mockResolvedValueOnce({ data: { task_id: "task" } });
    vi.mocked(api.get).mockResolvedValue({ data: { status: "running" } });
    const { result } = renderHook(() => useImageAnalysis(), { wrapper });
    let request: Promise<void>;
    await act(async () => {
      request = result.current.analyze(file);
      await Promise.resolve();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(122000);
      await request;
    });
    expect(result.current.state).toBe("waiting");
    expect(result.current.result).toBeNull();
    vi.mocked(api.get).mockResolvedValue({
      data: { status: "completed", result: demoReports[0] },
    });
    await act(async () => {
      await result.current.analyze(file);
    });
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(result.current.state).toBe("complete");
  });
});
describe("connected archive", () => {
  it("keeps an empty database empty", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useReports(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
  it("exposes errors without demo fallback", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Offline"));
    const { result } = renderHook(() => useReports(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
