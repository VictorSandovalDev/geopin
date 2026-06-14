"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("nav.language")}
        title={t("nav.language")}
        className="px-2.5 h-9 rounded-lg inline-flex items-center gap-1.5 text-sm border border-border text-ink-muted hover:text-ink hover:border-brand-cyan/30 transition"
      >
        <Globe className="w-4 h-4" />
        <span className="leading-none">{current.flag}</span>
        {!compact && (
          <span className="hidden sm:inline uppercase text-xs tracking-wider">
            {current.code}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 z-50 rounded-xl border border-border bg-panel/95 backdrop-blur-xl shadow-lift overflow-hidden">
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code as Lang);
                  setOpen(false);
                }}
                className={
                  "w-full px-3 h-10 flex items-center gap-2 text-sm transition " +
                  (active
                    ? "bg-brand-cyan/10 text-brand-cyan"
                    : "text-ink-muted hover:text-ink hover:bg-white/5")
                }
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
