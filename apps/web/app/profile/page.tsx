"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AVATAR_BGS,
  AVATAR_COUNTS,
  AVATAR_HAIR_COLORS,
  AVATAR_SHIRTS,
  AVATAR_SKINS,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  buildAvatarSeed,
  configFromLegacySeed,
  parseAvatarSeed,
  useToast,
  type AvatarConfig,
} from "@geopin/ui";
import type { UserProfile } from "@geopin/types";
import { api } from "@/lib/api";
import { useAuthStore, useAuthHydrated } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Dices } from "lucide-react";

const Avatar3D = dynamic(
  () => import("@/components/Avatar3D").then((m) => m.Avatar3D),
  { ssr: false },
);

type Category = keyof AvatarConfig;

/** Editor sections: color swatches for palettes, mini-previews otherwise. */
const CATEGORIES: Array<{
  key: Category;
  swatches?: Array<[string, string]> | string[];
}> = [
  { key: "skin", swatches: AVATAR_SKINS },
  { key: "head" },
  { key: "hair" },
  { key: "hairColor", swatches: AVATAR_HAIR_COLORS },
  { key: "eyes" },
  { key: "brows" },
  { key: "nose" },
  { key: "mouth" },
  { key: "extra" },
  { key: "shirt", swatches: AVATAR_SHIRTS },
  { key: "bg", swatches: AVATAR_BGS },
];

function swatchColors(s: [string, string] | string): [string, string] {
  return Array.isArray(s) ? s : [s, s];
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const initial = useMemo<AvatarConfig>(() => {
    const seed = user?.avatarSeed || user?.username || "geopin";
    return parseAvatarSeed(seed) ?? configFromLegacySeed(seed);
  }, [user?.avatarSeed, user?.username]);

  const [config, setConfig] = useState<AvatarConfig>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setConfig(initial), [initial]);

  useEffect(() => {
    if (hydrated && !token) router.replace("/auth");
  }, [hydrated, token, router]);

  if (!hydrated || !token || !user) return null;

  const seed = buildAvatarSeed(config);
  const dirty = seed !== user.avatarSeed;

  const save = async () => {
    setSaving(true);
    try {
      const profile = await api.patch<UserProfile>(
        "/users/me",
        { avatarSeed: seed },
        token,
      );
      updateUser({ avatarSeed: profile.avatarSeed });
      toast.push({ tone: "success", title: t("profile.saved") });
    } catch (err) {
      toast.push({
        tone: "danger",
        title: t("profile.saveFailed"),
        description: (err as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const randomize = () =>
    setConfig(
      Object.fromEntries(
        (Object.keys(AVATAR_COUNTS) as Category[]).map((k) => [
          k,
          Math.floor(Math.random() * AVATAR_COUNTS[k]),
        ]),
      ) as unknown as AvatarConfig,
    );

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-12 px-1 flex flex-col gap-6">
      <Card glow>
        <CardHeader>
          <CardTitle>{t("profile.avatarTitle")}</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-muted mb-6">{t("profile.avatarDesc")}</p>
          <div className="grid md:grid-cols-[280px_1fr] gap-8">
            {/* Live 3D preview — sticky on desktop so it follows the pickers */}
            <div className="flex flex-col items-center gap-4 md:sticky md:top-24 self-start w-full">
              <div className="w-full max-w-[280px] h-[320px] rounded-2xl overflow-hidden border border-border shadow-lift">
                <Avatar3D config={config} interactive />
              </div>
              <p className="text-[11px] text-ink-dim -mt-2">
                {t("profile.rotateHint")}
              </p>
              <div className="text-center">
                <div className="font-display font-semibold text-lg text-ink">
                  {user.username}
                </div>
                <div className="text-xs text-ink-dim">{user.email}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={randomize}
                leftIcon={<Dices className="w-4 h-4" />}
              >
                {t("profile.randomize")}
              </Button>
              <Button size="lg" onClick={save} loading={saving} disabled={!dirty} fullWidth>
                {t("profile.save")}
              </Button>
            </div>

            {/* Pickers */}
            <div className="flex flex-col gap-5">
              {CATEGORIES.map(({ key, swatches }) => (
                <div key={key}>
                  <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">
                    {t(`profile.${key}`)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: AVATAR_COUNTS[key] }, (_, i) => {
                      const active = config[key] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setConfig((c) => ({ ...c, [key]: i }))}
                          aria-pressed={active}
                          className={
                            "rounded-full p-0.5 transition " +
                            (active
                              ? "ring-2 ring-brand-cyan shadow-glow"
                              : "ring-1 ring-border hover:ring-brand-cyan/50")
                          }
                        >
                          {swatches ? (
                            <span
                              className="block w-9 h-9 md:w-10 md:h-10 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  swatchColors(swatches[i]!)[0]
                                }, ${swatchColors(swatches[i]!)[1]})`,
                              }}
                            />
                          ) : (
                            <Avatar
                              seed={buildAvatarSeed({ ...config, [key]: i })}
                              size={44}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
