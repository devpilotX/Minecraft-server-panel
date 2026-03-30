import {
  formatDistanceToNow,
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";

/* ========== BYTES ========== */

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;
const BYTES_PER_UNIT = 1024;

/**
 * Formats bytes into a human-readable string.
 * @example formatBytes(1536) => "1.50 KB"
 * @example formatBytes(0) => "0 B"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  if (bytes < 0) return "0 B";

  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT)),
    BYTE_UNITS.length - 1,
  );
  const value = bytes / Math.pow(BYTES_PER_UNIT, unitIndex);
  const unit = BYTE_UNITS[unitIndex];

  return `${value.toFixed(decimals)} ${unit ?? "B"}`;
}

/**
 * Converts bytes to GiB with specified decimal places.
 * @example bytesToGiB(1073741824) => "1.00"
 */
export function bytesToGiB(bytes: number, decimals = 2): string {
  const gib = bytes / (1024 * 1024 * 1024);
  return gib.toFixed(decimals);
}

/**
 * Converts bytes to MiB with specified decimal places.
 */
export function bytesToMiB(bytes: number, decimals = 2): string {
  const mib = bytes / (1024 * 1024);
  return mib.toFixed(decimals);
}

/**
 * Converts megabytes (MB, from Pterodactyl limits) to GiB string.
 * Pterodactyl reports limits in MB (1 MB = 1,000,000 bytes conceptually,
 * but the panel treats it as MiB). We follow the panel convention.
 */
export function mbToGiB(mb: number, decimals = 2): string {
  const gib = mb / 1024;
  return gib.toFixed(decimals);
}

/* ========== NUMBERS ========== */

/**
 * Formats a large number with abbreviations.
 * @example formatCompactNumber(1500) => "1.5K"
 * @example formatCompactNumber(2500000) => "2.5M"
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Formats a percentage (0-100) with specified decimals.
 * Clamps between 0 and 100.
 */
export function formatPercentage(value: number, decimals = 1): string {
  const clamped = Math.min(100, Math.max(0, value));
  return `${clamped.toFixed(decimals)}%`;
}

/* ========== UPTIME ========== */

/**
 * Formats uptime in milliseconds to a human-readable duration.
 * @example formatUptime(9252000) => "2h 34m 12s"
 * @example formatUptime(0) => "0s"
 */
export function formatUptime(uptimeMs: number): string {
  if (uptimeMs <= 0) return "0s";

  const totalSeconds = Math.floor(uptimeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days.toString()}d`);
  if (hours > 0) parts.push(`${hours.toString()}h`);
  if (minutes > 0) parts.push(`${minutes.toString()}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds.toString()}s`);

  return parts.join(" ");
}

/* ========== DATES ========== */

/**
 * Formats a date string to relative time (e.g., "3 hours ago").
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

/**
 * Formats a date string to absolute format.
 * @example formatAbsoluteDate("2026-03-29T...") => "Mar 29, 2026 8:30 PM"
 */
export function formatAbsoluteDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  } catch {
    return "Unknown";
  }
}

/**
 * Formats a date string to short format.
 * @example formatShortDate("2026-03-29T...") => "Mar 29"
 */
export function formatShortDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "MMM d");
  } catch {
    return "Unknown";
  }
}

/**
 * Returns a smart relative time string.
 * < 60 seconds: "Xs ago"
 * < 60 minutes: "Xm ago"
 * < 24 hours: "Xh ago"
 * < 7 days: "Xd ago"
 * else: absolute date
 */
export function formatSmartTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();

    const secs = differenceInSeconds(now, date);
    if (secs < 60) return `${secs.toString()}s ago`;

    const mins = differenceInMinutes(now, date);
    if (mins < 60) return `${mins.toString()}m ago`;

    const hrs = differenceInHours(now, date);
    if (hrs < 24) return `${hrs.toString()}h ago`;

    const days = differenceInDays(now, date);
    if (days < 7) return `${days.toString()}d ago`;

    return format(date, "MMM d, yyyy");
  } catch {
    return "Unknown";
  }
}

/**
 * Formats a timestamp string for the resource chart X-axis.
 * @example formatChartTime("2026-03-29T14:32:10") => "14:32:10"
 */
export function formatChartTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return format(date, "HH:mm:ss");
  } catch {
    return "";
  }
}

/* ========== STRINGS ========== */

/**
 * Truncates a string to maxLength and appends ellipsis.
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}