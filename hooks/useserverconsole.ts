"use client";

import { useEffect, useRef, useCallback } from "react";
import { useConsoleStore } from "@/lib/store/useConsoleStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { getWebSocketAuth } from "@/lib/api/endpoints/server";
import { type WebSocketStats, type WebSocketMessage } from "@/types/pterodactyl";
import { type ConnectionStatus } from "@/types/app";

/* ========== CONSTANTS ========== */

const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

/* ========== HOOK ========== */

interface UseServerConsoleOptions {
  serverId: string;
  autoConnect?: boolean;
}

interface UseServerConsoleReturn {
  status: ConnectionStatus;
  sendCommand: (command: string) => void;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * WebSocket hook for the Pterodactyl server console.
 *
 * Handles:
 * - Authentication with JWT token
 * - Console output streaming
 * - Stats events (CPU, RAM, disk, network)
 * - Status change events
 * - Token refresh on "token expiring" event
 * - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s, 30s cap)
 * - JWT error recovery
 * - Cleanup on unmount
 */
export function useServerConsole(
  options: UseServerConsoleOptions,
): UseServerConsoleReturn {
  const { serverId, autoConnect = true } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isMountedRef = useRef(true);
  const isIntentionalCloseRef = useRef(false);

  const appendOutput = useConsoleStore((s) => s.appendOutput);
  const setConnectionStatus = useConsoleStore((s) => s.setConnectionStatus);
  const connectionStatus = useConsoleStore((s) => s.connectionStatus);
  const updateResources = useAppStore((s) => s.updateResources);
  const setPowerState = useAppStore((s) => s.setPowerState);

  /**
   * Calculates exponential backoff delay.
   */
  const getBackoffDelay = useCallback((): number => {
    const delay = Math.min(
      BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, reconnectAttemptRef.current),
      BACKOFF_MAX_MS,
    );
    return delay;
  }, []);

  /**
   * Cleans up the current WebSocket connection.
   */
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      isIntentionalCloseRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  /**
   * Establishes a WebSocket connection to the server console.
   */
  const connect = useCallback(async () => {
    if (!isMountedRef.current || !serverId) return;

    cleanup();
    isIntentionalCloseRef.current = false;
    setConnectionStatus("connecting");

    try {
      const authData = await getWebSocketAuth(serverId);
      const { token, socket: socketUrl } = authData.data;

      if (!isMountedRef.current) return;

      const ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        ws.send(JSON.stringify({ event: "auth", args: [token] }));
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;

        try {
          const message = JSON.parse(event.data as string) as WebSocketMessage;

          switch (message.event) {
            case "auth success":
              setConnectionStatus("connected");
              reconnectAttemptRef.current = 0;
              break;

            case "console output":
              if (message.args?.[0]) {
                appendOutput(message.args[0]);
              }
              break;

            case "stats": {
              if (message.args?.[0]) {
                try {
                  const stats = JSON.parse(message.args[0]) as WebSocketStats;
                  updateResources(stats);

                  if (stats.state) {
                    setPowerState(stats.state);
                  }
                } catch {
                  /* Ignore malformed stats */
                }
              }
              break;
            }

            case "status":
              if (message.args?.[0]) {
                const state = message.args[0] as WebSocketStats["state"];
                setPowerState(state);
              }
              break;

            case "token expiring":
              void (async () => {
                try {
                  const refreshed = await getWebSocketAuth(serverId);
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                      JSON.stringify({
                        event: "auth",
                        args: [refreshed.data.token],
                      }),
                    );
                  }
                } catch {
                  appendOutput(
                    "\x1b[1;33m[DevPilotX] Failed to refresh token. Reconnecting...\x1b[0m",
                  );
                  void connect();
                }
              })();
              break;

            case "jwt error":
              appendOutput(
                "\x1b[1;31m[DevPilotX] Session expired. Reconnecting...\x1b[0m",
              );
              void connect();
              break;

            case "daemon error":
              if (message.args?.[0]) {
                appendOutput(
                  `\x1b[1;31m[Daemon Error] ${message.args[0]}\x1b[0m`,
                );
              }
              break;

            default:
              break;
          }
        } catch {
          /* Ignore unparseable messages */
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        appendOutput(
          "\x1b[1;31m[DevPilotX] WebSocket error occurred.\x1b[0m",
        );
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;

        if (isIntentionalCloseRef.current) {
          setConnectionStatus("disconnected");
          return;
        }

        setConnectionStatus("reconnecting");
        const delay = getBackoffDelay();
        reconnectAttemptRef.current += 1;

        appendOutput(
          `\x1b[1;33m[DevPilotX] Connection lost. Reconnecting in ${(delay / 1000).toFixed(0)}s...\x1b[0m`,
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          void connect();
        }, delay);
      };
    } catch {
      if (!isMountedRef.current) return;

      setConnectionStatus("reconnecting");
      const delay = getBackoffDelay();
      reconnectAttemptRef.current += 1;

      appendOutput(
        `\x1b[1;31m[DevPilotX] Failed to connect. Retrying in ${(delay / 1000).toFixed(0)}s...\x1b[0m`,
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        void connect();
      }, delay);
    }
  }, [serverId, cleanup, setConnectionStatus, appendOutput, updateResources, setPowerState, getBackoffDelay]);

  /**
   * Sends a command through the WebSocket.
   */
  const sendCommand = useCallback(
    (command: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ event: "send command", args: [command] }),
        );
      }
    },
    [],
  );

  /**
   * Force reconnect.
   */
  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    void connect();
  }, [connect]);

  /**
   * Intentionally disconnect.
   */
  const disconnect = useCallback(() => {
    cleanup();
    setConnectionStatus("disconnected");
  }, [cleanup, setConnectionStatus]);

  /* Auto-connect on mount */
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      void connect();
    }

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [autoConnect, connect, cleanup]);

  return {
    status: connectionStatus,
    sendCommand,
    reconnect,
    disconnect,
  };
}