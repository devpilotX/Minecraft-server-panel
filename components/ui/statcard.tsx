import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  accentColor?: "blue" | "green" | "amber" | "red" | "purple" | "cyan";
  className?: string;
}

const ACCENT_COLORS = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconText: "text-accent-blue",
    valueBg: "",
  },
  green: {
    iconBg: "bg-green-500/10",
    iconText: "text-accent-green",
    valueBg: "",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-accent-amber",
    valueBg: "",
  },
  red: {
    iconBg: "bg-red-500/10",
    iconText: "text-accent-red",
    valueBg: "",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconText: "text-accent-purple",
    valueBg: "",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-accent-cyan",
    valueBg: "",
  },
} as const;

const TREND_STYLES = {
  up: "text-text-success",
  down: "text-text-danger",
  neutral: "text-text-tertiary",
} as const;

const TREND_ARROWS = {
  up: "↑",
  down: "↓",
  neutral: "→",
} as const;

/**
 * Stat display card for the dashboard.
 * Shows a metric value with icon, label, and optional trend indicator.
 *
 * @example
 * <StatCard
 *   label="CPU Usage"
 *   value="42.5%"
 *   icon={<Cpu className="h-4 w-4" />}
 *   accentColor="blue"
 *   trend= value: "+2.1%", direction: "up" 
 * />
 */
export function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  accentColor = "blue",
  className,
}: StatCardProps) {
  const colors = ACCENT_COLORS[accentColor];

  return (
    <div className={cn("dpx-card p-4", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-text-primary tabular-nums">
            {value}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-text-tertiary">
              {description}
            </p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                TREND_STYLES[trend.direction],
              )}
            >
              {TREND_ARROWS[trend.direction]} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
              colors.iconBg,
              colors.iconText,
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}