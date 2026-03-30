/**
 * Pterodactyl Client API response types.
 * All types mirror the Pterodactyl Panel v1.x client API.
 * No `any` types | all fields explicitly typed.
 */

/* ========== PAGINATION ========== */

export interface PteroMeta {
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    links: Record<string, string>;
  };
}

export interface PteroListResponse<T> {
  object: "list";
  data: Array<{ object: string; attributes: T }>;
  meta: PteroMeta;
}

export interface PteroSingleResponse<T> {
  object: string;
  attributes: T;
}

/* ========== ACCOUNT ========== */

export interface PteroAccount {
  id: number;
  admin: boolean;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
}

/* ========== SERVER ========== */

export interface PteroServerLimits {
  memory: number;
  swap: number;
  disk: number;
  io: number;
  cpu: number;
  threads: string | null;
  oom_disabled: boolean;
}

export interface PteroServerFeatureLimits {
  databases: number;
  allocations: number;
  backups: number;
}

export interface PteroAllocation {
  id: number;
  ip: string;
  ip_alias: string | null;
  port: number;
  notes: string | null;
  is_default: boolean;
}

export interface PteroServer {
  server_owner: boolean;
  identifier: string;
  internal_id: number;
  uuid: string;
  name: string;
  node: string;
  is_node_under_maintenance: boolean;
  sftp_details: {
    ip: string;
    port: number;
  };
  description: string;
  limits: PteroServerLimits;
  invocation: string;
  docker_image: string;
  egg_features: string[] | null;
  feature_limits: PteroServerFeatureLimits;
  status: string | null;
  is_suspended: boolean;
  is_installing: boolean;
  is_transferring: boolean;
  relationships?: {
    allocations?: PteroListResponse<PteroAllocation>;
  };
}

/* ========== RESOURCES / STATS ========== */

export interface PteroResourceUsage {
  current_state: ServerPowerState;
  is_suspended: boolean;
  resources: {
    memory_bytes: number;
    cpu_absolute: number;
    disk_bytes: number;
    network_rx_bytes: number;
    network_tx_bytes: number;
    uptime: number;
  };
}

export type ServerPowerState =
  | "running"
  | "starting"
  | "stopping"
  | "offline";

export type PowerSignal = "start" | "stop" | "restart" | "kill";

/* ========== WEBSOCKET ========== */

export interface PteroWebSocketAuth {
  data: {
    token: string;
    socket: string;
  };
}

export type WebSocketEvent =
  | "auth success"
  | "console output"
  | "stats"
  | "status"
  | "token expiring"
  | "token expired"
  | "jwt error"
  | "daemon error";

export interface WebSocketMessage {
  event: WebSocketEvent;
  args?: string[];
}

export interface WebSocketStats {
  memory_bytes: number;
  memory_limit_bytes: number;
  cpu_absolute: number;
  network: {
    rx_bytes: number;
    tx_bytes: number;
  };
  state: ServerPowerState;
  disk_bytes: number;
  uptime: number;
}

/* ========== FILES ========== */

export interface PteroFile {
  name: string;
  mode: string;
  mode_bits: string;
  size: number;
  is_file: boolean;
  is_symlink: boolean;
  mimetype: string;
  created_at: string;
  modified_at: string;
}

export interface PteroFileUploadUrl {
  url: string;
}

/* ========== BACKUPS ========== */

export interface PteroBackup {
  uuid: string;
  is_successful: boolean;
  is_locked: boolean;
  name: string;
  ignored_files: string[];
  checksum: string | null;
  bytes: number;
  created_at: string;
  completed_at: string | null;
}

/* ========== DATABASES ========== */

export interface PteroDatabase {
  id: string;
  host: {
    address: string;
    port: number;
  };
  name: string;
  username: string;
  connections_from: string;
  max_connections: number;
  relationships?: {
    password?: PteroSingleResponse<{ password: string }>;
  };
}

/* ========== SCHEDULES ========== */

export interface PteroSchedule {
  id: number;
  name: string;
  cron: {
    day_of_week: string;
    day_of_month: string;
    month: string;
    hour: string;
    minute: string;
  };
  is_active: boolean;
  is_processing: boolean;
  only_when_online: boolean;
  last_run_at: string | null;
  next_run_at: string;
  created_at: string;
  updated_at: string;
  relationships?: {
    tasks?: PteroListResponse<PteroScheduleTask>;
  };
}

export interface PteroScheduleTask {
  id: number;
  sequence_id: number;
  action: "command" | "power" | "backup";
  payload: string;
  time_offset: number;
  is_queued: boolean;
  continue_on_failure: boolean;
  created_at: string;
  updated_at: string;
}

/* ========== NETWORK ========== */

export interface PteroNetworkAllocation {
  id: number;
  ip: string;
  ip_alias: string | null;
  port: number;
  notes: string | null;
  is_default: boolean;
}

/* ========== SUBUSERS ========== */

export interface PteroSubuser {
  uuid: string;
  username: string;
  email: string;
  image: string;
  "2fa_enabled": boolean;
  created_at: string;
  permissions: string[];
}

/* ========== ACTIVITY ========== */

export interface PteroActivityLog {
  id: string;
  batch: string | null;
  event: string;
  is_api: boolean;
  ip: string | null;
  description: string | null;
  properties: Record<string, unknown>;
  has_additional_metadata: boolean;
  timestamp: string;
}

/* ========== STARTUP ========== */

export interface PteroStartupVariable {
  name: string;
  description: string;
  env_variable: string;
  default_value: string;
  server_value: string;
  is_editable: boolean;
  rules: string;
}