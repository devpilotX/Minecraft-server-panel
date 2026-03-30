"use client";

import { useCallback, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  Bell,
  Copy,
  Check,
  Command,
  Search,
  ChevronRight,
} from "lucide-react";

/* ========== BREADCRUMB CONFIG ========== */

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/console": "Console",
  "/files": "File Manager",
  "/players": "Players",
  "/worlds": "Worlds",
  "/config": "Configuration",
  "/addons": "Addons",
  "/backups": "Backups",
  "/databases": "Databases",
  "/schedules": "Schedules",
  "/network": "Network",
  "/subusers": "Subusers",
  "/activity": "Activity Log",
  "/monitoring": "Monitoring",
  "/settings": "Settings",
};

function getBreadcrumbs(pathname: string): Array<{ label: string; path: string }> {
  if (pathname === "/") {
    return [{ label: "Dashboard", path: "/" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; path: string }> = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = ROUTE_LABELS[currentPath] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, path: currentPath });
  }

  return crumbs;
}

/* ========== CONSTANTS ========== */

const SERVER_ADDRESS = "play.devpilotx.com:25565";

/* ========== COMPONENT ========== */

/**
 * Top navigation bar. Fixed, 52px height.
 * Contains: breadcrumb | server IP chip | Cmd+K | notifications | user avatar.
 */
export function Topbar() {
  const pathname = usePathname();
  const sidebarExpanded = useAppStore((s) => s.sidebarExpanded);
  const unreadNotifications = useAppStore((s) => s.unreadNotifications);
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);
  const [copied, setCopied] = useState(false);

  const breadcrumbs = getBreadcrumbs(pathname);

  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SERVER_ADDRESS);
      setCopied(true);
      toast.success("Server address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  }, []);

  /* Cmd+K keyboard shortcut */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-topbar items-center gap-4 px-5",
        "dpx-glass border-b border-border-subtle",
        "transition-[left] duration-300 ease-in-out",
        sidebarExpanded ? "left-sidebar-expanded" : "left-sidebar-collapsed",
      )}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-1" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.path} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0" />
            )}
            <span
              className={cn(
                "truncate",
                index === breadcrumbs.length - 1
                  ? "font-semibold text-text-primary"
                  : "text-text-tertiary",
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Server IP chip */}
      <button
        onClick={handleCopyAddress}
        className={cn(
          "hidden md:flex items-center gap-2 rounded-full px-3 py-1.5",
          "bg-surface border border-border-subtle",
          "text-xs font-mono text-text-secondary",
          "hover:border-border-default hover:text-text-primary transition-all",
        )}
        title="Click to copy server address"
      >
        <span className="dpx-status-dot dpx-status-dot-online" />
        <span>{SERVER_ADDRESS}</span>
        {copied ? (
          <Check className="h-3 w-3 text-accent-green" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>

      {/* Cmd+K search trigger */}
      <Button
        variant="ghost"
        size="sm"
        className="hidden lg:flex gap-2 text-text-tertiary"
        onClick={toggleCommandPalette}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search</span>
        <kbd className="ml-1 flex items-center gap-0.5 rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary">
          <Command className="h-2.5 w-2.5" />
          K
        </kbd>
      </Button>

      {/* Notification bell */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="relative text-text-tertiary hover:text-text-primary"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadNotifications > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[9px] font-bold text-white">
            {unreadNotifications > 9 ? "9+" : unreadNotifications}
          </span>
        )}
      </Button>

      {/* User avatar */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/20 text-xs font-bold text-accent-blue">
        D
      </div>
    </header>
  );
}