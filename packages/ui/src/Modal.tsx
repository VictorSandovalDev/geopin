"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "./utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full rounded-2xl border border-border bg-panel shadow-lift overflow-hidden",
          sizeClass[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display text-lg text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink transition p-1 rounded"
              aria-label="close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-4 bg-deep/40 border-t border-border flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
