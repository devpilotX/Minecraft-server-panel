import { create } from "zustand";
import { type ConnectionStatus } from "@/types/app";

/* ========== CONSTANTS ========== */

const MAX_OUTPUT_LINES = 5000;
const MAX_HISTORY_ENTRIES = 100;
const HISTORY_STORAGE_PREFIX = "devpilotx_cmd_history_";

/* ========== TYPES ========== */

interface ConsoleLine {
  id: string;
  text: string;
  timestamp: number;
}

interface ConsoleState {
  /* Output */
  outputLines: ConsoleLine[];
  appendOutput: (text: string) => void;
  clearOutput: () => void;

  /* Command history */
  commandHistory: string[];
  historyIndex: number;
  currentInput: string;
  addToHistory: (command: string) => void;
  navigateHistory: (direction: "up" | "down") => string;
  setCurrentInput: (input: string) => void;
  resetHistoryNavigation: () => void;

  /* Connection status */
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  /* Persistence helpers */
  loadHistory: (serverId: string) => void;
  saveHistory: (serverId: string) => void;
}

/* ========== LINE ID GENERATOR ========== */

let lineCounter = 0;
function generateLineId(): string {
  lineCounter += 1;
  return `line-${Date.now().toString(36)}-${lineCounter.toString(36)}`;
}

/* ========== STORE ========== */

export const useConsoleStore = create<ConsoleState>()((set, get) => ({
  /* Output */
  outputLines: [],
  appendOutput: (text) =>
    set((state) => {
      const newLine: ConsoleLine = {
        id: generateLineId(),
        text,
        timestamp: Date.now(),
      };
      const updated = [...state.outputLines, newLine];
      if (updated.length > MAX_OUTPUT_LINES) {
        return { outputLines: updated.slice(-MAX_OUTPUT_LINES) };
      }
      return { outputLines: updated };
    }),
  clearOutput: () => set({ outputLines: [] }),

  /* Command history */
  commandHistory: [],
  historyIndex: -1,
  currentInput: "",

  addToHistory: (command) =>
    set((state) => {
      const trimmed = command.trim();
      if (trimmed.length === 0) return state;

      const lastCommand = state.commandHistory[state.commandHistory.length - 1];
      if (lastCommand === trimmed) {
        return { historyIndex: -1, currentInput: "" };
      }

      const updated = [...state.commandHistory, trimmed];
      if (updated.length > MAX_HISTORY_ENTRIES) {
        return {
          commandHistory: updated.slice(-MAX_HISTORY_ENTRIES),
          historyIndex: -1,
          currentInput: "",
        };
      }
      return {
        commandHistory: updated,
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
      if (historyIndex === -1) {
        newIndex = commandHistory.length - 1;
      } else if (historyIndex > 0) {
        newIndex = historyIndex - 1;
      } else {
        newIndex = 0;
      }
    } else {
      if (historyIndex === -1) {
        return currentInput;
      } else if (historyIndex < commandHistory.length - 1) {
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

  /* Connection status */
  connectionStatus: "disconnected",
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  /* Persistence */
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