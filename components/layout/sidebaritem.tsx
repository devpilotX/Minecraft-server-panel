"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@radix-ui/react-tooltip";

export interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  disabled?: boolean;
  collapsed?: boolean;
}

/**
 * Single sidebar navigation item.
 * Shows icon + label when expanded, icon-only with tooltip when collapsed.
 */
export function SidebarItem({
  href,
  icon,
  label,
  badge,
  disabled = false,
  collapsed = false,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const content = (
    <Link
      href={disabled ? "#" : href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-accent-blue/10 text-text-accent"
          : "text-text-secondary hover:bg-overlay hover:text-text-primary",
        disabled && "pointer-events-none opacity-40",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center",
          isActive && "text-accent-blue",
        )}
      >
        {icon}
      </span>

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && (
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                isActive
                  ? "bg-accent-blue/20 text-accent-blue"
                  : "bg-overlay text-text-tertiary",
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={12}
            className="z-50 rounded-md bg-elevated border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-primary shadow-card"
          >
            {label}
            {badge !== undefined && (
              <span className="ml-2 text-text-tertiary">({badge})</span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}