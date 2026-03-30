"use client";

import { useState } from "react";
import { Terminal } from "@/components/console/Terminal";
import { CommandInput } from "@/components/console/CommandInput";
import { LogFilter } from "@/components/console/LogFilter";
import { PowerControls } from "@/components/console/PowerControls";
import { useConsoleWebSocket } from "@/hooks/useConsoleWebSocket";
import { useConsoleStore } from "@/lib/store/useConsoleStore";
import { Terminal as TerminalIcon } from "lucide-react";

type LogLevel = "all" | "info" | "warn" | "error";

/**
 * Console page.
 * Full-height terminal with command input, log filtering,
 * and power controls. WebSocket streams live console output.
 */
export default function ConsolePage() {
  const { sendCommand } = useConsoleWebSocket();
  const isConnected = useConsoleStore((s) => s.isConnected);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<LogLevel>("all");

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-5 w-5 text-text-secondary" />
            <h1 className="text-2xl font-bold text-text-primary">Console</h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Live server console with command input
          </p>
        </div>
      </div>

      {/* Power controls */}
      <PowerControls />

      {/* Log filter bar */}
      <LogFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLevel={filterLevel}
        onFilterChange={setFilterLevel}
      />

      {/* Terminal output */}
      <Terminal
        searchQuery={searchQuery}
        filterLevel={filterLevel}
      />

      {/* Command input */}
      <CommandInput
        onSend={sendCommand}
        disabled={!isConnected}
      />
    </div>
  );
}