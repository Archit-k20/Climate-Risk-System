import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api";
import { isDemo } from "@/lib/config";
import { useAppStore } from "@/store/useAppStore";
import type { AnalysisRecord } from "@/types/analysis";
export type UploadState =
  | "idle"
  | "uploading"
  | "queued"
  | "running"
  | "waiting"
  | "complete"
  | "error";
export function useImageAnalysis() {
  const [state, setState] = useState<UploadState>("idle"),
    [result, setResult] = useState<AnalysisRecord | null>(null),
    [error, setError] = useState("");
  const request = useRef<AbortController | null>(null),
    imageId = useRef<number | null>(null),
    taskId = useRef<string | null>(null);
  const query = useQueryClient();
  const reset = useCallback(() => {
    request.current?.abort();
    request.current = null;
    imageId.current = null;
    taskId.current = null;
    setState("idle");
    setResult(null);
    setError("");
  }, []);
  useEffect(() => () => request.current?.abort(), []);
  const analyze = async (file: File) => {
    if (isDemo) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const { signal } = controller;
    setError("");
    setResult(null);
    try {
      if (!imageId.current) {
        setState("uploading");
        const form = new FormData();
        form.append("file", file);
        const upload = await api.post<{ id: number }>("/images/upload", form, {
          signal,
        });
        if (signal.aborted) return;
        imageId.current = upload.data.id;
      }
      if (!taskId.current) {
        const response = await api.post<{ task_id: string }>(
          `/images/${imageId.current}/analyze-async`,
          null,
          { signal },
        );
        if (signal.aborted) return;
        taskId.current = response.data.task_id;
      }
      setState("queued");
      const started = Date.now();
      while (!signal.aborted && Date.now() - started < 120_000) {
        const { data } = await api.get<{
          status: string;
          result: AnalysisRecord;
          details: string | null;
        }>(`/images/tasks/${taskId.current}`, { signal });
        if (signal.aborted) return;
        if (data.status === "completed" || data.status === "inconclusive") {
          setResult(data.result);
          setState("complete");
          useAppStore.getState().recordCompletion(data.result);
          for (const key of ["reports", "summary", "distribution"])
            void query.invalidateQueries({ queryKey: [key] });
          return;
        }
        if (data.status === "failed") {
          taskId.current = null;
          throw new Error(data.details || "Analysis failed. Please retry.");
        }
        setState(data.status === "running" ? "running" : "queued");
        await new Promise<void>((resolve) => {
          const finish = () => {
            clearTimeout(timer);
            signal.removeEventListener("abort", finish);
            resolve();
          };
          const timer = setTimeout(finish, 2000);
          signal.addEventListener("abort", finish, { once: true });
        });
      }
      if (!signal.aborted) setState("waiting");
    } catch (e) {
      if (!signal.aborted) {
        setError(errorMessage(e));
        setState("error");
      }
    }
  };
  return { state, result, error, analyze, reset };
}
