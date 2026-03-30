import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/validate";
import { createSession } from "@/lib/auth/cookies";

/**
 * POST /api/auth/login
 * Body: { panelUrl: string, apiKey: string }
 *
 * Validates the API key against the Pterodactyl panel,
 * creates an encrypted session cookie on success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { panelUrl, apiKey } = body as {
      panelUrl?: string;
      apiKey?: string;
    };

    // Validate inputs
    if (!panelUrl || !apiKey) {
      return NextResponse.json(
        { error: "Panel URL and API key are required." },
        { status: 400 },
      );
    }

    // Basic URL validation
    try {
      new URL(panelUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid panel URL format." },
        { status: 400 },
      );
    }

    // Validate API key against panel
    const result = await validateApiKey(panelUrl, apiKey);

    if (!result.valid || !result.user) {
      return NextResponse.json(
        { error: result.error ?? "Invalid API key." },
        { status: 401 },
      );
    }

    // Create encrypted session cookie
    await createSession({
      apiKey,
      panelUrl,
      userId: String(result.user.id),
      username: result.user.username,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        admin: result.user.admin,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}