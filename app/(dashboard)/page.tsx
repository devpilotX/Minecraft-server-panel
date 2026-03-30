"use client";

import { ServerStatusBar } from "@/components/layout/ServerStatusBar";
import { ResourceGrid } from "@/components/dashboard/ResourceGrid";
import { PlayersOnline } from "@/components/dashboard/PlayersOnline";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useAppStore } from "@/lib/store/useAppStore";
import { useServerResources } from "@/hooks/useServerResources";
import { formatUptime } from "@/lib/utils/formatters";
import { Activity, Clock, Wifi } from "lucide-react";

/**
 * Dashboard home page.
 * Displays: server status bar, resource meters, quick actions,
 * online players, and server info cards.
 */
export default function DashboardPage() {
  useServerResources(); // keep resources live

  const uptimeMs = useAppStore((s) => s.resources.uptimeMs);
  const serverStatus = useAppStore((s) => s.server.serverStatus);
  const networkRx = useAppStore((s) => s.resources.networkRxBytes);
  const networkTx = useAppStore((s) => s.resources.networkTxBytes);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Server overview and quick actions
        </p>
      </div>

      {/* Server status bar with power controls */}
      <ServerStatusBar />

      {/* Resource meters: CPU, RAM, Disk, Players */}
      <ResourceGrid />

      {/* Quick actions row */}
      <QuickActions />

      {/* Bottom section: Players + Server Info side by side */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Players — takes 3 cols */}
        <div className="lg:col-span-3">
          <PlayersOnline />
        </div>

        {/* Server info — takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Uptime card */}
          <div className="dpx-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm font-medium text-text-secondary">
                Uptime
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {serverStatus === "offline" ? "Offline" : formatUptime(uptimeMs)}
            </p>
          </div>

          {/* Network card */}
          <div className="dpx-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Wifi className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm font-medium text-text-secondary">
                Network I/O
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-tertiary mb-1">Inbound</p>
                <p className="text-lg font-semibold text-accent-green">
                  {formatNetworkBytes(networkRx)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Outbound</p>
                <p className="text-lg font-semibold text-accent-blue">
                  {formatNetworkBytes(networkTx)}
                </p>
              </div>
            </div>
          </div>

          {/* Server details card */}
          <div className="dpx-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm font-medium text-text-secondary">
                Server Details
              </span>
            </div>
            <div className="space-y-2">
              <InfoRow label="Address" value="play.devpilotx.com:25565" />
              <InfoRow label="Version" value="Paper 1.21.4" />
              <InfoRow label="Node" value="node.devpilotx.com" />
              <InfoRow label="Server ID" value="c9f907a8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== HELPERS ========== */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-xs font-medium text-text-primary font-mono">
        {value}
      </span>
    </div>
  );
}

function formatNetworkBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}