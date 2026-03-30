import { type ReactNode, createElement } from "react";
import {
  MINECRAFT_COLOR_MAP,
  MINECRAFT_FORMAT_CODES,
  type GameMode,
  type Dimension,
  GAME_MODE_LABELS,
  DIMENSION_LABELS,
  DIMENSION_COLORS,
} from "@/types/minecraft";

/* ========== MOTD COLOR PARSER ========== */

/**
 * Section sign character used in Minecraft formatting codes.
 * Can be either \u00a7 (standard) or & (common alternative).
 */
const SECTION_SIGN = "\u00a7";
const ALT_SECTION_SIGN = "&";

interface MOTDSegment {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
}

/**
 * Parses Minecraft MOTD text with color/formatting codes into segments.
 * Handles both \u00a7 and & section signs.
 *
 * @example
 * parseMOTDSegments("\u00a7aHello \u00a7lWorld")
 * => [{ text: "Hello ", color: "#55ff55" }, { text: "World", color: "#55ff55", bold: true }]
 */
function parseMOTDSegments(rawText: string): MOTDSegment[] {
  const segments: MOTDSegment[] = [];
  let currentColor: string | undefined;
  let bold = false;
  let italic = false;
  let underline = false;
  let strikethrough = false;
  let obfuscated = false;
  let buffer = "";

  const text = rawText.replace(
    new RegExp(`[${SECTION_SIGN}${ALT_SECTION_SIGN}]`, "g"),
    SECTION_SIGN,
  );

  for (let i = 0; i < text.length; i++) {
    if (text[i] === SECTION_SIGN && i + 1 < text.length) {
      if (buffer.length > 0) {
        segments.push({
          text: buffer,
          color: currentColor,
          bold,
          italic,
          underline,
          strikethrough,
          obfuscated,
        });
        buffer = "";
      }

      const code = text[i + 1]?.toLowerCase();
      i++;

      if (code && MINECRAFT_COLOR_MAP[code]) {
        currentColor = MINECRAFT_COLOR_MAP[code];
        bold = false;
        italic = false;
        underline = false;
        strikethrough = false;
        obfuscated = false;
      } else if (code && MINECRAFT_FORMAT_CODES[code]) {
        const fmt = MINECRAFT_FORMAT_CODES[code];
        switch (fmt) {
          case "bold":
            bold = true;
            break;
          case "italic":
            italic = true;
            break;
          case "underline":
            underline = true;
            break;
          case "strikethrough":
            strikethrough = true;
            break;
          case "obfuscated":
            obfuscated = true;
            break;
          case "reset":
            currentColor = undefined;
            bold = false;
            italic = false;
            underline = false;
            strikethrough = false;
            obfuscated = false;
            break;
        }
      }
    } else {
      buffer += text[i] ?? "";
    }
  }

  if (buffer.length > 0) {
    segments.push({
      text: buffer,
      color: currentColor,
      bold,
      italic,
      underline,
      strikethrough,
      obfuscated,
    });
  }

  return segments;
}

/**
 * Parses Minecraft MOTD text with color/formatting codes into React nodes.
 * Each segment becomes a <span> with inline styles matching Minecraft colors.
 *
 * @example
 * // In JSX:
 * <p>{parseMOTD(server.motd)}</p>
 */
export function parseMOTD(rawText: string): ReactNode {
  const segments = parseMOTDSegments(rawText);

  return segments.map((segment, index) => {
    const style: Record<string, string> = {};

    if (segment.color) {
      style["color"] = segment.color;
    }
    if (segment.bold) {
      style["fontWeight"] = "700";
    }
    if (segment.italic) {
      style["fontStyle"] = "italic";
    }

    const decorations: string[] = [];
    if (segment.underline) decorations.push("underline");
    if (segment.strikethrough) decorations.push("line-through");
    if (decorations.length > 0) {
      style["textDecoration"] = decorations.join(" ");
    }

    return createElement(
      "span",
      { key: `motd-${index.toString()}`, style },
      segment.text,
    );
  });
}

/**
 * Strips all Minecraft formatting codes from text, returning plain text.
 */
export function stripMOTDCodes(rawText: string): string {
  return rawText.replace(
    new RegExp(`[${SECTION_SIGN}${ALT_SECTION_SIGN}][0-9a-fk-or]`, "gi"),
    "",
  );
}

/* ========== PLAYER HELPERS ========== */

/**
 * Returns the Crafatar avatar URL for a player UUID.
 * @param size - Image size in pixels (default 64).
 */
export function getPlayerAvatarUrl(uuid: string, size = 64): string {
  return `https://crafatar.com/avatars/${uuid}?size=${size.toString()}&overlay`;
}

/**
 * Returns the Crafatar full body render URL for a player UUID.
 */
