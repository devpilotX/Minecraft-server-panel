import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/cookies";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and redirects to login.
 */
export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout." },
      { status: 500 },
    );
  }
}