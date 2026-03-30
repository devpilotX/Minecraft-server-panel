"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { SidebarItem } from "./SidebarItem";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Terminal,
  FolderOpen,
  Globe,
  Users,
  Settings as SettingsIcon,
  Puzzle,
  Database,
  HardDrive,
  Network,
  Clock,
  Shield,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Rocket,
  LogOut,
  Sliders,
  CalendarClock,
} from "lucide-react";

/* ========== NAV CONFIG ========== */

interface NavSection {
  title: string;
  items: Array<{
    href: string;
    icon: React.ReactNode;
    label: string;
  }>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Core",
    items: [
      { href: "/", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { href: "/console", icon: <Terminal className="h-4 w-4" />, label: "Console" },
      { href: "/files", icon: <FolderOpen className="h-4 w-4" />, label: "File Manager" },
    ],
  },
  {
    title: "Minecraft",
    items: [
      { href: "/worlds", icon: <Globe className="h-4 w-4" />, label: "Worlds" },
      { href: "/players", icon: <Users className="h-4 w-4" />, label: "Players" },
      { href: "/config", icon: <Sliders className="h-4 w-4" />, label: "Config" },
      { href: "/addons", icon: <Puzzle className="h-4 w-4" />, label: "Addons" },
    ],
  },
  {
    title: "Server",
    items: [
      { href: "/backups", icon: <HardDrive className="h-4 w-4" />, label: "Backups" },
      { href: "/databases", icon: <Database className="h-4 w-4" />, label: "Databases" },
      { href: "/schedules", icon: <CalendarClock className="h-4 w-4" />, label: "Schedules" },
      { href: "/network", icon: <Network className="h-4 w-4" />, label: "Network" },
      { href: "/subusers", icon: <Shield className="h-4 w-4" />, label: "Subusers" },
      { href: "/activity", icon: <Clock className="h-4 w-4" />, label: "Activity" },
      { href: "/monitoring", icon: <BarChart3 className="h-4 w-4" />, label: "Monitoring" },
      { href: "/settings", icon: <SettingsIcon className="h-4 w-4" />, label: "Settings" },
    ],
  },
];

/* ========== COMPONENT ========== */

/**
 * Main sidebar navigation.
 * 220px expanded, 60px collapsed. Glass background with blur.
 * Persists collapse state to localStorage via Zustand.
 */
export function Sidebar() {
  const sidebarExpanded = useAppStore((s) => s.sidebarExpanded);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const serverName = useAppStore((s) => s.server.serverName);
  const serverStatus = useAppStore((s) => s.server.serverStatus);

  const handleToggle = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col",
        "dpx-glass border-r border-border-subtle",
        "transition-[width] duration-300 ease-in-out",
        sidebarExpanded ? "w-sidebar-expanded" : "w-sidebar-collapsed",
      )}
    >
      {/* Logo + Server */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border-subtle">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
          <Rocket className="h-4 w-4 text-accent-blue" />
        </div>
        {sidebarExpanded && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">
              DevPilotX
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge status={serverStatus} />
            </div>
          </div>
        )}
      </div>

      {/* Server name (expanded only) */}
      {sidebarExpanded && (
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Server
          </p>
          <p className="text-sm font-semibold text-text-primary mt-0.5 truncate">
            {serverName}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-2 py-3 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {sidebarExpanded && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  collapsed={!sidebarExpanded}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: collapse toggle + logout */}
      <div className="border-t border-border-subtle px-2 py-3 space-y-1">
        {sidebarExpanded && (
          <SidebarItem
            href="/login"
            icon={<LogOut className="h-4 w-4" />}
            label="Logout"
            collapsed={false}
          />
        )}
        <button
          onClick={handleToggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary",
            "hover:bg-overlay hover:text-text-secondary transition-colors",
            !sidebarExpanded && "justify-center px-2",
          )}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarExpanded ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}