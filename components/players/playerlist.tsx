"use client";

import { useState } from "react";
import { type MinecraftPlayer } from "@/types/minecraft";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Search, Crown, MoreHorizontal, UserX,
  MessageSquare, Ban, Eye,
} from "lucide-react";

interface PlayerListProps {
  players: MinecraftPlayer[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectPlayer: (p: MinecraftPlayer) => void;
  onKick: (p: MinecraftPlayer) => void;
  onBan: (p: MinecraftPlayer) => void;
  onMessage: (p: MinecraftPlayer) => void;
  isOnline: boolean;
}

export function PlayerList({
  players, searchQuery, onSearchChange,
  onSelectPlayer, onKick, onBan, onMessage, isOnline,
}: PlayerListProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  if (!isOnline) {
    return (
      <EmptyState
        icon={<UserX className="h-10 w-10" />}
        title="Server Offline"
        description="Start the server to see online players."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search players..."
          className={cn(
            "w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4",
            "text-sm text-text-primary placeholder:text-text-tertiary",
            "focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30",
          )}
        />
      </div>

      <p className="text-xs text-text-tertiary">
        {players.length} player{players.length !== 1 ? "s" : ""} online
      </p>

      {players.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={searchQuery ? "No matching players" : "No Players Online"}
          description={searchQuery ? "Try a different search." : "Waiting for players…"}
        />
      ) : (
        <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-\[10px\] font-semibold uppercase tracking-wider text-text-tertiary">
            <div className="col-span-5">Player</div>
            <div className="col-span-2 hidden sm:block">Ping</div>
            <div className="col-span-3 hidden md:block">World</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {players.map((player) => {
            const avatarUrl = player.uuid
              ? `https://crafatar.com/avatars/${player.uuid}?size=32&overlay`
              : null;
            const pingColor =
              player.ping < 50 ? "text-accent-green"
              : player.ping < 100 ? "text-accent-blue"
              : player.ping < 200 ? "text-accent-orange"
              : "text-accent-red";

            return (
              <div
                key={player.uuid ?? player.name}
                className="grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-overlay transition-colors cursor-pointer group"
                onClick={() => onSelectPlayer(player)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                {/* Player cell */}
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={player.name} width={32} height={32} className="rounded-md" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-overlay text-xs font-bold text-text-secondary">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-elevated bg-accent-green" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-text-primary truncate">{player.name}</span>
                      {player.isOp && <Crown className="h-3 w-3 text-accent-orange flex-shrink-0" />}
                    </div>
                    {player.uuid && (
                      <span className="text-\[10px\] font-mono text-text-tertiary truncate block">
                        {player.uuid.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </div>

                {/* Ping */}
                <div className="col-span-2 hidden sm:block">
                  <span className={cn("text-xs font-medium", pingColor)}>{player.ping}ms</span>
                </div>

                {/* World */}
                <div className="col-span-3 hidden md:block">
                  <span className="text-xs text-text-tertiary truncate">{player.world ?? "Unknown"}</span>
                </div>

                {/* Actions menu */}
                <div className="col-span-2 flex justify-end relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === player.name ? null : player.name); }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-overlay hover:text-text-secondary transition-all"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {activeMenu === player.name && (
                    <div className="absolute right-0 top-8 z-20 min-w-40 rounded-lg border border-border-subtle bg-elevated p-1 shadow-card">
                      <DropItem icon={<Eye className="h-3.5 w-3.5" />} label="View Details" onClick={() => { onSelectPlayer(player); setActiveMenu(null); }} />
                      <DropItem icon={<MessageSquare className="h-3.5 w-3.5" />} label="Message" onClick={() => { onMessage(player); setActiveMenu(null); }} />
                      <div className="my-1 h-px bg-border-subtle" />
                      <DropItem icon={<UserX className="h-3.5 w-3.5" />} label="Kick" danger onClick={() => { onKick(player); setActiveMenu(null); }} />
                      <DropItem icon={<Ban className="h-3.5 w-3.5" />} label="Ban" danger onClick={() => { onBan(player); setActiveMenu(null); }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DropItem({ icon, label, danger, onClick }: {
  icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs transition-colors",
        danger ? "text-accent-red hover:bg-accent-red/10" : "text-text-secondary hover:bg-overlay hover:text-text-primary",
      )}
    >
      {icon}{label}
    </button>
  );
}