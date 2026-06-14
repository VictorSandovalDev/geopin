"use client";

import * as React from "react";
import { cn } from "./utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftIcon, id, ...props }, ref) => {
    const autoId = React.useId();
    const fieldId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={fieldId}
            className="text-xs font-medium uppercase tracking-wider text-ink-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-dim">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              "w-full h-10 rounded-lg bg-deep/80 border border-border px-3 text-sm text-ink",
              "placeholder:text-ink-dim",
              "focus:outline-none focus:border-brand-cyan/70 focus:ring-2 focus:ring-brand-cyan/20",
              "transition-colors",
              leftIcon && "pl-10",
              error && "border-red-500/80 focus:ring-red-500/20",
              className,
            )}
            {...props}
          />
        </div>
        {(hint || error) && (
          <p
            className={cn(
              "text-xs",
              error ? "text-red-400" : "text-ink-dim",
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
