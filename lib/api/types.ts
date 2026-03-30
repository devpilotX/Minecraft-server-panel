import { z } from "zod";

/**
 * Shared API helper types and Zod validation schemas.
 * All API responses are validated with Zod before use.
 */

/* ========== GENERIC RESPONSE WRAPPERS ========== */

export const PaginationSchema = z.object({
  total: z.number(),
  count: z.number(),
  per_page: z.number(),
  current_page: z.number(),
  total_pages: z.number(),
  links: z.record(z.string()),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/* ========== POWER ACTION ========== */

export const PowerSignalSchema = z.enum(["start", "stop", "restart", "kill"]);
export type PowerSignal = z.infer<typeof PowerSignalSchema>;

/* ========== WEBSOCKET AUTH ========== */

export const WebSocketAuthSchema = z.object({
  data: z.object({
    token: z.string(),
    socket: z.string(),
  }),
});

export type WebSocketAuth = z.infer<typeof WebSocketAuthSchema>;

/* ========== FILE LIST ========== */

export const FileObjectSchema = z.object({
  name: z.string(),
  mode: z.string(),
  mode_bits: z.string(),
  size: z.number(),
  is_file: z.boolean(),
  is_symlink: z.boolean(),
  mimetype: z.string(),
  created_at: z.string(),
  modified_at: z.string(),
});

export type FileObject = z.infer<typeof FileObjectSchema>;

export const FileListResponseSchema = z.object({
  object: z.literal("list"),
  data: z.array(
    z.object({
      object: z.literal("file_object"),
      attributes: FileObjectSchema,
    }),
  ),
});

/* ========== BACKUP ========== */

export const BackupSchema = z.object({
  uuid: z.string(),
  is_successful: z.boolean(),
  is_locked: z.boolean(),
  name: z.string(),
  ignored_files: z.array(z.string()),
  checksum: z.string().nullable(),
  bytes: z.number(),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});

export type Backup = z.infer<typeof BackupSchema>;

/* ========== SERVER RESOURCES ========== */

export const ResourceUsageSchema = z.object({
  current_state: z.enum(["running", "starting", "stopping", "offline"]),
  is_suspended: z.boolean(),
  resources: z.object({
    memory_bytes: z.number(),
    cpu_absolute: z.number(),
    disk_bytes: z.number(),
    network_rx_bytes: z.number(),
    network_tx_bytes: z.number(),
    uptime: z.number(),
  }),
});

export type ResourceUsage = z.infer<typeof ResourceUsageSchema>;

/* ========== ACCOUNT ========== */

export const AccountSchema = z.object({
  id: z.number(),
  admin: z.boolean(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  language: z.string(),
});

export type Account = z.infer<typeof AccountSchema>;

/* ========== QUERY PARAMS ========== */

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface FileListParams {
  directory: string;
}

export interface FileWriteParams {
  path: string;
  content: string;
}

export interface FileRenameParams {
  root: string;
  files: Array<{ from: string; to: string }>;
}

export interface FileDeleteParams {
  root: string;
  files: string[];
}

export interface FileCompressParams {
  root: string;
  files: string[];
}

export interface FileDecompressParams {
  root: string;
  file: string;
}

export interface CreateFolderParams {
  root: string;
  name: string;
}

export interface BackupCreateParams {
  name?: string;
  ignored?: string;
  isLocked?: boolean;
}

/* ========== RCON ========== */

export const RconRequestSchema = z.object({
  command: z.string().min(1).max(500),
});

export type RconRequest = z.infer<typeof RconRequestSchema>;

export interface RconResponse {
  response: string;
}