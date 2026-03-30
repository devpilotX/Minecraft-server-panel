import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/* ========== CARD ========== */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, noPadding = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "dpx-card",
        interactive && "dpx-card-interactive cursor-pointer",
        !noPadding && "p-5",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/* ========== CARD HEADER ========== */

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-3 pb-4",
        className,
      )}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {action}
    </div>
  ),
);
CardHeader.displayName = "CardHeader";

/* ========== CARD TITLE ========== */

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-sm font-semibold text-text-primary",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/* ========== CARD DESCRIPTION ========== */

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-text-tertiary mt-0.5", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* ========== CARD CONTENT ========== */

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

/* ========== CARD FOOTER ========== */

const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3 pt-4 border-t border-border-subtle",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};