import { pteroClient } from "@/lib/api/pterodactyl";
import { BackupSchema } from "@/lib/api/types";
import type { BackupCreateParams, Backup } from "@/lib/api/types";
import type {
  PteroListResponse,
  PteroBackup,
} from "@/types/pterodactyl";

const SERVER_ID =
  process.env["NEXT_PUBLIC_DEFAULT_SERVER_ID"] ?? "";

/**
 * Lists all backups for the server.
 */
export async function listBackups(
  serverId: string = SERVER_ID,
  page = 1,
): Promise<{ backups: Backup[]; pagination: PteroListResponse<PteroBackup>["meta"] }> {
  const response =
    await pteroClient.get<PteroListResponse<PteroBackup>>(
      `/servers/${serverId}/backups`,
      { params: { page } },
    );

  const backups = response.data.data.map((item) =>
    BackupSchema.parse(item.attributes),
  );

  return { backups, pagination: response.data.meta };
}

/**
 * Creates a new backup.
 */
export async function createBackup(
  params: BackupCreateParams = {},
  serverId: string = SERVER_ID,
): Promise<Backup> {
  const response = await pteroClient.post<{
    object: string;
    attributes: unknown;
  }>(
    `/servers/${serverId}/backups`,
    {
      name: params.name ?? "",
      ignored: params.ignored ?? "",
      is_locked: params.isLocked ?? false,
    },
  );

  return BackupSchema.parse(response.data.attributes);
}

/**
 * Gets the download URL for a backup.
 */
export async function getBackupDownloadUrl(
  backupUuid: string,
  serverId: string = SERVER_ID,
): Promise<string> {
  const response = await pteroClient.get<{
    attributes: { url: string };
  }>(
    `/servers/${serverId}/backups/${backupUuid}/download`,
  );
  return response.data.attributes.url;
}

/**
 * Restores a backup. Server will restart.
 * @param truncate - If true, deletes all files before restoring.
 */
export async function restoreBackup(
  backupUuid: string,
  truncate = false,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(
    `/servers/${serverId}/backups/${backupUuid}/restore`,
    { truncate },
  );
}

/**
 * Toggles the lock state of a backup.
 */
export async function toggleBackupLock(
  backupUuid: string,
  serverId: string = SERVER_ID,
): Promise<Backup> {
  const response = await pteroClient.post<{
    object: string;
    attributes: unknown;
  }>(
    `/servers/${serverId}/backups/${backupUuid}/lock`,
  );
  return BackupSchema.parse(response.data.attributes);
}

/**
 * Permanently deletes a backup.
 */
export async function deleteBackup(
  backupUuid: string,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.delete(
    `/servers/${serverId}/backups/${backupUuid}`,
  );
}