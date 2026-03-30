"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-blue-500/90 text-white",
          "hover:bg-blue-500 hover:shadow-glow-blue",
        ].join(" "),
        success: [
          "bg-green-500/90 text-white",
          "hover:bg-green-500 hover:shadow-glow-green",
        ].join(" "),
        danger: [
          "bg-red-500/90 text-white",
          "hover:bg-red-500 hover:shadow-[0_0_24px_rgba(239,68,68,0.15)]",
        ].join(" "),
        warning: [
          "bg-amber-500/90 text-white",
          "hover:bg-amber-500 hover:shadow-[0_0_24px_rgba(245,158,11,0.15)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-text-secondary",
          "border border-border-default",
          "hover:bg-overlay hover:text-text-primary",
        ].join(" "),
        outline: [
          "bg-transparent text-text-primary",
          "border border-border-strong",
          "hover:bg-overlay hover:border-accent-blue",
        ].join(" "),
        link: [
          "bg-transparent text-text-accent underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        default: "h-9 px-4 text-sm rounded-md",
        lg: "h-10 px-5 text-sm rounded-md",
        icon: "h-9 w-9 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };