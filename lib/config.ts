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
export const PTERODACTYL_BASE_URL = requireEnv("PTERODACTYL_BASE_URL");
export const PTERODACTYL_API_KEY = requireEnv("PTERODACTYL_API_KEY");

// Server
export const PTERODACTYL_SERVER_ID = requireEnv("PTERODACTYL_SERVER_ID");

// RCON (optional — for direct RCON if not going through Pterodactyl)
export const RCON_HOST = process.env.RCON_HOST ?? "localhost";
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