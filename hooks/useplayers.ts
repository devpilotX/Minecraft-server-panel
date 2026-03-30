"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { type MinecraftPlayer } from "@/types/minecraft";
import { toast } from "sonner";

export interface PlayerAction {
  type:
    | "kick"
    | "ban"
    | "pardon"
    | "op"
    | "deop"
    | "whitelist-add"
    | "whitelist-remove"
    | "msg";
  player: string;
  reason?: string;
  message?: string;
}

export function usePlayers() {
  const onlinePlayers = useAppStore((s) => s.players.online);
  const serverStatus = useAppStore((s) => s.server.serverStatus);
  const [isExecuting, setIsExecuting] = useState(false);
  const [whitelistedPlayers, setWhitelistedPlayers] = useState<string[]>([]);
  const [bannedPlayers, setBannedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const isOnline = serverStatus === "online";

  const executeRcon = useCallback(async (command: string): Promise<string> => {
    const res = await fetch("/api/rcon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    if (!res.ok) throw new Error(`RCON failed (${res.status})`);
    const data = await res.json();
    return data.response ?? data.message ?? "";
  }, []);

  const executeAction = useCallback(
    async (action: PlayerAction) => {
      if (!isOnline) {
        toast.error("Server is offline");
        return;
      }
      setIsExecuting(true);
      try {
        let command: string;
        let successMsg: string;
        switch (action.type) {
          case "kick":
            command = `kick ${action.player} ${action.reason ?? "Kicked by admin"}`;
            successMsg = `Kicked ${action.player}`;
            break;
          case "ban":
            command = `ban ${action.player} ${action.reason ?? "Banned by admin"}`;
            successMsg = `Banned ${action.player}`;
            break;
          case "pardon":
            command = `pardon ${action.player}`;
            successMsg = `Unbanned ${action.player}`;
            break;
          case "op":
            command = `op ${action.player}`;
            successMsg = `Gave operator to ${action.player}`;
            break;
          case "deop":
            command = `deop ${action.player}`;
            successMsg = `Removed operator from ${action.player}`;
            break;
          case "whitelist-add":
            command = `whitelist add ${action.player}`;
            successMsg = `Whitelisted ${action.player}`;
            break;
          case "whitelist-remove":
            command = `whitelist remove ${action.player}`;
            successMsg = `Removed ${action.player} from whitelist`;
            break;
          case "msg":
            command = `msg ${action.player} ${action.message ?? ""}`;
            successMsg = `Message sent to ${action.player}`;
            break;
          default:
            throw new Error(`Unknown action: ${action.type}`);
        }
        await executeRcon(command);
        toast.success(successMsg);
        if (action.type === "whitelist-add" || action.type === "whitelist-remove") {
          await loadWhitelist();
        }
        if (action.type === "ban" || action.type === "pardon") {
          await loadBanList();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      } finally {
        setIsExecuting(false);
      }
    },
    [isOnline, executeRcon],
  );

  const loadWhitelist = useCallback(async () => {
    try {
      const response = await executeRcon("whitelist list");
      const match = response.match(/:\s*(.+)$/);
      setWhitelistedPlayers(
        match ? match[1].split(",").map((p) => p.trim()).filter(Boolean) : [],
      );
    } catch {
      setWhitelistedPlayers([]);
    }
  }, [executeRcon]);

  const loadBanList = useCallback(async () => {
    try {
      const response = await executeRcon("banlist players");
      const match = response.match(/:\s*(.+)$/);
      setBannedPlayers(
        match ? match[1].split(",").map((p) => p.trim()).filter(Boolean) : [],
      );
    } catch {
      setBannedPlayers([]);
    }
  }, [executeRcon]);

  const broadcast = useCallback(
    async (message: string) => {
      if (!isOnline) { toast.error("Server is offline"); return; }
      try {
        await executeRcon(`say ${message}`);
        toast.success("Broadcast sent");
      } catch {
        toast.error("Failed to send broadcast");
      }
    },
    [isOnline, executeRcon],
  );

  const filteredPlayers = onlinePlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return {
    onlinePlayers,
    filteredPlayers,
    whitelistedPlayers,
    bannedPlayers,
    searchQuery,
    setSearchQuery,
    isOnline,
    isExecuting,
    executeAction,
    loadWhitelist,
    loadBanList,
    broadcast,
  };
}