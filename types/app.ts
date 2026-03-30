/**
 * Application-level types for DevPilotX Panel.
 * Covers navigation, UI state, config, and component contracts.
 */

import { type ServerPowerState } from "./pterodactyl";

/* ========== SERVER STATUS ========== */

export type ServerStatus =
  | "online"
  | "offline"
  | "starting"
  | "stopping"
  | "crashed"
  | "suspended"
  | "installing";

/**
 * Maps Pterodactyl power states + special states to unified ServerStatus.
 */
export function resolveServerStatus(
  powerState: ServerPowerState,
  isSuspended: boolean,
  isInstalling: boolean,
): ServerStatus {
  if (isSuspended) return "suspended";
  if (isInstalling) return "installing";

  const STATE_MAP: Record<ServerPowerState, ServerStatus> = {
    running: "online",
    starting: "starting",
    stopping: "stopping",
    offline: "offline",
  };

  return STATE_MAP[powerState];
}

/* ========== NAVIGATION ========== */

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/* ========== RESOURCE DATA POINT ========== */

export interface ResourceDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk?: number;
  networkRx?: number;
  networkTx?: number;
}

/* ========== TOAST ========== */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  variant: ToastVariant;
  title: string;
  description?: string;
}

/* ========== COMMAND HISTORY ========== */

export interface CommandHistoryEntry {
  command: string;
  timestamp: number;
}

/* ========== TABLE / SORTING ========== */

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/* ========== FILE MANAGER ========== */

export type FileViewMode = "list" | "grid";

export type FileSortKey = "name" | "size" | "modified" | "type";

export interface BreadcrumbSegment {
  label: string;
  path: string;
}

/* ========== WEBSOCKET CONNECTION ========== */

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "reconnecting"
  | "disconnected";

/* ========== THEME ========== */

export type AccentColor =
  | "blue"
  | "green"
  | "red"
  | "amber"
  | "purple"
  | "cyan";

/* ========== PERMISSIONS (Subuser) ========== */

export interface PermissionGroup {
  name: string;
  description: string;
  permissions: PermissionItem[];
}

export interface PermissionItem {
  key: string;
  label: string;
  description: string;
}

/* ========== SCHEDULE BUILDER ========== */

export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export type ScheduleTaskAction = "command" | "power" | "backup";

/* ========== CONFIG / ENVIRONMENT ========== */

export interface AppConfig {
  pterodactylUrl: string;
  appName: string;
  appUrl: string;
  defaultServerId: string;
}

/**
 * Reads environment variables and returns typed AppConfig.
 * Throws at build time if required variables are missing.
 */
export function getAppConfig(): AppConfig {
  const pterodactylUrl = process.env["NEXT_PUBLIC_PTERODACTYL_URL"];
  const appName = process.env["NEXT_PUBLIC_APP_NAME"] ?? "DevPilotX";
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3001";
  const defaultServerId = process.env["NEXT_PUBLIC_DEFAULT_SERVER_ID"];

  if (!pterodactylUrl) {
    throw new Error("NEXT_PUBLIC_PTERODACTYL_URL is not set");
  }
  if (!defaultServerId) {
    throw new Error("NEXT_PUBLIC_DEFAULT_SERVER_ID is not set");
  }

  return { pterodactylUrl, appName, appUrl, defaultServerId };
}