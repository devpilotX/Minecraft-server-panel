"use client";

import { cn } from "@/lib/utils/cn";
import { Home, ChevronRight } from "lucide-react";

interface FileBreadcrumbProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

/**
 * Breadcrumb navigation for the file manager.
 * Clickable path segments to navigate the directory tree.
 */
export function FileBreadcrumb({ currentPath, onNavigate }: FileBreadcrumbProps) {
  const segments = currentPath.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto no-scrollbar" aria-label="File path">
      {/* Root */}
      <button
        onClick={() => onNavigate("/")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-text-secondary",
          "hover:bg-overlay hover:text-text-primary transition-colors",
          segments.length === 0 && "font-semibold text-text-primary",
        )}
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </button>

      {/* Segments */}
      {segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0" />
            <button
              onClick={() => onNavigate(path)}
              className={cn(
                "rounded-md px-2 py-1 truncate max-w-40 transition-colors",
                isLast
                  ? "font-semibold text-text-primary"
                  : "text-text-secondary hover:bg-overlay hover:text-text-primary",
              )}
            >
              {segment}
            </button>
          </span>
        );
      })}
    </nav>
  );
}