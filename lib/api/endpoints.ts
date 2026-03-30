/**
 * Extended API endpoint builders for Phase 12 features.
 * Append these to the existing endpoints.ts or merge into it.
 * All paths are relative to the Pterodactyl server API.
 */

import { PTERODACTYL_SERVER_ID } from "@/lib/config";

const base = `/api/client/servers/${PTERODACTYL_SERVER_ID}`;

/* ========== BACKUPS ========== */
export const backups = {
  list: () => `${base}/backups`,
  create: () => `${base}/backups`,
  detail: (uuid: string) => `${base}/backups/${uuid}`,
  download: (uuid: string) => `${base}/backups/${uuid}/download`,
  restore: (uuid: string) => `${base}/backups/${uuid}/restore`,
  delete: (uuid: string) => `${base}/backups/${uuid}`,
  lock: (uuid: string) => `${base}/backups/${uuid}/lock`,
};

/* ========== DATABASES ========== */
export const databases = {
  list: () => `${base}/databases`,
  create: () => `${base}/databases`,
  delete: (id: string) => `${base}/databases/${id}`,
  rotatePassword: (id: string) => `${base}/databases/${id}/rotate-password`,
};

/* ========== SCHEDULES ========== */
export const schedules = {
  list: () => `${base}/schedules`,
  create: () => `${base}/schedules`,
  detail: (id: string) => `${base}/schedules/${id}`,
  update: (id: string) => `${base}/schedules/${id}`,
  delete: (id: string) => `${base}/schedules/${id}`,
  tasks: {
    list: (scheduleId: string) => `${base}/schedules/${scheduleId}/tasks`,
    create: (scheduleId: string) => `${base}/schedules/${scheduleId}/tasks`,
    update: (scheduleId: string, taskId: string) => `${base}/schedules/${scheduleId}/tasks/${taskId}`,
    delete: (scheduleId: string, taskId: string) => `${base}/schedules/${scheduleId}/tasks/${taskId}`,
  },
  execute: (id: string) => `${base}/schedules/${id}/execute`,
};

/* ========== NETWORK / ALLOCATIONS ========== */
export const network = {
  list: () => `${base}/network/allocations`,
  assign: () => `${base}/network/allocations`,
  setPrimary: (id: string) => `${base}/network/allocations/${id}/primary`,
  setNote: (id: string) => `${base}/network/allocations/${id}`,
  unassign: (id: string) => `${base}/network/allocations/${id}`,
};

/* ========== SUBUSERS ========== */
export const subusers = {
  list: () => `${base}/users`,
  create: () => `${base}/users`,
  detail: (uuid: string) => `${base}/users/${uuid}`,
  update: (uuid: string) => `${base}/users/${uuid}`,
  delete: (uuid: string) => `${base}/users/${uuid}`,
};

/* ========== ACTIVITY LOG ========== */
export const activity = {
  list: () => `${base}/activity`,
};

/* ========== STARTUP / SETTINGS ========== */
export const settings = {
  rename: () => `${base}/settings/rename`,
  reinstall: () => `${base}/settings/reinstall`,
};

export const startup = {
  list: () => `${base}/startup`,
  update: () => `${base}/startup/variable`,
};