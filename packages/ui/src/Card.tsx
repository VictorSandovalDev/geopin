"use client";

import * as React from "react";
import { cn } from "./utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-panel/80 backdrop-blur-xl shadow-card",
        glow && "shadow-glow border-brand-cyan/30",
        interactive &&
          "transition hover:border-brand-cyan/40 hover:-translate-y-0.5 hover:shadow-lift cursor-pointer",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("px-5 pt-5 pb-3 flex items-center justify-between", className)}
    {...props}
  />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn("font-display text-lg text-ink tracking-tight", className)}
    {...props}
  />
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("px-5 pb-5", className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("px-5 py-4 border-t border-border flex items-center gap-2", className)}
    {...props}
  />
);
