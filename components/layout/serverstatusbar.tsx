"use client";

import { useServerStatus } from "@/hooks/useServerStatus";
import { useAppStore } from "@/lib/store/useAppStore";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatUptime } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { Play, RotateCcw, Square, Skull } from "lucide-react";
import { type PowerSignal } from "@/types/pterodactyl";

/**
 * Compact server status bar with power controls.
 * Used in the dashboard and console pages.
 */
export function ServerStatusBar() {
  const { status, sendPower, isPowerActionPending, activePowerSignal } =
    useServerStatus();
  const serverName = useAppStore((s) => s.server.serverName);
  const uptimeMs = useAppStore((s) => s.resources.uptimeMs);

  const isOnline = status === "online";
  const isOffline = status === "offline";
  const isTransitioning = status === "starting" || status === "stopping";

  const powerButtons: Array<{
    signal: PowerSignal;
    label: string;
    icon: React.ReactNode;
    variant: "success" | "warning" | "danger";
    disabled: boolean;
  }> = [
    {
      signal: "start",
      label: "Start",
      icon: <Play className="h-3.5 w-3.5" />,
      variant: "success",
      disabled: isOnline || status === "starting",
    },
    {
      signal: "restart",
      label: "Restart",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      variant: "warning",
      disabled: isOffline,
    },
    {
      signal: "stop",
      label: "Stop",
      icon: <Square className="h-3.5 w-3.5" />,
      variant: "danger",
      disabled: isOffline || status === "stopping",
    },
    {
      signal: "kill",
      label: "Force Stop",
      icon: <Skull className="h-3.5 w-3.5" />,
      variant: "danger",
      disabled: isOffline,
    },
  ];

  return (
    <div className="dpx-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: server info */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {serverName}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={status} />
              {isOnline && uptimeMs > 0 && (
                <span className="text-xs text-text-tertiary">
                  Online for {formatUptime(uptimeMs)}
                </span>
              )}
              {isOffline && (
                <span className="text-xs text-text-tertiary">
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: power controls */}
        <div className="flex items-center gap-2">
          {powerButtons.map((btn) => (
            <Button
              key={btn.signal}
              variant={btn.variant}
              size="sm"
              disabled={btn.disabled || isPowerActionPending}
              onClick={() => sendPower(btn.signal)}
              leftIcon={
                isPowerActionPending && activePowerSignal === btn.signal ? (
                  <Spinner size="sm" />
                ) : (
                  btn.icon
                )
              }
              className={cn(
                "min-w-0",
                btn.signal === "kill" && "hidden sm:inline-flex",
              )}
            >
              <span className="hidden sm:inline">{btn.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}