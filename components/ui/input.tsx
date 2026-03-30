"use client";

import { forwardRef, type InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      description,
      error,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      containerClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const resolvedType =
      isPassword && showPasswordToggle
        ? showPassword
          ? "text"
          : "password"
        : type;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-text-tertiary">{description}</p>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={resolvedType}
            ref={ref}
            className={cn(
              "flex h-9 w-full rounded-md",
              "bg-input-bg text-text-primary text-sm",
              "border border-border-default",
              "px-3 py-2",
              "placeholder:text-text-tertiary",
              "transition-colors duration-200",
              "focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              leftIcon && "pl-10",
              (rightIcon || (isPassword && showPasswordToggle)) && "pr-10",
              error && "border-accent-red focus:border-accent-red focus:ring-accent-red/30",
              className,
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${inputId ?? "input"}-error` : undefined
            }
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-secondary transition-colors"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
          {rightIcon && !(isPassword && showPasswordToggle) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId ?? "input"}-error`}
            className="text-xs text-text-danger mt-1"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };