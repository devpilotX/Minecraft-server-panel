import { cn } from "@/lib/utils/cn";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: "blue" | "green" | "amber" | "red" | "purple";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const COLOR_MAP = {
  blue: "bg-accent-blue",
  green: "bg-accent-green",
  amber: "bg-accent-amber",
  red: "bg-accent-red",
  purple: "bg-accent-purple",
} as const;

const SIZE_MAP = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
} as const;

/**
 * Horizontal progress bar with smooth CSS transition.
 *
 * @example
 * <ProgressBar value={65} color="green" showValue label="RAM" />
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  color = "blue",
  size = "md",
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-medium text-text-secondary">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs font-mono text-text-tertiary">
              {percent.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-overlay",
          SIZE_MAP[size],
        )}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            COLOR_MAP[color],
          )}
          style={{ width: `${percent.toString()}%` }}
        />
      </div>
    </div>
  );
}