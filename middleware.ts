import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware for route protection.
 * - Unauthenticated users → redirect to /login
 * - Authenticated users on /login → redirect to /
 * - API routes and static files are excluded.
 */

const COOKIE_NAME = "dpx-session";

// Routes that don't require authentication
const PUBLIC_PATHS = ["/login"];

// Paths that should be completely ignored by middleware
const IGNORED_PREFIXES = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/icons/",
  "/images/",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static assets, etc.
  if (IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const hasToken = !!request.cookies.get(COOKIE_NAME)?.value;
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Unauthenticated user trying to access protected route
  if (!hasToken && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login page
  if (hasToken && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, images (static assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)",
  ],
};