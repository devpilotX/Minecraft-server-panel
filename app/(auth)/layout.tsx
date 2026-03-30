import { type ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Auth layout. Full-page, no sidebar or topbar.
 * Used for /login route.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      {children}
    </div>
  );
}