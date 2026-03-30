import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";

/**
 * Base URL for the client-side Pterodactyl API proxy.
 * All browser requests go through /api/pterodactyl/* which proxies
 * to the real panel server-side (API key never exposed to browser).
 */
const CLIENT_PROXY_BASE = "/api/pterodactyl";

/**
 * Creates a typed axios instance for client-side Pterodactyl API calls.
 * Routes through the Next.js API proxy at /api/pterodactyl/[...path].
 *
 * Features:
 * - Automatic JSON content type
 * - Request/response interceptors for logging
 * - Consistent error shape
 */
export function createPteroClient(): AxiosInstance {
  const client = axios.create({
    baseURL: CLIENT_PROXY_BASE,
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => config,
    (error: AxiosError) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

/**
 * Singleton Pterodactyl API client for use across the app.
 * Import this in hooks and components:
 *
 * @example
 * import { pteroClient } from "@/lib/api/pterodactyl";
 * const res = await pteroClient.get("/servers/{id}");
 */
export const pteroClient = createPteroClient();

/**
 * Server-side only: creates an axios instance that calls the
 * Pterodactyl panel directly with the API key.
 * Used ONLY inside API routes (app/api/*).
 */
export function createServerSidePteroClient(): AxiosInstance {
  const panelUrl = process.env["NEXT_PUBLIC_PTERODACTYL_URL"];
  const apiKey = process.env["PTERODACTYL_API_KEY"];

  if (!panelUrl || !apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_PTERODACTYL_URL or PTERODACTYL_API_KEY env vars",
    );
  }

  const client = axios.create({
    baseURL: `${panelUrl}/api/client`,
    timeout: 30_000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return client;
}

/* ========== ERROR HELPERS ========== */

export interface ApiErrorResponse {
  status: number;
  message: string;
  code: string;
}

/**
 * Extracts a user-friendly error message from an Axios error.
 * Maps common HTTP status codes to DevPilotX error messages.
 */
export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred.";
  }

  const axiosError = error as AxiosError<{ errors?: Array<{ detail: string }> }>;
  const status = axiosError.response?.status;

  switch (status) {
    case 401:
      return "Session expired. Please log in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "A conflict occurred. The resource may have been modified.";
    case 429:
      return "Rate limited. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
      return "Panel server error. Please try again later.";
    default:
      break;
  }

  const detail = axiosError.response?.data?.errors?.[0]?.detail;
  if (detail) return detail;

  if (axiosError.code === "ECONNABORTED") {
    return "Request timed out. Check your connection.";
  }

  if (!axiosError.response) {
    return "Cannot reach panel. Check your connection.";
  }

  return "An unexpected error occurred.";
}

/**
 * Type guard to check if an error is an Axios error with a specific status.
 */
export function isApiError(
  error: unknown,
  status: number,
): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}