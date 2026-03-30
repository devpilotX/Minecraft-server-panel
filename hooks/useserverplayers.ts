"use client";

import { useQuery } from "@tanstack/react-query";
import { pteroClient } from "@/lib/api/pterodactyl";
import { type MinecraftPlayer } from "@/types/minecraft";

/* ========== CONSTANTS ========== */

const QUERY_KEY = "server-players";
const POLL_INTERVAL_MS = 10_000;
const RCON_ENDPOINT = "/api/rcon";

/* ========== HELPERS ========== */

interface RconListResponse {
  response: string;
}

/**
 * Parses the /list RCON response into player names.
 * Format: "There are X of a max of Y players online: player1, player2"
 * or "There are X/Y players online:" (varies by server software)
 */
function parseListResponse(response: string): string[] {
  if (!response || response.trim().length === 0) return [];

  const colonIndex = response.lastIndexOf(":");
  if (colonIndex === -1) return [];

  const playersPart = response.slice(colonIndex + 1).trim();
  if (playersPart.length === 0) return [];

  return playersPart
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * Extracts the player count from the /list response.
 */
function parsePlayerCount(response: string): {
  online: number;
  max: number;
} {
  const match = /There are (\d+)\s*(of a max of|\/)\s*(\d+)/i.exec(response);
  if (match?.[1] && match?.[3]) {
    return {
      online: parseInt(match[1], 10),
      max: parseInt(match[3], 10),
    };
  }
  return { online: 0, max: 0 };
}

/* ========== HOOK ========== */

interface UseServerPlayersOptions {
  enabled?: boolean;
  pollInterval?: number;
}

interface UseServerPlayersReturn {
  players: MinecraftPlayer[];
  onlineCount: number;
  maxPlayers: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  lastUpdated: Date | null;
}

/**
 * Fetches online players via RCON /list command.
 * Falls back to empty list if RCON is unavailable.
 * Polls every 10 seconds by default.
 */
export function useServerPlayers(
  options: UseServerPlayersOptions = {},
): UseServerPlayersReturn {
  const {
    enabled = true,
    pollInterval = POLL_INTERVAL_MS,
  } = options;

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<{
      players: MinecraftPlayer[];
      online: number;
      max: number;
    }> => {
      try {
        const response = await pteroClient.post<RconListResponse>(
          RCON_ENDPOINT,
          { command: "list" },
        );

        const rconResponse = response.data.response;
        const playerNames = parseListResponse(rconResponse);
        const counts = parsePlayerCount(rconResponse);

        const players: MinecraftPlayer[] = playerNames.map((name) => ({
          uuid: "",
          name,
          isOnline: true,
          isOp: false,
          isWhitelisted: false,
          isBanned: false,
        }));

        return {
          players,
          online: counts.online,
          max: counts.max,
        };
      } catch {
        return { players: [], online: 0, max: 0 };
      }
    },
    enabled,
    refetchInterval: pollInterval,
    staleTime: pollInterval - 2000,
    retry: 1,
  });

  return {
    players: query.data?.players ?? [],
    onlineCount: query.data?.online ?? 0,
    maxPlayers: query.data?.max ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
  };
}