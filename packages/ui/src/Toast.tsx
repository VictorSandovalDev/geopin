"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "./utils";

type ToastTone = "info" | "success" | "warning" | "danger";

export interface Toast {
  id: string;
  tone?: ToastTone;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  push: (t: Omit<Toast, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, duration: 4000, tone: "info", ...t };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, toast.duration);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toneIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

const toneStyles: Record<ToastTone, string> = {
  info: "border-brand-cyan/40 text-brand-cyan",
  success: "border-emerald-500/40 text-emerald-400",
  warning: "border-amber-500/40 text-amber-400",
  danger: "border-red-500/40 text-red-400",
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const Icon = toneIcon[toast.tone ?? "info"];
  return (
    <div
      className={cn(
        "rounded-xl border bg-panel shadow-lift px-4 py-3 flex gap-3 items-start animate-fade-in",
        toneStyles[toast.tone ?? "info"],
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-ink">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-ink-muted mt-0.5">{toast.description}</p>
        )}
      </div>
    </div>
  );
};
