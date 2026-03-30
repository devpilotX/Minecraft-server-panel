/**
 * Central environment configuration.
 * All server-side code imports from here.
 * Values come from .env.local at runtime.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Pterodactyl Panel
export const PTERODACTYL_BASE_URL =
  process.env.PTERODACTYL_BASE_URL ?? "https://panel.devpilotx.com";
export const PTERODACTYL_API_KEY =
  process.env.PTERODACTYL_API_KEY ?? "";

// Server
export const PTERODACTYL_SERVER_ID =
  process.env.PTERODACTYL_SERVER_ID ?? "c9f907a8-e953-476b-a349-534ccf14919e";

// RCON (optional — for direct RCON if not going through Pterodactyl)
export const RCON_HOST = process.env.RCON_HOST ?? "play.devpilotx.com";
export const RCON_PORT = parseInt(process.env.RCON_PORT ?? "25575", 10);
export const RCON_PASSWORD = process.env.RCON_PASSWORD ?? "";

// App
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.devpilotx.com";
export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const IS_DEV = NODE_ENV === "development";

// Cookie names
export const AUTH_COOKIE_NAME = "dpx-api-key";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days