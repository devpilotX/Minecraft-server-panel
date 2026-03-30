import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type ServerStatus } from "@/types/app";
import { type ServerPowerState, type WebSocketStats } from "@/types/pterodactyl";

/* ========== TYPES ========== */

interface ServerState {
  serverId: string;
  serverName: string;
  serverStatus: ServerStatus;
  powerState: ServerPowerState;
  isSuspended: boolean;
  isInstalling: boolean;
}

interface ResourceState {
  cpuPercent: number;
  memoryBytes: number;
  memoryLimitBytes: number;
  diskBytes: number;
  networkRxBytes: number;
  networkTxBytes: number;
  uptimeMs: number;
}

interface AppState {
  /* Sidebar */
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;

  /* Active server */
  server: ServerState;
  setServer: (server: Partial<ServerState>) => void;

  /* Real-time resources (from WebSocket stats) */
  resources: ResourceState;
  updateResources: (stats: WebSocketStats) => void;

  /* Server status shorthand */
  setServerStatus: (status: ServerStatus) => void;
  setPowerState: (state: ServerPowerState) => void;

  /* Notifications */
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  incrementNotifications: () => void;
  clearNotifications: () => void;

  /* Command palette */
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

/* ========== DEFAULT VALUES ========== */

const DEFAULT_SERVER_ID =
  process.env["NEXT_PUBLIC_DEFAULT_SERVER_ID"] ?? "";

const DEFAULT_SERVER: ServerState = {
  serverId: DEFAULT_SERVER_ID,
  serverName: "DevPilotX Server",
  serverStatus: "offline",
  powerState: "offline",
  isSuspended: false,
  isInstalling: false,
};

const DEFAULT_RESOURCES: ResourceState = {
  cpuPercent: 0,
  memoryBytes: 0,
  memoryLimitBytes: 0,
  diskBytes: 0,
  networkRxBytes: 0,
  networkTxBytes: 0,
  uptimeMs: 0,
};

/* ========== STORE ========== */

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      /* Sidebar */
      sidebarExpanded: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

      /* Active server */
      server: DEFAULT_SERVER,
      setServer: (partial) =>
        set((state) => ({
          server: { ...state.server, ...partial },
        })),

      /* Resources */
      resources: DEFAULT_RESOURCES,
      updateResources: (stats) =>
        set({
          resources: {
            cpuPercent: stats.cpu_absolute,
            memoryBytes: stats.memory_bytes,
            memoryLimitBytes: stats.memory_limit_bytes,
            diskBytes: stats.disk_bytes,
            networkRxBytes: stats.network.rx_bytes,
            networkTxBytes: stats.network.tx_bytes,
            uptimeMs: stats.uptime,
          },
        }),

      /* Status shortcuts */
      setServerStatus: (status) =>
        set((state) => ({
          server: { ...state.server, serverStatus: status },
        })),
      setPowerState: (powerState) =>
        set((state) => ({
          server: { ...state.server, powerState },
        })),

      /* Notifications */
      unreadNotifications: 0,
      setUnreadNotifications: (count) =>
        set({ unreadNotifications: count }),
      incrementNotifications: () =>
        set((state) => ({
          unreadNotifications: state.unreadNotifications + 1,
        })),
      clearNotifications: () => set({ unreadNotifications: 0 }),

      /* Command palette */
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) =>
        set({ commandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((state) => ({
          commandPaletteOpen: !state.commandPaletteOpen,
        })),
    }),
    {
      name: "devpilotx-app-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarExpanded: state.sidebarExpanded,
      }),
    },
  ),
);