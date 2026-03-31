"use client";

import { useEffect, useRef, useCallback } from "react";
import { useConsoleStore } from "@/lib/store/useConsoleStore";
import { useAppStore } from "@/lib/store/useAppStore";

const WS_EVENTS = {
  AUTH: "auth",
  CONSOLE_OUTPUT: "console output",
  INSTALL_OUTPUT: "install output",
  STATUS: "status",
  STATS: "stats",
  TOKEN_EXPIRING: "token expiring",
  TOKEN_EXPIRED: "token expired",
} as const;

/**
 * WebSocket hook for Pterodactyl console streaming.
 * Connects to the panel's WebSocket, authenticates, and streams console output.
 * Auto-reconnects on disconnect with exponential backoff.
 */
export function useConsoleWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const addLine = useConsoleStore((s) => s.addLine);
  const setConnected = useConsoleStore((s) => s.setConnected);
  const serverId = useAppStore((s) => s.server.serverId);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Get WebSocket credentials from our API proxy
      const res = await fetch(`/api/pterodactyl/servers/${serverId}/websocket`);
      if (!res.ok) {
        console.error("[Console WS] Failed to get WebSocket credentials");
        scheduleReconnect();
        return;
      }

      const { data } = await res.json();
      const { token, socket: socketUrl } = data;

      const ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Authenticate immediately
        ws.send(JSON.stringify({
          event: WS_EVENTS.AUTH,
          args: [token],
        }));
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        addLine({
          text: "\x1b[32m[DevPilotX]\x1b[0m Connected to console",
          timestamp: new Date().toISOString(),
          type: "system",
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.event) {
            case WS_EVENTS.CONSOLE_OUTPUT:
              if (message.args?.[0]) {
                const text = message.args[0];
                const type = detectLogLevel(text);
                addLine({
                  text,
                  timestamp: new Date().toISOString(),
                  type,
                });
              }
              break;

            case WS_EVENTS.INSTALL_OUTPUT:
              if (message.args?.[0]) {
                addLine({
                  text: `\x1b[33m[Install]\x1b[0m ${message.args[0]}`,
                  timestamp: new Date().toISOString(),
                  type: "system",
                });
              }
              break;

            case WS_EVENTS.STATUS:
              if (message.args?.[0]) {
                useAppStore.getState().setServerStatus(message.args[0]);
              }
              break;

            case WS_EVENTS.STATS:
  if (message.args?.[0]) {
    try {
      const stats = JSON.parse(message.args[0]);
      useAppStore.getState().updateResources({
        cpu_absolute: stats.cpu_absolute ?? 0,
        memory_bytes: stats.memory_bytes ?? 0,
        memory_limit_bytes: stats.memory_limit_bytes ?? 0,
        disk_bytes: stats.disk_bytes ?? 0,
        network: {
          rx_bytes: stats.network?.rx_bytes ?? 0,
          tx_bytes: stats.network?.tx_bytes ?? 0,
        },
        uptime: stats.uptime ?? 0,
      });
    } catch {}
  }
  break;
          

            case WS_EVENTS.TOKEN_EXPIRING:
              // Re-authenticate before token expires
              refreshToken();
              break;

            case WS_EVENTS.TOKEN_EXPIRED:
              addLine({
                text: "\x1b[31m[DevPilotX]\x1b[0m Token expired, reconnecting...",
                timestamp: new Date().toISOString(),
                type: "system",
              });
              disconnect();
              connect();
              break;
          }
        } catch (err) {
          console.error("[Console WS] Parse error:", err);
        }
      };

      ws.onerror = () => {
        console.error("[Console WS] Connection error");
      };

      ws.onclose = () => {
        setConnected(false);
        addLine({
          text: "\x1b[31m[DevPilotX]\x1b[0m Disconnected from console",
          timestamp: new Date().toISOString(),
          type: "system",
        });
        scheduleReconnect();
      };
    } catch (err) {
      console.error("[Console WS] Connection failed:", err);
      scheduleReconnect();
    }
  }, [serverId, addLine, setConnected]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, [setConnected]);

  const sendCommand = useCallback((command: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: "send command",
        args: [command],
      }));
      addLine({
        text: `\x1b[36m> ${command}\x1b[0m`,
        timestamp: new Date().toISOString(),
        type: "command",
      });
    }
  }, [addLine]);

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/pterodactyl/servers/${serverId}/websocket`);
      if (!res.ok) return;
      const { data } = await res.json();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          event: WS_EVENTS.AUTH,
          args: [data.token],
        }));
      }
    } catch {}
  }, [serverId]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      addLine({
        text: "\x1b[31m[DevPilotX]\x1b[0m Max reconnect attempts reached. Refresh the page.",
        timestamp: new Date().toISOString(),
        type: "system",
      });
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    reconnectAttemptsRef.current++;

    addLine({
      text: `\x1b[33m[DevPilotX]\x1b[0m Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
      timestamp: new Date().toISOString(),
      type: "system",
    });

    reconnectTimeoutRef.current = setTimeout(connect, delay);
  }, [connect, addLine]);

  // Auto-connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { sendCommand, disconnect, reconnect: connect };
}

/* ========== HELPERS ========== */

function detectLogLevel(
  text: string,
): "info" | "warn" | "error" | "system" | "command" {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, "").toLowerCase();
  if (stripped.includes("[warn") || stripped.includes("warning")) return "warn";
  if (
    stripped.includes("[error") ||
    stripped.includes("[severe") ||
    stripped.includes("exception") ||
    stripped.includes("caused by")
  ) return "error";
  return "info";
}