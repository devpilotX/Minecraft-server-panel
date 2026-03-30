"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils/cn";

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Dashboard shell layout.
 * Wraps all authenticated pages with sidebar + topbar.
 * Content area is scrollable; sidebar and topbar are fixed.
 * Supports Framer Motion page transitions.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const sidebarExpanded = useAppStore((s) => s.sidebarExpanded);

  return (
    <div className="min-h-screen bg-base">
      {/* Sidebar */}
      <Sidebar />

      {/* Topbar */}
      <Topbar />

      {/* Main content area */}
      <main
        className={cn(
          "pt-topbar min-h-screen transition-[margin-left] duration-300 ease-in-out",
          sidebarExpanded ? "ml-sidebar-expanded" : "ml-sidebar-collapsed",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial= opacity: 0, y: 8 
            animate= opacity: 1, y: 0 
            exit= opacity: 0, y: -8 
            transition= duration: 0.2, ease: "easeOut" 
            className="p-5 lg:p-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}