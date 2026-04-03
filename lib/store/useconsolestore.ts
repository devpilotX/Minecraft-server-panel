import { create } from "zustand";
import { type ConnectionStatus } from "@/types/app";

const MAX_OUTPUT_LINES = 5000;
const MAX_HISTORY_ENTRIES = 100;
const HISTORY_STORAGE_PREFIX = "devpilotx_cmd_history_";

interface ConsoleLine {
  id: string;
  text: string;
  timestamp: number;
}

interface ConsoleState {
  outputLines: ConsoleLine[];
  appendOutput: (text: string) => void;
  clearOutput: () => void;

  commandHistory: string[];
  historyIndex: number;
  currentInput: string;
  addToHistory: (command: string) => void;
  navigateHistory: (direction: "up" | "down") => string;
  setCurrentInput: (input: string) => void;
  resetHistoryNavigation: () => void;

  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  loadHistory: (serverId: string) => void;
  saveHistory: (serverId: string) => void;
}

/**
 * Generates a unique line ID using crypto when available,
 * falling back to timestamp + counter.
 */
let lineCounter = 0;
function generateLineId(): string {
  lineCounter += 1;
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `line-${Date.now().toString(36)}-${lineCounter.toString(36)}`;
}

export const useConsoleStore = create<ConsoleState>()((set, get) => ({
  outputLines: [],
  appendOutput: (text) =>
    set((state) => {
      const newLine: ConsoleLine = {
        id: generateLineId(),
        text,
        timestamp: Date.now(),
      };
      const updated = [...state.outputLines, newLine];
      return {
        outputLines:
          updated.length > MAX_OUTPUT_LINES
            ? updated.slice(-MAX_OUTPUT_LINES)
            : updated,
      };
    }),
  clearOutput: () => set({ outputLines: [] }),

  commandHistory: [],
  historyIndex: -1,
  currentInput: "",

  addToHistory: (command) =>
    set((state) => {
      const trimmed = command.trim();
      if (trimmed.length === 0) return state;

      const lastCommand =
        state.commandHistory[state.commandHistory.length - 1];
      if (lastCommand === trimmed) {
        return { historyIndex: -1, currentInput: "" };
      }

      const updated = [...state.commandHistory, trimmed];
      return {
        commandHistory:
          updated.length > MAX_HISTORY_ENTRIES
            ? updated.slice(-MAX_HISTORY_ENTRIES)
            : updated,
        historyIndex: -1,
        currentInput: "",
      };
    }),

  navigateHistory: (direction) => {
    const state = get();
    const { commandHistory, historyIndex, currentInput } = state;

    if (commandHistory.length === 0) return currentInput;

    let newIndex: number;

    if (direction === "up") {
      newIndex =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
    } else {
      if (historyIndex === -1) return currentInput;
      if (historyIndex < commandHistory.length - 1) {
        newIndex = historyIndex + 1;
      } else {
        set({ historyIndex: -1 });
        return currentInput;
      }
    }

    const command = commandHistory[newIndex] ?? "";
    set({ historyIndex: newIndex });
    return command;
  },

  setCurrentInput: (input) => set({ currentInput: input }),
  resetHistoryNavigation: () => set({ historyIndex: -1 }),

  connectionStatus: "disconnected",
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  loadHistory: (serverId) => {
    try {
      const key = `${HISTORY_STORAGE_PREFIX}${serverId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) {
          set({ commandHistory: parsed.slice(-MAX_HISTORY_ENTRIES) });
        }
      }
    } catch {
      /* Ignore localStorage errors */
    }
  },

  saveHistory: (serverId) => {
    try {
      const key = `${HISTORY_STORAGE_PREFIX}${serverId}`;
      const { commandHistory } = get();
      localStorage.setItem(key, JSON.stringify(commandHistory));
    } catch {
      /* Ignore localStorage errors */
    }
  },
}));