export function getPlayerBodyUrl(uuid: string, size = 128): string {
  return `https://crafatar.com/renders/body/${uuid}?size=${size.toString()}&overlay`;
}

/**
 * Returns the Crafatar head render URL for a player UUID.
 */
export function getPlayerHeadUrl(uuid: string, size = 64): string {
  return `https://crafatar.com/renders/head/${uuid}?size=${size.toString()}&overlay`;
}

/* ========== HEALTH / HUNGER RENDERING ========== */

export type HeartState = "full" | "half" | "empty";

/**
 * Converts a health value (0-20) to an array of 10 heart states.
 * Each heart = 2 HP. Used for rendering health bar icons.
 *
 * @example getHeartStates(15) => ["full","full","full","full","full","full","full","half","empty","empty"]
 */
export function getHeartStates(health: number): HeartState[] {
  const clamped = Math.max(0, Math.min(20, health));
  const hearts: HeartState[] = [];

  for (let i = 0; i < 10; i++) {
    const heartHp = clamped - i * 2;
    if (heartHp >= 2) {
      hearts.push("full");
    } else if (heartHp >= 1) {
      hearts.push("half");
    } else {
      hearts.push("empty");
    }
  }

  return hearts;
}

/**
 * Converts a food level (0-20) to an array of 10 food states.
 * Same logic as hearts.
 */
export function getFoodStates(foodLevel: number): HeartState[] {
  return getHeartStates(foodLevel);
}

/**
 * Calculates XP bar progress percentage from level and progress.
 * xpProgress is a 0.0-1.0 float from Minecraft NBT.
 */
export function getXpBarPercentage(xpProgress: number): number {
  return Math.min(100, Math.max(0, xpProgress * 100));
}

/* ========== GAME MODE / DIMENSION HELPERS ========== */

/**
 * Returns the display label for a game mode.
 */
export function getGameModeLabel(mode: GameMode): string {
  return GAME_MODE_LABELS[mode];
}

/**
 * Returns the display label for a dimension.
 */
export function getDimensionLabel(dimension: Dimension): string {
  return DIMENSION_LABELS[dimension];
}

/**
 * Returns the accent color hex for a dimension.
 */
export function getDimensionColor(dimension: Dimension): string {
  return DIMENSION_COLORS[dimension];
}

/* ========== FILE TYPE HELPERS ========== */

/**
 * Maps common Minecraft file extensions to icon identifiers.
 */
export type FileIconType =
  | "folder"
  | "jar"
  | "yml"
  | "json"
  | "properties"
  | "txt"
  | "zip"
  | "log"
  | "image"
  | "generic";

const FILE_EXTENSION_MAP: Record<string, FileIconType> = {
  jar: "jar",
  yml: "yml",
  yaml: "yml",
  json: "json",
  properties: "properties",
  txt: "txt",
  log: "log",
  zip: "zip",
  gz: "zip",
  tar: "zip",
  "7z": "zip",
  rar: "zip",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
};

/**
 * Returns the icon type for a given filename.
 */
export function getFileIconType(
  filename: string,
  isDirectory: boolean,
): FileIconType {
  if (isDirectory) return "folder";

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return FILE_EXTENSION_MAP[ext] ?? "generic";
}

/**
 * Maps file extensions to Monaco Editor language IDs.
 */
const EDITOR_LANGUAGE_MAP: Record<string, string> = {
  yml: "yaml",
  yaml: "yaml",
  json: "json",
  properties: "ini",
  cfg: "ini",
  conf: "ini",
  ini: "ini",
  sh: "shell",
  bash: "shell",
  js: "javascript",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  java: "java",
  xml: "xml",
  html: "html",
  css: "css",
  md: "markdown",
  sql: "sql",
  py: "python",
  toml: "ini",
  log: "plaintext",
  txt: "plaintext",
};

/**
 * Returns the Monaco Editor language identifier for a given filename.
 */
export function getEditorLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EDITOR_LANGUAGE_MAP[ext] ?? "plaintext";
}

/**
 * Maximum file sizes for the built-in editor.
 */
export const FILE_SIZE_LIMITS = {
  WARN_BYTES: 2 * 1024 * 1024,
  BLOCK_BYTES: 10 * 1024 * 1024,
} as const;

/* ========== QUICK COMMANDS ========== */

export interface QuickCommand {
  label: string;
  command: string;
}

export const QUICK_COMMANDS: readonly QuickCommand[] = [
  { label: "/list", command: "/list" },
  { label: "/time set day", command: "/time set day" },
  { label: "/weather clear", command: "/weather clear" },
  { label: "/save-all", command: "/save-all" },
  { label: "/tps", command: "/tps" },
] as const;