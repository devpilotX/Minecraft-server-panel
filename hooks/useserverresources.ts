"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { getServerResources } from "@/lib/api/endpoints/server";
import { useAppStore } from "@/lib/store/useAppStore";
import { type ResourceDataPoint } from "@/types/app";
import { formatChartTime } from "@/lib/utils/formatters";

/* ========== CONSTANTS ========== */

const POLL_INTERVAL_MS = 10_000;
const MAX_CHART_POINTS = 60;
const QUERY_KEY = "server-resources";

/* ========== HOOK ========== */

interface UseServerResourcesOptions {
  serverId?: string;
  enabled?: boolean;
  pollInterval?: number;
}

interface UseServerResourcesReturn {
  cpuPercent: number;
  memoryBytes: number;
  memoryLimitBytes: number;
  diskBytes: number;
  networkRxBytes: number;
  networkTxBytes: number;
  uptimeMs: number;
  chartData: ResourceDataPoint[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Polls the Pterodactyl API for server resource usage.
 * Also maintains a rolling chart data array (last 60 points).
 *
 * Note: When the WebSocket is connected, the store is updated
 * via useServerConsole. This hook serves as a fallback/supplement
 * and also maintains the chart data history.
 */
export function useServerResources(
  options: UseServerResourcesOptions = {},
): UseServerResourcesReturn {
  const {
    serverId = process.env["NEXT_PUBLIC_DEFAULT_SERVER_ID"] ?? "",
    enabled = true,
    pollInterval = POLL_INTERVAL_MS,
  } = options;

  const resources = useAppStore((s) => s.resources);
  const chartDataRef = useRef<ResourceDataPoint[]>([]);

  const updateChartData = useCallback(
    (cpu: number, memory: number) => {
      const now = new Date().toISOString();
      const point: ResourceDataPoint = {
        timestamp: formatChartTime(now),
        cpu: Math.min(100, Math.max(0, cpu)),
        memory: Math.min(100, Math.max(0, memory)),
      };

      chartDataRef.current = [
        ...chartDataRef.current.slice(-(MAX_CHART_POINTS - 1)),
        point,
      ];
    },
    [],
  );

  const query = useQuery({
    queryKey: [QUERY_KEY, serverId],
    queryFn: async () => {
      const data = await getServerResources(serverId);

      const memPercent =
        resources.memoryLimitBytes > 0
          ? (data.resources.memory_bytes / resources.memoryLimitBytes) * 100
          : 0;

      updateChartData(data.resources.cpu_absolute, memPercent);

      return data;
    },
    enabled: enabled && serverId.length > 0,
    refetchInterval: pollInterval,
    staleTime: pollInterval - 1000,
    retry: 2,
  });

  return {
    cpuPercent: resources.cpuPercent,
    memoryBytes: resources.memoryBytes,
    memoryLimitBytes: resources.memoryLimitBytes,
    diskBytes: resources.diskBytes,
    networkRxBytes: resources.networkRxBytes,
    networkTxBytes: resources.networkTxBytes,
    uptimeMs: resources.uptimeMs,
    chartData: chartDataRef.current,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}