"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { useServerStatus } from "@/hooks/useServerStatus";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  RotateCcw,
  HardDrive,
  Terminal,
  FolderOpen,
  Download,
  Copy,
  Check,
  Zap,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  action: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

const SERVER_ADDRESS = "play.devpilotx.com:25565";

/**
 * Grid of quick action buttons for common server operations.
 */
export function QuickActions() {
  const router = useRouter();
  const { status, sendPower } = useServerStatus();
  const [restarting, setRestarting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOffline = status === "offline";

  const handleRestart = useCallback(async () => {
    setRestarting(true);
    try {
      await sendPower("restart");
      toast.success("Server restart initiated");
    } catch {
      toast.error("Failed to restart server");
    } finally {
      setRestarting(false);
    }
  }, [sendPower]);

  const handleBackup = useCallback(async () => {
    setBackingUp(true);
    try {
      const res = await fetch("/api/pterodactyl/servers/" + useAppStore.getState().server.serverId + "/backups", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Backup started!");
      } else {
        toast.error("Failed to create backup");
      }
    } catch {
      toast.error("Backup request failed");
    } finally {
      setBackingUp(false);
    }
  }, []);

  const handleCopyIP = useCallback(async () => {
    await navigator.clipboard.writeText(SERVER_ADDRESS);
    setCopied(true);
    toast.success("Server IP copied!");
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const actions: QuickAction[] = [
    {
      id: "restart",
      label: "Restart",
      description: "Graceful server restart",
      icon: restarting ? <Spinner size="sm" /> : <RotateCcw className="h-5 w-5" />,
      color: "text-accent-orange",
      bgColor: "bg-accent-orange/10",
      action: handleRestart,
      disabled: isOffline || restarting,
      loading: restarting,
    },
    {
      id: "backup",
      label: "Backup Now",
      description: "Create instant backup",
      icon: backingUp ? <Spinner size="sm" /> : <HardDrive className="h-5 w-5" />,
      color: "text-accent-green",
      bgColor: "bg-accent-green/10",
      action: handleBackup,
      disabled: isOffline || backingUp,
      loading: backingUp,
    },
    {
      id: "console",
      label: "Console",
      description: "Open server console",
      icon: <Terminal className="h-5 w-5" />,
      color: "text-accent-blue",
      bgColor: "bg-accent-blue/10",
      action: () => router.push("/console"),
    },
    {
      id: "files",
      label: "File Manager",
      description: "Browse server files",
      icon: <FolderOpen className="h-5 w-5" />,
      color: "text-accent-purple",
      bgColor: "bg-accent-purple/10",
      action: () => router.push("/files"),
    },
    {
      id: "copy-ip",
      label: "Copy IP",
      description: SERVER_ADDRESS,
      icon: copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />,
      color: "text-accent-blue",
      bgColor: "bg-accent-blue/10",
      action: handleCopyIP,
    },
  ];

  return (
    <div className="dpx-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-5 w-5 text-text-secondary" />
        <h3 className="text-base font-semibold text-text-primary">
          Quick Actions
        </h3>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={action.disabled}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-4",
              "border border-border-subtle bg-surface/50",
              "hover:bg-overlay hover:border-border-default",
              "transition-all duration-200",
              "disabled:opacity-40 disabled:pointer-events-none",
              "group",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                action.bgColor,
                action.color,
              )}
            >
              {action.icon}
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {action.label}
            </span>
            <span className="text-[10px] text-text-tertiary text-center leading-tight">
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}