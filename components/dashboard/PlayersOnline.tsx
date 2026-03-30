"use client";

import { Card } from "@/components/ui/Card";
import { Users } from "lucide-react";

interface Player {
  name: string;
  uuid: string;
}

interface PlayersOnlineProps {
  players?: Player[];
  max?: number;
  className?: string;
}

export function PlayersOnline({ players = [], max = 20, className }: PlayersOnlineProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Players Online
        </h3>
        <span className="text-sm font-bold text-emerald-400">
          {players.length}/{max}
        </span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {players.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No players online</p>
        ) : (
          players.map((player) => (
            <div
              key={player.uuid}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-colors"
            >
              <img
                src={`https://mc-heads.net/avatar/${player.uuid}/24`}
                alt={player.name}
                className="w-6 h-6 rounded"
              />
              <span className="text-sm text-gray-300">{player.name}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}