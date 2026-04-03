"use client";

import { useEffect, useRef, useCallback } from "react";
import { useConsoleStore } from "@/lib/store/useconsolestore";
import { useAppStore } from "@/lib/store/useappstore";
import type { WebSocketStats } from "@/types/pterodactyl";

const WS_EVENTS = {
  AUTH: "auth",
  AUTH_SUCCESS: "auth success",
  CONSOLE_OUTPUT: "console output",
  INSTALL_OUTPUT: "install output",
  STATUS: "status",
  STATS: "stats",
  TOKEN_EXPIRING: "token expiring",
  TOKEN_EXPIRED: "token expired",
  JWT_ERROR: "jwt error",
  DAEMON_ERROR: "daemon error",
} as const;

const MAX_RECONNECT_ATTEMPTS = 10;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

/**
 * WebSocket hook for Pterodactyl console streaming.
 * Connects, authenticates, streams output, auto-reconnects.
 */
export function useConsoleWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const isIntentionalCloseRef = useRef(false);

  const appendOutput = useConsoleStore((s) => s.appendOutput);
  const setConnectionStatus = useConsoleStore((s) => s.setConnectionStatus);
  const serverId = useAppStore((s) => s.server.serverId);
  const updateResources = useAppStore((s) => s.updateResources);
  const setPowerState = useAppStore((s) => s.setPowerState);

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

  const getBackoffDelay = useCallback((): number => {
    return Math.min(
      BACKOFF_BASE_MS * Math.pow(2, reconnectAttemptsRef.current),
      BACKOFF_MAX_MS,
    );
  }, []);

  const connect = useCallback(async () => {
    if (!isMountedRef.current || !serverId) return;

    cleanup();
    isIntentionalCloseRef.current = false;
    setConnectionStatus("connecting");

    try {
      const res = await fetch(`/api/server/websocket`);
      if (!res.ok) {
        throw new Error(`Failed to get WebSocket credentials (${res.status})`);
      }

      const { data } = await res.json();
      const { token, socket: socketUrl } = data;

      if (!isMountedRef.current) return;

      const ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        ws.send(JSON.stringify({ event: WS_EVENTS.AUTH, args: [token] }));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const message = JSON.parse(event.data);

          switch (message.event) {
            case WS_EVENTS.AUTH_SUCCESS:
              setConnectionStatus("connected");
              reconnectAttemptsRef.current = 0;
              appendOutput(
                "\x1b[32m[DevPilotX]\x1b[0m Connected to console",
              );
              break;

            case WS_EVENTS.CONSOLE_OUTPUT:
              if (message.args?.[0]) {
                appendOutput(message.args[0]);
              }
              break;

            case WS_EVENTS.INSTALL_OUTPUT:
              if (message.args?.[0]) {
                appendOutput(
                  `\x1b[33m[Install]\x1b[0m ${message.args[0]}`,
                );
              }
              break;

            case WS_EVENTS.STATUS:
              if (message.args?.[0]) {
                setPowerState(message.args[0]);
              }
              break;

            case WS_EVENTS.STATS:
              if (message.args?.[0]) {
                try {
                  const stats = JSON.parse(
                    message.args[0],
                  ) as WebSocketStats;
                  updateResources(stats);
                  if (stats.state) {
                    setPowerState(stats.state);
                  }
                } catch {
                  /* Ignore malformed stats */
                }
              }
              break;

            case WS_EVENTS.TOKEN_EXPIRING:
              void refreshToken();
              break;

            case WS_EVENTS.TOKEN_EXPIRED:
            case WS_EVENTS.JWT_ERROR:
              appendOutput(
                "\x1b[31m[DevPilotX]\x1b[0m Token expired, reconnecting...",
              );
              void connect();
              break;

            case WS_EVENTS.DAEMON_ERROR:
              if (message.args?.[0]) {
                appendOutput(
                  `\x1b[1;31m[Daemon Error] ${message.args[0]}\x1b[0m`,
                );
              }
              break;
          }
        } catch {
          /* Ignore unparseable messages */
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        appendOutput(
          "\x1b[1;31m[DevPilotX]\x1b[0m WebSocket error occurred.",
        );
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;

        if (isIntentionalCloseRef.current) {
          setConnectionStatus("disconnected");
          return;
        }

        setConnectionStatus("reconnecting");
        scheduleReconnect();
      };
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("[Console WS] Connection failed:", err);
      setConnectionStatus("reconnecting");
      scheduleReconnect();
    }
  }, [
    serverId,
    cleanup,
    appendOutput,
    setConnectionStatus,
    updateResources,
    setPowerState,
  ]);

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/server/websocket`);
      if (!res.ok) return;
      const { data } = await res.json();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ event: WS_EVENTS.AUTH, args: [data.token] }),
        );
      }
    } catch {
      /* If refresh fails, onclose will trigger reconnect */
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      appendOutput(
        "\x1b[31m[DevPilotX]\x1b[0m Max reconnect attempts reached. Refresh the page.",
      );
      setConnectionStatus("disconnected");
      return;
    }

    const delay = getBackoffDelay();
    reconnectAttemptsRef.current++;

    appendOutput(
      `\x1b[33m[DevPilotX]\x1b[0m Reconnecting in ${(delay / 1000).toFixed(0)}s... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`,
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      void connect();
    }, delay);
  }, [connect, appendOutput, setConnectionStatus, getBackoffDelay]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionStatus("disconnected");
  }, [cleanup, setConnectionStatus]);

  const sendCommand = useCallback(
    (command: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ event: "send command", args: [command] }),
        );
        appendOutput(`\x1b[36m> ${command}\x1b[0m`);
      }
    },
    [appendOutput],
  );

  useEffect(() => {
    isMountedRef.current = true;
    void connect();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);

  return { sendCommand, disconnect, reconnect: connect };
}