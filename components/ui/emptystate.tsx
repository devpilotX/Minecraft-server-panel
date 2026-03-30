import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Empty state placeholder for lists, tables, and pages.
 *
 * @example
 * <EmptyState
 *   icon={<Ghost className="h-10 w-10" />}
 *   title="No players online"
 *   description="Server is quiet right now"
 *   action={<Button size="sm">Refresh</Button>}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-text-tertiary">{icon}</div>
      )}
      <h3 className="text-sm font-semibold text-text-secondary">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-xs text-text-tertiary max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}