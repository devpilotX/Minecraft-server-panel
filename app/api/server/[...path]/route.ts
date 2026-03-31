import { NextRequest, NextResponse } from "next/server";
import {
  PTERODACTYL_BASE_URL,
  PTERODACTYL_API_KEY,
  PTERODACTYL_SERVER_ID,
} from "@/lib/config";

/**
 * Catch-all server API proxy: /api/server/[...path]
 * Maps to: Pterodactyl /api/client/servers/{id}/{path}
 *
 * Examples:
 *   /api/server/backups        → GET .../backups
 *   /api/server/files?path=/   → GET .../files/list?directory=/
 *   /api/server/databases      → GET .../databases
 *   /api/server/schedules      → GET .../schedules
 *   /api/server/network        → GET .../network/allocations
 *   /api/server/subusers       → GET .../users
 *   /api/server/activity       → GET .../activity
 *   /api/server/startup        → GET .../startup
 */

const base = (path: string) =>
  `${PTERODACTYL_BASE_URL}/api/client/servers/${PTERODACTYL_SERVER_ID}/${path}`;

// Route mapping: custom paths → Pterodactyl paths
const ROUTE_MAP: Record<string, string> = {
  network: "network/allocations",
  subusers: "users",
};

function resolveTarget(pathSegments: string[]): string {
  const joined = pathSegments.join("/");
  // Check if the first segment has a special mapping
  const first = pathSegments[0];
  if (ROUTE_MAP[first]) {
    const rest = pathSegments.slice(1).join("/");
    return rest ? `${ROUTE_MAP[first]}/${rest}` : ROUTE_MAP[first];
  }
  return joined;
}

async function proxy(
  req: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const target = resolveTarget(pathSegments);
  const targetUrl = base(target);

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const fullUrl = qs ? `${targetUrl}?${qs}` : targetUrl;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.text();
    } catch {
      body = undefined;
    }
  }
import { getSession } from "@/lib/auth/cookies";

async function proxy(
  req: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  // ADD THIS BLOCK:
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ... rest of existing code
}
  try {
    const res = await fetch(fullUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${PTERODACTYL_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    });

    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await res.json();

      // Normalize Pterodactyl's { data: [...] } → friendlier shape
      const normalized = normalizePterodactylResponse(data, pathSegments[0]);
      return NextResponse.json(normalized, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error(`[Server Proxy] ${req.method} /${target}`, error);
    return NextResponse.json(
      { error: "Failed to reach Pterodactyl panel" },
      { status: 502 },
    );
  }
}

/**
 * Normalizes Pterodactyl's nested { object, data, attributes } response
 * into a flat, frontend-friendly shape.
 */
function normalizePterodactylResponse(data: any, resource: string): any {
  // List responses: { object: "list", data: [{ attributes: {...} }] }
  if (data?.object === "list" && Array.isArray(data?.data)) {
    const items = data.data.map((item: any) => item.attributes ?? item);
    // Map to resource-specific keys
    const keyMap: Record<string, string> = {
      backups: "backups",
      databases: "databases",
      schedules: "schedules",
      files: "files",
      network: "allocations",
      subusers: "subusers",
      activity: "activities",
      startup: "variables",
    };
    return { [keyMap[resource] ?? resource]: items };
  }

  // Single object: { object: "...", attributes: {...} }
  if (data?.attributes) {
    return data.attributes;
  }

  return data;
}

// AFTER:
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}