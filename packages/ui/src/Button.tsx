"use client";

import * as React from "react";
import { cn } from "./utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold tracking-wide " +
  "transition-all duration-150 ease-out select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-xl",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-grad-brand text-void shadow-glow hover:shadow-[0_0_48px_rgba(34,233,255,0.55)] hover:-translate-y-0.5",
  secondary:
    "bg-panel text-ink border border-border hover:border-brand-cyan/60 hover:text-brand-cyan",
  ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-panel/60",
  danger:
    "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:shadow-[0_0_32px_rgba(239,68,68,0.45)]",
  gold: "bg-grad-gold text-void shadow-[0_0_28px_rgba(255,201,60,0.45)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          base,
          sizes[size],
          variants[variant],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden
          />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = "Button";
