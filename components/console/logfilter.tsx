"use client";

import { cn } from "@/lib/utils/cn";
import { useConsoleStore } from "@/lib/store/useConsoleStore";
import { Search, Trash2, Download, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

type LogLevel = "all" | "info" | "warn" | "error";

interface LogFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterLevel: LogLevel;
  onFilterChange: (level: LogLevel) => void;
}

const FILTER_OPTIONS: Array<{
  level: LogLevel;
  label: string;
  color: string;
  activeColor: string;
}> = [
  { level: "all", label: "All", color: "text-text-secondary", activeColor: "bg-accent-blue/10 text-accent-blue border-accent-blue/30" },
  { level: "info", label: "Info", color: "text-text-secondary", activeColor: "bg-accent-green/10 text-accent-green border-accent-green/30" },
  { level: "warn", label: "Warn", color: "text-text-secondary", activeColor: "bg-accent-orange/10 text-accent-orange border-accent-orange/30" },
  { level: "error", label: "Error", color: "text-text-secondary", activeColor: "bg-accent-red/10 text-accent-red border-accent-red/30" },
];

/**
 * Log filter bar: search, level filter tabs, clear, and export buttons.
 */
export function LogFilter({
  searchQuery,
  onSearchChange,
  filterLevel,
  onFilterChange,
}: LogFilterProps) {
  const lines = useConsoleStore((s) => s.lines);
  const clearLines = useConsoleStore((s) => s.clearLines);

  const warnCount = lines.filter((l) => l.type === "warn").length;
  const errorCount = lines.filter((l) => l.type === "error").length;

  const handleExport = () => {
    const text = lines
      .map((l) => {
        const stripped = l.text.replace(/\x1b\[[0-9;]*m/g, "");
        return `[${l.timestamp}] [${l.type.toUpperCase()}] ${stripped}`;
      })
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Console log exported");
  };

  return (
    <div className="dpx-card p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: search + filters */}
      <div className="flex items-center gap-3 flex-1">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter logs..."
            className={cn(
              "w-full rounded-lg border border-border-subtle bg-surface py-1.5 pl-8 pr-3",
              "text-xs text-text-primary placeholder:text-text-tertiary",
              "focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30",
            )}
          />
        </div>

        {/* Level filter tabs */}
        <div className="flex items-center gap-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.level}
              onClick={() => onFilterChange(opt.level)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all",
                filterLevel === opt.level
                  ? opt.activeColor
                  : "border-transparent text-text-tertiary hover:text-text-secondary hover:bg-overlay",
              )}
            >
              {opt.label}
              {opt.level === "warn" && warnCount > 0 && (
                <span className="ml-1 text-[9px] opacity-70">{warnCount}</span>
              )}
              {opt.level === "error" && errorCount > 0 && (
                <span className="ml-1 text-[9px] opacity-70">{errorCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleExport}
          className="text-text-tertiary hover:text-text-secondary"
          title="Export logs"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            clearLines();
            toast.success("Console cleared");
          }}
          className="text-text-tertiary hover:text-accent-red"
          title="Clear console"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>

        {/* Line count */}
        <span className="text-[10px] text-text-tertiary font-mono">
          {lines.length} lines
        </span>
      </div>
    </div>
  );
}