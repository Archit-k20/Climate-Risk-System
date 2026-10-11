import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isDemo } from "@/lib/config";
import { demoReports, demoSummary } from "@/lib/demoData";
import { useAppStore } from "@/store/useAppStore";
import type { AnalysisRecord, Summary } from "@/types/analysis";
export function useReports() {
  const autoRefresh = useAppStore((s) => s.autoRefresh);
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      if (isDemo) return demoReports;
      const records: AnalysisRecord[] = [];
      for (let skip = 0; ; skip += 100) {
        const { data } = await api.get<AnalysisRecord[]>(
          "/images/reports/full",
          { params: { skip, limit: 100 } },
        );
        records.push(...data);
        if (data.length < 100) return records;
      }
    },
    refetchInterval: !isDemo && autoRefresh ? 30_000 : false,
  });
}
export function useSummary() {
  const autoRefresh = useAppStore((s) => s.autoRefresh);
  return useQuery({
    queryKey: ["summary"],
    queryFn: async () =>
      isDemo
        ? demoSummary
        : (await api.get<Summary>("/images/stats/summary")).data,
    refetchInterval: !isDemo && autoRefresh ? 30_000 : false,
  });
}
export function useDistribution() {
  const autoRefresh = useAppStore((s) => s.autoRefresh);
  return useQuery({
    queryKey: ["distribution"],
    queryFn: async () =>
      isDemo
        ? { low: 2, medium: 2, high: 2, total: 6 }
        : (
            await api.get<{
              low: number;
              medium: number;
              high: number;
              total: number;
            }>("/images/stats/distribution")
          ).data,
    refetchInterval: !isDemo && autoRefresh ? 30_000 : false,
  });
}
