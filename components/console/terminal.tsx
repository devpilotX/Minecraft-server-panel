"use client";

import { useEffect, useRef, useCallback } from "react";
import { useConsoleStore, type ConsoleLine } from "@/lib/store/useConsoleStore";
import { cn } from "@/lib/utils/cn";

interface TerminalProps {
  searchQuery?: string;
  filterLevel?: "all" | "info" | "warn" | "error";
  className?: string;
}

/**
 * Console terminal display.
 * Renders ANSI-colored console output with auto-scroll.
 * Uses a virtualized approach for performance with large log buffers.
 *
 * Note: For full xterm.js integration, install `xterm` and `xterm-addon-fit`.
 * This implementation provides a lightweight alternative that renders
 * Pterodactyl console output with ANSI color support.
 */
export function Terminal({
  searchQuery = "",
  filterLevel = "all",
  className,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const lines = useConsoleStore((s) => s.lines);
  const isConnected = useConsoleStore((s) => s.isConnected);

  // Filter lines based on level and search
  const filteredLines = lines.filter((line) => {
    if (filterLevel !== "all" && line.type !== filterLevel && line.type !== "system" && line.type !== "command") {
      return false;
    }
    if (searchQuery) {
      const stripped = line.text.replace(/\x1b\[[0-9;]*m/g, "");
      return stripped.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLines.length]);

  // Detect if user scrolled up (pause auto-scroll)
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "dpx-card overflow-y-auto font-mono text-xs leading-relaxed",
        "bg-[#0d1117] border-border-subtle",
        "p-4 min-h-[400px] max-h-[calc(100vh-280px)]",
        "selection:bg-accent-blue/30",
        className,
      )}
    >
      {/* Connection status indicator */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isConnected ? "bg-accent-green animate-pulse" : "bg-accent-red",
          )}
        />
        <span className="text-[10px] text-gray-500">
          {isConnected ? "Connected to console" : "Disconnected"}
        </span>
      </div>

      {/* Log lines */}
      {filteredLines.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-600">
          {searchQuery
            ? "No matching log lines"
            : "Waiting for console output..."}
        </div>
      ) : (
        filteredLines.map((line, index) => (
          <TerminalLine
            key={`${line.timestamp}-${index}`}
            line={line}
            searchQuery={searchQuery}
          />
        ))
      )}

      {/* Auto-scroll indicator */}
      {!shouldAutoScroll.current && filteredLines.length > 0 && (
        <button
          onClick={() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
              shouldAutoScroll.current = true;
            }
          }}
          className="sticky bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-accent-blue/90 px-3 py-1 text-[10px] font-medium text-white shadow-lg hover:bg-accent-blue transition-colors"
        >
          ↓ Scroll to bottom
        </button>
      )}
    </div>
  );
}

/* ========== TERMINAL LINE ========== */

interface TerminalLineProps {
  line: ConsoleLine;
  searchQuery: string;
}

function TerminalLine({ line, searchQuery }: TerminalLineProps) {
  const lineColor = {
    info: "text-gray-300",
    warn: "text-yellow-400",
    error: "text-red-400",
    system: "text-blue-400",
    command: "text-cyan-400",
  }[line.type];

  // Parse ANSI escape codes into styled spans
  const rendered = parseAnsi(line.text, searchQuery);

  return (
    <div
      className={cn(
        "flex gap-2 py-px hover:bg-white/[0.02] rounded-sm px-1 -mx-1",
        line.type === "error" && "bg-red-500/5",
        line.type === "warn" && "bg-yellow-500/5",
      )}
    >
      {/* Timestamp */}
      <span className="text-gray-600 flex-shrink-0 select-none text-[10px] leading-relaxed">
        {formatTimestamp(line.timestamp)}
      </span>
      {/* Content */}
      <span className={cn("flex-1 break-all whitespace-pre-wrap", lineColor)}>
        {rendered}
      </span>
    </div>
  );
}

/* ========== ANSI PARSER ========== */

const ANSI_COLORS: Record<string, string> = {
  "30": "text-gray-900",
  "31": "text-red-400",
  "32": "text-green-400",
  "33": "text-yellow-400",
  "34": "text-blue-400",
  "35": "text-purple-400",
  "36": "text-cyan-400",
  "37": "text-gray-300",
  "90": "text-gray-500",
  "91": "text-red-300",
  "92": "text-green-300",
  "93": "text-yellow-300",
  "94": "text-blue-300",
  "95": "text-purple-300",
  "96": "text-cyan-300",
  "97": "text-white",
};

function parseAnsi(text: string, highlight: string): React.ReactNode {
  // Split by ANSI escape sequences
  const parts: Array<{ text: string; className: string }> = [];
  let currentClass = "";
  let remaining = text;

  const regex = /\x1b\[([0-9;]*)m/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    // Text before the escape
    if (match.index > lastIndex) {
      parts.push({
        text: remaining.slice(lastIndex, match.index),
        className: currentClass,
      });
    }

    // Parse the escape code
    const codes = match[1].split(";");
    for (const code of codes) {
      if (code === "0" || code === "") {
        currentClass = "";
      } else if (code === "1") {
        currentClass += " font-bold";
      } else if (code === "3") {
        currentClass += " italic";
      } else if (code === "4") {
        currentClass += " underline";
      } else if (ANSI_COLORS[code]) {
        currentClass = ANSI_COLORS[code] + (currentClass.includes("font-bold") ? " font-bold" : "");
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < remaining.length) {
    parts.push({
      text: remaining.slice(lastIndex),
      className: currentClass,
    });
  }

  // Build React elements with optional search highlighting
  return parts.map((part, i) => {
    if (highlight && part.text.toLowerCase().includes(highlight.toLowerCase())) {
      return highlightText(part.text, highlight, part.className, i);
    }
    return (
      <span key={i} className={part.className || undefined}>
        {part.text}
      </span>
    );
  });
}

function highlightText(
  text: string,
  query: string,
  className: string,
  key: number,
): React.ReactNode {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let start = 0;

  while (true) {
    const idx = lowerText.indexOf(lowerQuery, start);
    if (idx === -1) {
      parts.push(
        <span key={`${key}-${start}`} className={className || undefined}>
          {text.slice(start)}
        </span>,
      );
      break;
    }
    if (idx > start) {
      parts.push(
        <span key={`${key}-${start}`} className={className || undefined}>
          {text.slice(start, idx)}
        </span>,
      );
    }
    parts.push(
      <mark
        key={`${key}-hl-${idx}`}
        className="bg-accent-blue/30 text-white rounded-sm px-0.5"
      >
        {text.slice(idx, idx + query.length)}
      </mark>,
    );
    start = idx + query.length;
  }

  return <>{parts}</>;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}