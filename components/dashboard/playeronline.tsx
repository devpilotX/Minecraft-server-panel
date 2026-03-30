"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { useServerPlayers } from "@/hooks/useServerPlayers";
import { PlayerCard } from "./PlayerCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { type MinecraftPlayer } from "@/types/minecraft";
import { Users, UserX } from "lucide-react";
import { toast } from "sonner";

/**
 * Online players section. Shows player list with count badge.
 * Uses RCON for kick/message actions.
 */
export function PlayersOnline() {
  const { isLoading } = useServerPlayers();
  const players = useAppStore((s) => s.players.online);
  const serverStatus = useAppStore((s) => s.server.serverStatus);
  const isOffline = serverStatus === "offline";

  const handleKick = async (player: MinecraftPlayer) => {
    try {
      const res = await fetch("/api/rcon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: `kick ${player.name} Kicked by admin` }),
      });
      if (res.ok) {
        toast.success(`Kicked ${player.name}`);
      } else {
        toast.error(`Failed to kick ${player.name}`);
      }
    } catch {
      toast.error("RCON connection failed");
    }
  };

  const handleMessage = async (player: MinecraftPlayer) => {
    const message = prompt(`Send message to ${player.name}:`);
    if (!message) return;

    try {
      const res = await fetch("/api/rcon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: `msg ${player.name} ${message}` }),
      });
      if (res.ok) {
        toast.success(`Message sent to ${player.name}`);
      } else {
        toast.error("Failed to send message");
      }
    } catch {
      toast.error("RCON connection failed");
    }
  };

  return (
    <div className="dpx-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-text-secondary" />
          <h3 className="text-base font-semibold text-text-primary">
            Online Players
          </h3>
          <Badge variant={players.length > 0 ? "success" : "default"}>
            {players.length}
          </Badge>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isOffline ? (
        <EmptyState
          icon={<UserX className="h-8 w-8" />}
          title="Server Offline"
          description="Start the server to see online players."
        />
      ) : players.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No Players Online"
          description="Waiting for players to join..."
        />
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
          {players.map((player) => (
            <PlayerCard
              key={player.uuid ?? player.name}
              player={player}
              onKick={handleKick}
              onMessage={handleMessage}
            />
          ))}
        </div>
      )}
    </div>
  );
}