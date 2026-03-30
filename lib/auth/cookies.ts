import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Cookie-based session management for Pterodactyl API keys.
 * Uses encrypted JWT stored in an httpOnly cookie.
 */

const COOKIE_NAME = "dpx-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET env var must be at least 32 characters. " +
        "Generate one with: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  apiKey: string;
  panelUrl: string;
  userId?: string;
  username?: string;
}

/**
 * Encrypt session data into a JWT and store it in an httpOnly cookie.
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const secret = getSecretKey();

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Read and decrypt the session cookie.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    // Token expired or invalid
    return null;
  }
}

/**
 * Destroy the session by clearing the cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Check if a valid session exists (lightweight, no full decrypt).
 */
export async function hasSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!cookieStore.get(COOKIE_NAME)?.value;
}