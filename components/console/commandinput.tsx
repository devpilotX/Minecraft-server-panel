"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { useConsoleStore } from "@/lib/store/useConsoleStore";
import { cn } from "@/lib/utils/cn";
import { Send, ChevronRight } from "lucide-react";

interface CommandInputProps {
  onSend: (command: string) => void;
  disabled?: boolean;
}

/** Common Minecraft server commands for autocomplete hints */
const COMMAND_HINTS = [
  "help",
  "list",
  "stop",
  "restart",
  "say",
  "kick",
  "ban",
  "pardon",
  "op",
  "deop",
  "gamemode",
  "give",
  "tp",
  "teleport",
  "time set",
  "weather",
  "difficulty",
  "whitelist",
  "save-all",
  "seed",
  "tps",
  "plugins",
  "reload",
  "gc",
  "timings",
  "paper reload",
];

/**
 * Command input bar with history navigation and autocomplete hints.
 * Up/Down arrows navigate command history.
 * Tab completes from hints list.
 */
export function CommandInput({ onSend, disabled = false }: CommandInputProps) {
  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hint, setHint] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commandHistory = useConsoleStore((s) => s.commandHistory);
  const addToHistory = useConsoleStore((s) => s.addToHistory);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    addToHistory(trimmed);
    setValue("");
    setHistoryIndex(-1);
    setHint("");
  }, [value, disabled, onSend, addToHistory]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          handleSend();
          break;

        case "ArrowUp":
          e.preventDefault();
          if (commandHistory.length > 0) {
            const newIndex = Math.min(
              historyIndex + 1,
              commandHistory.length - 1,
            );
            setHistoryIndex(newIndex);
            setValue(commandHistory[commandHistory.length - 1 - newIndex]);
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setValue(commandHistory[commandHistory.length - 1 - newIndex]);
          } else {
            setHistoryIndex(-1);
            setValue("");
          }
          break;

        case "Tab":
          e.preventDefault();
          if (hint) {
            setValue(hint);
            setHint("");
          }
          break;

        case "Escape":
          setValue("");
          setHistoryIndex(-1);
          setHint("");
          break;
      }
    },
    [handleSend, commandHistory, historyIndex, hint],
  );

  const handleChange = useCallback((val: string) => {
    setValue(val);
    setHistoryIndex(-1);

    // Update autocomplete hint
    if (val.length > 0) {
      const match = COMMAND_HINTS.find((cmd) =>
        cmd.toLowerCase().startsWith(val.toLowerCase()),
      );
      setHint(match ?? "");
    } else {
      setHint("");
    }
  }, []);

  return (
    <div className="dpx-card flex items-center gap-2 p-2">
      {/* Prompt icon */}
      <ChevronRight className="h-4 w-4 text-accent-blue flex-shrink-0 ml-1" />

      {/* Input with ghost hint */}
      <div className="relative flex-1">
        {/* Ghost hint */}
        {hint && value && (
          <span className="absolute inset-y-0 left-0 flex items-center text-sm font-mono text-gray-600 pointer-events-none">
            <span className="invisible">{value}</span>
            <span>{hint.slice(value.length)}</span>
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Console disconnected..." : "Type a command..."}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent text-sm font-mono text-text-primary",
            "placeholder:text-text-tertiary",
            "focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          "text-text-tertiary transition-all",
          value.trim() && !disabled
            ? "bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20"
            : "opacity-30 cursor-not-allowed",
        )}
      >
        <Send className="h-3.5 w-3.5" />
      </button>

      {/* Keyboard shortcut hint */}
      <div className="hidden sm:flex items-center gap-1 mr-1">
        <kbd className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[9px] font-mono text-text-tertiary">
          ↑↓
        </kbd>
        <span className="text-[9px] text-text-tertiary">history</span>
      </div>
    </div>
  );
}