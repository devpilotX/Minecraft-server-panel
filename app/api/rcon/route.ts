import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookies";
import {
  PTERODACTYL_BASE_URL,
  PTERODACTYL_API_KEY,
  PTERODACTYL_SERVER_ID,
} from "@/lib/config";

/**
 * POST /api/rcon
 * Sends a command to the server via Pterodactyl's command endpoint.
 * Body: { command: string }
 */
export async function POST(req: NextRequest) {
  // Auth guard
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 },
    );
  }

  try {
    const { command } = await req.json();

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "Missing 'command' in request body" },
        { status: 400 },
      );
    }

    if (command.length > 500) {
      return NextResponse.json(
        { error: "Command too long (max 500 characters)" },
        { status: 400 },
      );
    }

    const url = `${PTERODACTYL_BASE_URL}/api/client/servers/${PTERODACTYL_SERVER_ID}/command`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PTERODACTYL_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[RCON] Pterodactyl error (${res.status}):`, text);
      return NextResponse.json(
        { error: `Command failed (${res.status})` },
        { status: res.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Command sent: ${command}`,
      response: "",
    });
  } catch (error) {
    console.error("[RCON] Error:", error);
    return NextResponse.json(
      { error: "Failed to execute command" },
      { status: 500 },
    );
  }
}