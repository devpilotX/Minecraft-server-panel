import { NextRequest, NextResponse } from "next/server";
import {
  PTERODACTYL_BASE_URL,
  PTERODACTYL_API_KEY,
  PTERODACTYL_SERVER_ID,
} from "@/lib/config";

/**
 * Catch-all proxy: /api/pterodactyl/[...path]
 * Forwards to: PTERODACTYL_BASE_URL/api/client/servers/{SERVER_ID}/...
 */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, await safeBody(req));
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, await safeBody(req));
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, await safeBody(req));
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

async function safeBody(req: NextRequest): Promise<string | undefined> {
  try {
    const text = await req.text();
    return text || undefined;
  } catch {
    return undefined;
  }
}

async function proxy(
  req: NextRequest,
  pathSegments: string[],
  body?: string,
): Promise<NextResponse> {
  const subPath = pathSegments.join("/");
  const targetUrl = `${PTERODACTYL_BASE_URL}/api/client/servers/${PTERODACTYL_SERVER_ID}/${subPath}`;

  // Forward query params
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const fullUrl = qs ? `${targetUrl}?${qs}` : targetUrl;

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${PTERODACTYL_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const res = await fetch(fullUrl, {
      method: req.method,
      headers,
      body: body && req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
    });

    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error("[Pterodactyl Proxy]", error);
    return NextResponse.json(
      { error: "Failed to reach Pterodactyl panel" },
      { status: 502 },
    );
  }
}