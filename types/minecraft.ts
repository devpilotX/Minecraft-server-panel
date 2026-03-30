/**
 * Minecraft-specific types for DevPilotX Panel.
 * Covers player data, worlds, NBT structures, and game enums.
 */

/* ========== GAME MODES ========== */

export type GameMode = "survival" | "creative" | "adventure" | "spectator";

export const GAME_MODES: readonly GameMode[] = [
  "survival",
  "creative",
  "adventure",
  "spectator",
] as const;

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  survival: "Survival",
  creative: "Creative",
  adventure: "Adventure",
  spectator: "Spectator",
};

export const GAME_MODE_IDS: Record<GameMode, number> = {
  survival: 0,
  creative: 1,
  adventure: 2,
  spectator: 3,
};

/* ========== DIFFICULTY ========== */

export type Difficulty = "peaceful" | "easy" | "normal" | "hard" | "hardcore";

/* ========== DIMENSIONS ========== */

export type Dimension = "overworld" | "the_nether" | "the_end";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  overworld: "Overworld",
  the_nether: "The Nether",
  the_end: "The End",
};

export const DIMENSION_COLORS: Record<Dimension, string> = {
  overworld: "#4ade80",
  the_nether: "#f87171",
  the_end: "#c084fc",
};

/* ========== PLAYER ========== */

export interface MinecraftPlayer {
  uuid: string;
  name: string;
  isOnline: boolean;
  lastSeen?: string;
  firstJoined?: string;
  gameMode?: GameMode;
  health?: number;
  maxHealth?: number;
  foodLevel?: number;
  saturation?: number;
  xpLevel?: number;
  xpProgress?: number;
  position?: PlayerPosition;
  dimension?: Dimension;
  isOp: boolean;
  opLevel?: number;
  isWhitelisted: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiry?: string;
}

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

export interface PlayerAbilities {
  mayFly: boolean;
  flying: boolean;
  invulnerable: boolean;
  mayBuild: boolean;
  instaBuild: boolean;
  walkSpeed: number;
  flySpeed: number;
}

export interface PlayerInventorySlot {
  slot: number;
  id: string;
  count: number;
  damage?: number;
  nbt?: Record<string, unknown>;
}

export interface PlayerStatistics {
  category: string;
  statName: string;
  value: number;
}

export interface PlayerAdvancement {
  id: string;
  name: string;
  description: string;
  done: boolean;
  criteria: Record<string, boolean>;
}

/* ========== BAN / WHITELIST / OPS ========== */

export interface BannedPlayer {
  uuid: string;
  name: string;
  created: string;
  source: string;
  expires: string;
  reason: string;
}

export interface BannedIp {
  ip: string;
  created: string;
  source: string;
  expires: string;
  reason: string;
}

export interface WhitelistEntry {
  uuid: string;
  name: string;
}

export interface OpsEntry {
  uuid: string;
  name: string;
  level: number;
  bypassesPlayerLimit: boolean;
}

/* ========== WORLD ========== */

export interface MinecraftWorld {
  name: string;
  path: string;
  size: number;
  dimension: Dimension;
  seed?: string;
  isPrimary: boolean;
  hasLevelDat: boolean;
  lastModified?: string;
}

/* ========== SERVER PROPERTIES ========== */

export interface ServerPropertyDefinition {
  key: string;
  label: string;
  description: string;
  type: "string" | "number" | "boolean" | "select";
  defaultValue: string | number | boolean;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  group: string;
}

/* ========== MOTD COLOR CODES ========== */

export const MINECRAFT_COLOR_MAP: Record<string, string> = {
  "0": "#000000",
  "1": "#0000aa",
  "2": "#00aa00",
  "3": "#00aaaa",
  "4": "#aa0000",
  "5": "#aa00aa",
  "6": "#ffaa00",
  "7": "#aaaaaa",
  "8": "#555555",
  "9": "#5555ff",
  a: "#55ff55",
  b: "#55ffff",
  c: "#ff5555",
  d: "#ff55ff",
  e: "#ffff55",
  f: "#ffffff",
};

export const MINECRAFT_FORMAT_CODES: Record<string, string> = {
  k: "obfuscated",
  l: "bold",
  m: "strikethrough",
  n: "underline",
  o: "italic",
  r: "reset",
};

/* ========== MODRINTH ========== */

export type AddonType =
  | "plugin"
  | "mod"
  | "modpack"
  | "datapack"
  | "resourcepack";

export interface ModrinthProject {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  client_side: "required" | "optional" | "unsupported";
  server_side: "required" | "optional" | "unsupported";
  project_type: string;
  downloads: number;
  icon_url: string | null;
  color: number | null;
  date_created: string;
  date_modified: string;
  latest_version: string;
  versions: string[];
  game_versions: string[];
  loaders: string[];
}

export interface ModrinthVersion {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  changelog: string | null;
  date_published: string;
  downloads: number;
  version_type: "release" | "beta" | "alpha";
  files: ModrinthFile[];
  game_versions: string[];
  loaders: string[];
}

export interface ModrinthFile {
  hashes: {
    sha1: string;
    sha512: string;
  };
  url: string;
  filename: string;
  primary: boolean;
  size: number;
}