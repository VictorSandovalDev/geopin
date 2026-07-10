"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Logo, useToast } from "@geopin/ui";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { AuthResponse } from "@geopin/types";

type Mode = "login" | "register" | "guest";

export default function AuthPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const toast = useToast();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    identifier: "",
    email: "",
    username: "",
    password: "",
  });

  // Already signed in — there's nothing to register or log into here.
  useEffect(() => {
    if (user) router.replace("/play");
  }, [user, router]);

  if (user) return null;

  async function submit() {
    setLoading(true);
    try {
      let res: AuthResponse;
      if (mode === "login") {
        res = await api.post<AuthResponse>("/auth/login", {
          identifier: form.identifier || form.email,
          password: form.password,
        });
      } else if (mode === "register") {
        res = await api.post<AuthResponse>("/auth/register", {
          email: form.email,
          username: form.username,
          password: form.password,
        });
      } else {
        res = await api.post<AuthResponse>("/auth/guest", {
          username: form.username || undefined,
        });
      }
      setAuth(res);
      toast.push({
        tone: "success",
        title: t("auth.welcome", { name: res.user.username }),
      });
      router.push("/play");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("auth.wrong");
      toast.push({ tone: "danger", title: t("auth.failed"), description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <Card glow>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Logo size={28} /> {t("auth.join")}
          </CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(["login", "register", "guest"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  "flex-1 h-9 rounded-lg text-sm capitalize transition " +
                  (mode === m
                    ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/40"
                    : "border border-border text-ink-muted hover:text-ink")
                }
              >
                {t(`auth.${m}`)}
              </button>
            ))}
          </div>

          {mode === "login" && (
            <Input
              label={t("auth.emailOrUsername")}
              value={form.identifier}
              onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
              autoFocus
            />
          )}

          {mode === "register" && (
            <>
              <Input
                label={t("auth.email")}
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoFocus
              />
              <Input
                label={t("auth.username")}
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                hint={t("auth.usernameHint")}
              />
            </>
          )}

          {mode === "guest" && (
            <Input
              label={t("auth.guestName")}
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              hint={t("auth.guestHint")}
            />
          )}

          {mode !== "guest" && (
            <Input
              label={t("auth.password")}
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              hint={mode === "register" ? t("auth.passwordHint") : undefined}
            />
          )}

          <Button loading={loading} onClick={submit} fullWidth size="lg">
            {mode === "register"
              ? t("auth.createAccount")
              : mode === "guest"
                ? t("auth.playAsGuest")
                : t("auth.signIn")}
          </Button>

          <Link
            href="/solo"
            className="text-center text-sm text-ink-muted hover:text-brand-cyan transition"
          >
            {t("solo.soloCardDesc")} →
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
