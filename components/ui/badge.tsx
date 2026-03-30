import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-full px-2.5 py-0.5",
    "text-xs font-medium",
    "transition-colors duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        online: "bg-green-500/10 text-text-success",
        offline: "bg-gray-500/10 text-text-tertiary",
        starting: "bg-amber-500/10 text-text-warning",
        stopping: "bg-red-500/10 text-text-danger",
        crashed: "bg-red-500/15 text-text-danger",
        default: "bg-blue-500/10 text-text-accent",
        success: "bg-green-500/10 text-text-success",
        warning: "bg-amber-500/10 text-text-warning",
        danger: "bg-red-500/10 text-text-danger",
        info: "bg-blue-500/10 text-text-accent",
        purple: "bg-purple-500/10 text-purple-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const dotVariants = cva("h-1.5 w-1.5 rounded-full flex-shrink-0", {
  variants: {
    variant: {
      online: "bg-status-online shadow-[0_0_6px_rgba(34,197,94,0.4)]",
      offline: "bg-status-offline",
      starting: "bg-status-starting animate-status-pulse",
      stopping: "bg-status-stopping animate-status-pulse",
      crashed: "bg-status-crashed animate-[statusPulse_0.8s_ease-in-out_infinite]",
      default: "bg-accent-blue",
      success: "bg-accent-green",
      warning: "bg-accent-amber",
      danger: "bg-accent-red",
      info: "bg-accent-blue",
      purple: "bg-accent-purple",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

/**
 * Status badge with optional animated dot indicator.
 *
 * @example
 * <Badge variant="online" showDot>Online</Badge>
 * <Badge variant="crashed" showDot>Crashed</Badge>
 * <Badge variant="info">v1.21.4</Badge>
 */
export function Badge({
  className,
  variant,
  showDot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    >
      {showDot && (
        <span
          className={cn(dotVariants({ variant }))}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/* ========== STATUS BADGE HELPER ========== */

import { type ServerStatus } from "@/types/app";

const STATUS_VARIANT_MAP: Record<ServerStatus, BadgeProps["variant"]> = {
  online: "online",
  offline: "offline",
  starting: "starting",
  stopping: "stopping",
  crashed: "crashed",
  suspended: "warning",
  installing: "info",
};

const STATUS_LABEL_MAP: Record<ServerStatus, string> = {
  online: "Online",
  offline: "Offline",
  starting: "Starting",
  stopping: "Stopping",
  crashed: "Crashed",
  suspended: "Suspended",
  installing: "Installing",
};

export interface StatusBadgeProps {
  status: ServerStatus;
  className?: string;
}

/**
 * Convenience component that maps ServerStatus to the correct badge variant.
 *
 * @example
 * <StatusBadge status="online" />
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={STATUS_VARIANT_MAP[status]}
      showDot
      className={className}
    >
      {STATUS_LABEL_MAP[status]}
    </Badge>
  );
}