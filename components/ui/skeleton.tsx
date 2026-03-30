import { cn } from "@/lib/utils/cn";

export interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton loading placeholder.
 * Use width/height via className.
 *
 * @example
 * <Skeleton className="h-4 w-32" />
 * <Skeleton className="h-12 w-full rounded-lg" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-overlay",
        className,
      )}
      aria-hidden="true"
    />
  );
}