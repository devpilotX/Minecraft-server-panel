import { Rcon } from "rcon-client";

/* ========== CONSTANTS ========== */

const DEFAULT_RCON_HOST = "127.0.0.1";
const DEFAULT_RCON_PORT = 25575;
const RCON_TIMEOUT_MS = 5000;

/* ========== SINGLETON ========== */

let rconInstance: Rcon | null = null;

/**
 * Creates or reuses an RCON connection.
 * Server-side only (used in API routes).
 */
async function getRconClient(): Promise<Rcon> {
  if (rconInstance) {
    try {
      await rconInstance.send("list");
      return rconInstance;
    } catch {
      rconInstance = null;
    }
  }

  const host = process.env["RCON_HOST"] ?? DEFAULT_RCON_HOST;
  const port = parseInt(
    process.env["RCON_PORT"] ?? DEFAULT_RCON_PORT.toString(),
    10,
  );
  const password = process.env["RCON_PASSWORD"] ?? "";

  if (!password) {
    throw new Error("RCON_PASSWORD environment variable is not set");
  }

  const client = await Rcon.connect({
    host,
    port,
    password,
    timeout: RCON_TIMEOUT_MS,
  });

  rconInstance = client;
  return client;
}

/**
 * Sends an RCON command and returns the response.
 * @throws Error if RCON connection fails or command fails.
 */
export async function sendRconCommand(command: string): Promise<string> {
  const client = await getRconClient();
  const response = await client.send(command);
  return response;
}

/**
 * Gracefully disconnects RCON (for cleanup).
 */
export async function disconnectRcon(): Promise<void> {
  if (rconInstance) {
    try {
      rconInstance.end();
    } catch {
      /* Ignore close errors */
    }
    rconInstance = null;
  }
}