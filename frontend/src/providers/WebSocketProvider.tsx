import { useEffect, type ReactNode } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { isDemo, socketURL } from "@/lib/config";
import { useAppStore } from "@/store/useAppStore";
import type { AnalysisRecord } from "@/types/analysis";
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  useEffect(() => {
    if (isDemo) return;
    const socket = io(socketURL, { reconnectionAttempts: 5 });
    socket.on("connect", () =>
      useAppStore.getState().setConnectionStatus("connected"),
    );
    socket.on("disconnect", () =>
      useAppStore.getState().setConnectionStatus("disconnected"),
    );
    socket.on("connect_error", () =>
      useAppStore.getState().setConnectionStatus("disconnected"),
    );
    socket.on("analysis_complete", (record: AnalysisRecord) => {
      useAppStore.getState().recordCompletion(record);
      for (const key of ["reports", "summary", "distribution"])
        void client.invalidateQueries({ queryKey: [key] });
    });
    return () => {
      socket.disconnect();
    };
  }, [client]);
  return children;
}
