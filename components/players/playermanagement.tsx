"use client";

import { useState, useEffect } from "react";
import { type PlayerAction } from "@/hooks/usePlayers";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";
import {
  Shield, Ban, UserPlus, UserMinus,
  Search, RefreshCw, Megaphone, X,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "whitelist" | "banned";

interface Props {
  whitelistedPlayers: string[];
  bannedPlayers: string[];
  isOnline: boolean;
  isExecuting: boolean;
  onAction: (a: PlayerAction) => void;
  onLoadWhitelist: () => void;
  onLoadBanList: () => void;
  onBroadcast: (msg: string) => void;
}

export function PlayerManagement({
  whitelistedPlayers, bannedPlayers, isOnline, isExecuting,
  onAction, onLoadWhitelist, onLoadBanList, onBroadcast,
}: Props) {
  const [tab, setTab] = useState<Tab>("whitelist");
  const [addName, setAddName] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOnline) { onLoadWhitelist(); onLoadBanList(); }
  }, [isOnline]);

  const list = tab === "whitelist" ? whitelistedPlayers : bannedPlayers;
  const filtered = list.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = () => {
    if (!addName.trim()) return;
    onAction({
      type: tab === "whitelist" ? "whitelist-add" : "ban",
      player: addName.trim(),
    });
    setAddName("");
  };

  const handleRemove = (name: string) => {
    onAction({
      type: tab === "whitelist" ? "whitelist-remove" : "pardon",
      player: name,
    });
  };

  return (
    <div className="space-y-4">
      {/* Broadcast bar */}
      <div className="dpx-card p-4">
        <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Broadcast Message</label>
        <div className="flex gap-2 mt-2">
          <input
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && broadcastMsg.trim()) {
                onBroadcast(broadcastMsg);
                setBroadcastMsg("");
              }
            }}
            placeholder="Type a message to all players…"
            className={cn(
              "flex-1 rounded-lg border border-border-subtle bg-surface px-3 py-2",
              "text-sm text-text-primary placeholder:text-text-tertiary",
              "focus:border-accent-blue focus:outline-none",
            )}
          />
          <Button variant="primary" size="sm" disabled={!broadcastMsg.trim() || !isOnline}
            leftIcon={<Megaphone className="h-4 w-4" />}
            onClick={() => { onBroadcast(broadcastMsg); setBroadcastMsg(""); }}>
            Send
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-overlay p-1">
        {(["whitelist", "banned"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); }}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-elevated text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary",
            )}
          >
            {t === "whitelist" ? (
              <span className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />Whitelist
                <Badge variant="default">{whitelistedPlayers.length}</Badge>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Ban className="h-4 w-4" />Banned
                <Badge variant="danger">{bannedPlayers.length}</Badge>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Add player + search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-2 flex-1">
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder={tab === "whitelist" ? "Add to whitelist…" : "Ban a player…"}
            className={cn(
              "flex-1 rounded-lg border border-border-subtle bg-surface px-3 py-2",
              "text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none",
            )}
          />
          <Button variant={tab === "whitelist" ? "primary" : "danger"} size="sm" disabled={!addName.trim() || isExecuting}
            leftIcon={<UserPlus className="h-4 w-4" />} onClick={handleAdd}>
            Add
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter…"
            className="rounded-lg border border-border-subtle bg-surface py-2 pl-9 pr-3 text-sm text-text-primary w-full sm:w-48 focus:outline-none" />
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => { onLoadWhitelist(); onLoadBanList(); }}>Refresh</Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={tab === "whitelist" ? <Shield className="h-8 w-8" /> : <Ban className="h-8 w-8" />}
          title={search ? "No matches" : tab === "whitelist" ? "Whitelist is empty" : "No banned players"}
          description={tab === "whitelist" ? "Add players to restrict server access." : "No players have been banned."}
        />
      ) : (
        <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
          {filtered.map((name) => (
            <div key={name} className="flex items-center justify-between px-4 py-3 hover:bg-overlay transition-colors group">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-overlay text-xs font-bold text-text-secondary">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-text-primary">{name}</span>
              </div>
              <button
                onClick={() => handleRemove(name)}
                disabled={isExecuting}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors opacity-0 group-hover:opacity-100",
                  tab === "whitelist"
                    ? "text-accent-orange hover:bg-accent-orange/10"
                    : "text-accent-green hover:bg-accent-green/10",
                )}
              >
                {tab === "whitelist" ? <UserMinus className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {tab === "whitelist" ? "Remove" : "Unban"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}