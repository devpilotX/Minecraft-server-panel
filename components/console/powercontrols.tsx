"use client";

import { useServerStatus } from "@/hooks/useServerStatus";
import { useAppStore } from "@/lib/store/useAppStore";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatUptime } from "@/lib/utils/formatters";
import { Play, RotateCcw, Square, Skull } from "lucide-react";
import { type PowerSignal } from "@/types/pterodactyl";

/**
 * Compact power controls bar for the console page.
 * Horizontal layout with status + uptime + power buttons.
 */
export function PowerControls() {
  const { status, sendPower, isPowerActionPending, activePowerSignal } =
    useServerStatus();
  const uptimeMs = useAppStore((s) => s.resources.uptimeMs);

  const isOnline = status === "online";
  const isOffline = status === "offline";

  const buttons: Array<{
    signal: PowerSignal;
    icon: React.ReactNode;
    label: string;
    variant: "success" | "warning" | "danger";
    disabled: boolean;
  }> = [
    {
      signal: "start",
      icon: <Play className="h-3.5 w-3.5" />,
      label: "Start",
      variant: "success",
      disabled: isOnline || status === "starting",
    },
    {
      signal: "restart",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      label: "Restart",
      variant: "warning",
      disabled: isOffline,
    },
    {
      signal: "stop",
      icon: <Square className="h-3.5 w-3.5" />,
      label: "Stop",
      variant: "danger",
      disabled: isOffline || status === "stopping",
    },
    {
      signal: "kill",
      icon: <Skull className="h-3.5 w-3.5" />,
      label: "Kill",
      variant: "danger",
      disabled: isOffline,
    },
  ];

  return (
    <div className="dpx-card p-3 flex items-center justify-between">
      {/* Left: status info */}
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        {isOnline && uptimeMs > 0 && (
          <span className="text-xs text-text-tertiary">
            {formatUptime(uptimeMs)}
          </span>
        )}
      </div>

      {/* Right: power buttons */}
      <div className="flex items-center gap-1.5">
        {buttons.map((btn) => (
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
          >
            <span className="hidden sm:inline text-xs">{btn.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}