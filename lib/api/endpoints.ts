/**
 * Extended API endpoint builders.
 * All paths are relative to the Pterodactyl server API.
 * Uses getter to avoid reading process.env at module init on client.
 */

function getBase(): string {
  const serverId =
    typeof window !== "undefined"
      ? ""
      : (process.env["NEXT_PUBLIC_DEFAULT_SERVER_ID"] ?? "");
  return `/api/client/servers/${serverId}`;
}

export const backups = {
  list: () => `${getBase()}/backups`,
  create: () => `${getBase()}/backups`,
  detail: (uuid: string) => `${getBase()}/backups/${uuid}`,
  download: (uuid: string) => `${getBase()}/backups/${uuid}/download`,
  restore: (uuid: string) => `${getBase()}/backups/${uuid}/restore`,
  delete: (uuid: string) => `${getBase()}/backups/${uuid}`,
  lock: (uuid: string) => `${getBase()}/backups/${uuid}/lock`,
};

export const databases = {
  list: () => `${getBase()}/databases`,
  create: () => `${getBase()}/databases`,
  delete: (id: string) => `${getBase()}/databases/${id}`,
  rotatePassword: (id: string) =>
    `${getBase()}/databases/${id}/rotate-password`,
};

export const schedules = {
  list: () => `${getBase()}/schedules`,
  create: () => `${getBase()}/schedules`,
  detail: (id: string) => `${getBase()}/schedules/${id}`,
  update: (id: string) => `${getBase()}/schedules/${id}`,
  delete: (id: string) => `${getBase()}/schedules/${id}`,
  tasks: {
    list: (scheduleId: string) =>
      `${getBase()}/schedules/${scheduleId}/tasks`,
    create: (scheduleId: string) =>
      `${getBase()}/schedules/${scheduleId}/tasks`,
    update: (scheduleId: string, taskId: string) =>
      `${getBase()}/schedules/${scheduleId}/tasks/${taskId}`,
    delete: (scheduleId: string, taskId: string) =>
      `${getBase()}/schedules/${scheduleId}/tasks/${taskId}`,
  },
  execute: (id: string) => `${getBase()}/schedules/${id}/execute`,
};

export const network = {
  list: () => `${getBase()}/network/allocations`,
  assign: () => `${getBase()}/network/allocations`,
  setPrimary: (id: string) =>
    `${getBase()}/network/allocations/${id}/primary`,
  setNote: (id: string) => `${getBase()}/network/allocations/${id}`,
  unassign: (id: string) => `${getBase()}/network/allocations/${id}`,
};

export const subusers = {
  list: () => `${getBase()}/users`,
  create: () => `${getBase()}/users`,
  detail: (uuid: string) => `${getBase()}/users/${uuid}`,
  update: (uuid: string) => `${getBase()}/users/${uuid}`,
  delete: (uuid: string) => `${getBase()}/users/${uuid}`,
};

export const activity = {
  list: () => `${getBase()}/activity`,
};

export const settings = {
  rename: () => `${getBase()}/settings/rename`,
  reinstall: () => `${getBase()}/settings/reinstall`,
};

export const startup = {
  list: () => `${getBase()}/startup`,
  update: () => `${getBase()}/startup/variable`,
};