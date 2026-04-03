import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookies";
import {
  PTERODACTYL_BASE_URL,
  PTERODACTYL_API_KEY,
  PTERODACTYL_SERVER_ID,
} from "@/lib/config";

const buildUrl = (path: string) =>
  `${PTERODACTYL_BASE_URL}/api/client/servers/${PTERODACTYL_SERVER_ID}/${path}`;

const ROUTE_MAP: Record<string, string> = {
  network: "network/allocations",
  subusers: "users",
};

function resolveTarget(pathSegments: string[]): string {
  const joined = pathSegments.join("/");
  const first = pathSegments[0];
  if (first && ROUTE_MAP[first]) {
    const rest = pathSegments.slice(1).join("/");
    return rest ? `${ROUTE_MAP[first]}/${rest}` : ROUTE_MAP[first];
  }
  return joined;
}

async function proxy(
  req: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  // Auth guard — every proxied request must have a valid session
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const target = resolveTarget(pathSegments);
  const targetUrl = buildUrl(target);

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

function normalizePterodactylResponse(
  data: Record<string, unknown>,
  resource: string,
): unknown {
  const d = data as { object?: string; data?: unknown[]; attributes?: unknown };

  if (d.object === "list" && Array.isArray(d.data)) {
    const items = d.data.map(
      (item: Record<string, unknown>) =>
        (item as { attributes?: unknown }).attributes ?? item,
    );
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

  if (d.attributes) {
    return d.attributes;
  }

  return data;
}

// Route handlers
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path);
}