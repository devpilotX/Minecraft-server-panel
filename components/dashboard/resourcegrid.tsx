"use client";

import { useServerResources } from "@/hooks/useServerResources";
import { useAppStore } from "@/lib/store/useAppStore";
import { ResourceMeter } from "./ResourceMeter";
import { formatBytes, formatPercentage } from "@/lib/utils/formatters";
import { Cpu, MemoryStick, HardDrive, Users } from "lucide-react";

/**
 * Grid of 4 resource meters: CPU, RAM, Disk, Players.
 * Pulls live data from WebSocket via useServerResources.
 */
export function ResourceGrid() {
  useServerResources(); // keeps store updated

  const resources = useAppStore((s) => s.resources);
  const limits = useAppStore((s) => s.server.limits);
  const players = useAppStore((s) => s.players);

  const cpuPercent = resources.cpuPercent;
  const memoryPercent =
    limits.memoryMb > 0
      ? (resources.memoryBytes / (limits.memoryMb * 1024 * 1024)) * 100
      : 0;
  const diskPercent =
    limits.diskMb > 0
      ? (resources.diskBytes / (limits.diskMb * 1024 * 1024)) * 100
      : 0;
  const playerPercent =
    limits.maxPlayers > 0
      ? (players.online.length / limits.maxPlayers) * 100
      : 0;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <ResourceMeter
        label="CPU"
        value={cpuPercent}
        current={`${cpuPercent.toFixed(1)}%`}
        max={`${limits.cpuPercent}%`}
        icon={<Cpu className="h-4 w-4" />}
        color="blue"
      />

      <ResourceMeter
        label="Memory"
        value={memoryPercent}
        current={formatBytes(resources.memoryBytes)}
        max={`${limits.memoryMb >= 1024 ? `${(limits.memoryMb / 1024).toFixed(1)} GB` : `${limits.memoryMb} MB`}`}
        icon={<MemoryStick className="h-4 w-4" />}
        color="purple"
      />

      <ResourceMeter
        label="Disk"
        value={diskPercent}
        current={formatBytes(resources.diskBytes)}
        max={`${limits.diskMb >= 1024 ? `${(limits.diskMb / 1024).toFixed(1)} GB` : `${limits.diskMb} MB`}`}
        icon={<HardDrive className="h-4 w-4" />}
        color="green"
      />

      <ResourceMeter
        label="Players"
        value={playerPercent}
        current={`${players.online.length}`}
        max={`${limits.maxPlayers}`}
        icon={<Users className="h-4 w-4" />}
        color="orange"
      />
    </div>
  );
}