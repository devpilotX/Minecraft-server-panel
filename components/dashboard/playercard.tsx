"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { type MinecraftPlayer } from "@/types/minecraft";
import { Crown, Shield, MoreHorizontal, UserX, MessageSquare } from "lucide-react";

interface PlayerCardProps {
  player: MinecraftPlayer;
  onKick?: (player: MinecraftPlayer) => void;
  onMessage?: (player: MinecraftPlayer) => void;
}

/**
 * Individual player card with Crafatar avatar, ping indicator, and actions.
 */
export function PlayerCard({ player, onKick, onMessage }: PlayerCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Crafatar avatar URL (8px face, scaled up)
  const avatarUrl = player.uuid
    ? `https://crafatar.com/avatars/${player.uuid}?size=64&overlay`
    : null;

  // Ping quality indicator
  const pingQuality =
    player.ping < 50
      ? { label: "Excellent", color: "text-accent-green" }
      : player.ping < 100
        ? { label: "Good", color: "text-accent-blue" }
        : player.ping < 200
          ? { label: "Fair", color: "text-accent-orange" }
          : { label: "Poor", color: "text-accent-red" };

  return (
    <div
      className={cn(
        "dpx-card group relative flex items-center gap-3 p-3",
        "hover:border-border-default transition-colors",
      )}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={player.name}
            width={40}
            height={40}
            className="rounded-lg"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-overlay text-sm font-bold text-text-secondary">
            {player.name.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Online dot */}
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-elevated bg-accent-green" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">
            {player.name}
          </span>
          {player.isOp && (
            <Crown className="h-3.5 w-3.5 text-accent-orange flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-xs", pingQuality.color)}>
            {player.ping}ms
          </span>
          {player.world && (
            <span className="text-xs text-text-tertiary truncate">
              {player.world}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowActions(!showActions)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-overlay hover:text-text-secondary transition-all"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {showActions && (
          <div className="absolute right-0 top-8 z-10 min-w-36 rounded-lg border border-border-subtle bg-elevated p-1 shadow-card">
            {onMessage && (
              <button
                onClick={() => {
                  onMessage(player);
                  setShowActions(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-text-secondary hover:bg-overlay hover:text-text-primary transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Message
              </button>
            )}
            {onKick && (
              <button
                onClick={() => {
                  onKick(player);
                  setShowActions(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-accent-red hover:bg-accent-red/10 transition-colors"
              >
                <UserX className="h-3.5 w-3.5" />
                Kick Player
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}