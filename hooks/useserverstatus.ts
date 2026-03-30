"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getServer, sendPowerAction } from "@/lib/api/endpoints/server";
import { getApiErrorMessage } from "@/lib/api/pterodactyl";
import { useAppStore } from "@/lib/store/useAppStore";
import { resolveServerStatus, type ServerStatus } from "@/types/app";
import { type PteroServer, type PowerSignal } from "@/types/pterodactyl";

/* ========== CONSTANTS ========== */

const QUERY_KEY = "server-details";
const STALE_TIME = 30_000;

const POWER_ACTION_LABELS: Record<PowerSignal, string> = {
  start: "Starting",
  stop: "Stopping",
  restart: "Restarting",
  kill: "Force stopping",
};

const POWER_SUCCESS_LABELS: Record<PowerSignal, string> = {
  start: "Server start signal sent",
  stop: "Server stop signal sent",
  restart: "Server restart signal sent",
  kill: "Server force stop signal sent",
};

/* ========== HOOK ========== */

interface UseServerStatusOptions {
  serverId?: string;
  enabled?: boolean;
}

interface UseServerStatusReturn {
  server: PteroServer | undefined;
  status: ServerStatus;
  isLoading: boolean;
  isError: boolean;
  sendPower: (signal: PowerSignal) => void;
  isPowerActionPending: boolean;
  activePowerSignal: PowerSignal | null;
  refetch: () => void;
}

/**
 * Fetches server details and provides power action mutations.
 * Updates the global app store with server name and status.
 */
export function useServerStatus(
  options: UseServerStatusOptions = {},
): UseServerStatusReturn {
  const {
    serverId = process.env["NEXT_PUBLIC_DEFAULT_SERVER_ID"] ?? "",
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const setServer = useAppStore((s) => s.setServer);
  const serverStatus = useAppStore((s) => s.server.serverStatus);

  const query = useQuery({
    queryKey: [QUERY_KEY, serverId],
    queryFn: async () => {
      const server = await getServer(serverId);

      const status = resolveServerStatus(
        (server.status as PteroServer["status"]) === null
          ? "offline"
          : (server.status as "running" | "starting" | "stopping" | "offline"),
        server.is_suspended,
        server.is_installing,
      );

      setServer({
        serverId: server.identifier,
        serverName: server.name,
        serverStatus: status,
        isSuspended: server.is_suspended,
        isInstalling: server.is_installing,
      });

      return server;
    },
    enabled: enabled && serverId.length > 0,
    staleTime: STALE_TIME,
    retry: 2,
  });

  const powerMutation = useMutation({
    mutationFn: async (signal: PowerSignal) => {
      await sendPowerAction(signal, serverId);
      return signal;
    },
    onMutate: (signal) => {
      toast.loading(POWER_ACTION_LABELS[signal] + " server...", {
        id: "power-action",
      });
    },
    onSuccess: (signal) => {
      toast.success(POWER_SUCCESS_LABELS[signal], {
        id: "power-action",
      });
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, serverId],
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error), {
        id: "power-action",
      });
    },
  });

  return {
    server: query.data,
    status: serverStatus,
    isLoading: query.isLoading,
    isError: query.isError,
    sendPower: (signal) => powerMutation.mutate(signal),
    isPowerActionPending: powerMutation.isPending,
    activePowerSignal: powerMutation.isPending
      ? (powerMutation.variables ?? null)
      : null,
    refetch: () => void query.refetch(),
  };
}