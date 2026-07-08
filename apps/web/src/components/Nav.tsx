"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, Avatar, Button, Badge } from "@geopin/ui";
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Trophy, Home, Swords, MapPin } from "lucide-react";

export function Nav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const { t } = useI18n();

  // Immersive full-screen mode for the game routes.
  if (pathname === "/play" || pathname === "/solo") return null;

  const links = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/solo", label: t("solo.playSolo"), icon: MapPin },
    { href: "/play", label: t("nav.play"), icon: Swords },
    { href: "/leaderboard", label: t("nav.ranking"), icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-void/60 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} showWord />
          <Badge tone="cyan" className="hidden md:inline-flex">beta</Badge>
        </Link>

        <nav className="flex items-center gap-1 md:gap-3">
          {links.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "px-3 h-9 rounded-lg inline-flex items-center gap-2 text-sm transition " +
                  (active
                    ? "text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/30"
                    : "text-ink-muted hover:text-ink")
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Avatar seed={user.avatarSeed || user.username} size={28} />
                <span className="text-sm">{user.username}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clear}>
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button size="sm">{t("nav.signIn")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
