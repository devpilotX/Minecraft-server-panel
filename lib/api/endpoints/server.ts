import { pteroClient } from "@/lib/api/pterodactyl";
import { ResourceUsageSchema, WebSocketAuthSchema } from "@/lib/api/types";
import type {
  PteroServer,
  PteroSingleResponse,
  PowerSignal,
  PteroActivityLog,
  PteroListResponse,
  PteroStartupVariable,
} from "@/types/pterodactyl";

const SERVER_ID =
  process.env["NEXT_PUBLIC_DEFAULT_SERVER_ID"] ?? "";

/**
 * Fetches the current server details.
 */
export async function getServer(
  serverId: string = SERVER_ID,
): Promise<PteroServer> {
  const response =
    await pteroClient.get<PteroSingleResponse<PteroServer>>(
      `/servers/${serverId}`,
    );
  return response.data.attributes;
}

/**
 * Fetches current resource usage (CPU, RAM, disk, network, uptime).
 * Validates response with Zod schema.
 */
export async function getServerResources(serverId: string = SERVER_ID) {
  const response = await pteroClient.get(
    `/servers/${serverId}/resources`,
  );
  const validated = ResourceUsageSchema.parse(
    (response.data as { attributes: unknown }).attributes,
  );
  return validated;
}

/**
 * Sends a power signal to the server.
 * @param signal - "start" | "stop" | "restart" | "kill"
 */
export async function sendPowerAction(
  signal: PowerSignal,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(`/servers/${serverId}/power`, {
    signal,
  });
}

/**
 * Fetches WebSocket credentials for the server console.
 * Validates response with Zod schema.
 */
export async function getWebSocketAuth(serverId: string = SERVER_ID) {
  const response = await pteroClient.get(
    `/servers/${serverId}/websocket`,
  );
  const validated = WebSocketAuthSchema.parse(response.data);
  return validated;
}

/**
 * Fetches server activity logs with pagination.
 */
export async function getActivityLogs(
  serverId: string = SERVER_ID,
  page = 1,
  perPage = 25,
): Promise<PteroListResponse<PteroActivityLog>> {
  const response =
    await pteroClient.get<PteroListResponse<PteroActivityLog>>(
      `/servers/${serverId}/activity`,
      { params: { page, per_page: perPage } },
    );
  return response.data;
}

/**
 * Fetches the server's startup variables.
 */
export async function getStartupVariables(
  serverId: string = SERVER_ID,
): Promise<PteroStartupVariable[]> {
  const response =
    await pteroClient.get<PteroListResponse<PteroStartupVariable>>(
      `/servers/${serverId}/startup`,
    );
  return response.data.data.map((item) => item.attributes);
}

/**
 * Updates a startup variable value.
 */
export async function updateStartupVariable(
  key: string,
  value: string,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.put(
    `/servers/${serverId}/startup/variable`,
    { key, value },
  );
}

/**
 * Sends a console command via the API (fallback when WebSocket is unavailable).
 */
export async function sendCommand(
  command: string,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(`/servers/${serverId}/command`, {
    command,
  });
}