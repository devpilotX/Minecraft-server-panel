"use client";

import { useState, useEffect } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { type MinecraftPlayer } from "@/types/minecraft";
import { PlayerList } from "@/components/players/PlayerList";
import { PlayerDetailModal } from "@/components/players/PlayerDetailModal";
import { PlayerManagement } from "@/components/players/PlayerManagement";
import { Users, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type View = "online" | "manage";

export default function PlayersPage() {
  const {
    filteredPlayers, whitelistedPlayers, bannedPlayers,
    searchQuery, setSearchQuery, isOnline, isExecuting,
    executeAction, loadWhitelist, loadBanList, broadcast,
  } = usePlayers();

  const [view, setView] = useState<View>("online");
  const [selectedPlayer, setSelectedPlayer] = useState<MinecraftPlayer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (isOnline) { loadWhitelist(); loadBanList(); }
  }, [isOnline]);

  const openDetail = (p: MinecraftPlayer) => { setSelectedPlayer(p); setModalOpen(true); };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Players</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Manage online players, whitelist, and bans
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-lg bg-overlay p-1">
          {(["online", "manage"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                view === v
                  ? "bg-elevated text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              {v === "online" ? <Users className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
              {v === "online" ? "Online" : "Manage"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === "online" ? (
        <PlayerList
          players={filteredPlayers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectPlayer={openDetail}
          onKick={(p) => executeAction({ type: "kick", player: p.name })}
          onBan={(p) => executeAction({ type: "ban", player: p.name })}
          onMessage={(p) => openDetail(p)}
          isOnline={isOnline}
        />
      ) : (
        <PlayerManagement
          whitelistedPlayers={whitelistedPlayers}
          bannedPlayers={bannedPlayers}
          isOnline={isOnline}
          isExecuting={isExecuting}
          onAction={executeAction}
          onLoadWhitelist={loadWhitelist}
          onLoadBanList={loadBanList}
          onBroadcast={broadcast}
        />
      )}

      {/* Detail modal */}
      <PlayerDetailModal
        player={selectedPlayer}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={executeAction}
        isExecuting={isExecuting}
        isWhitelisted={
          selectedPlayer
            ? whitelistedPlayers.includes(selectedPlayer.name)
            : false
        }
      />
    </div>
  );
}