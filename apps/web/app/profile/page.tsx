"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AVATAR_BGS,
  AVATAR_COUNTS,
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
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Dices } from "lucide-react";

type Category = keyof AvatarConfig;

const CATEGORIES: Category[] = ["skin", "eyes", "mouth", "hair", "bg"];

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
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
    if (!token) router.replace("/auth");
  }, [token, router]);

  if (!token || !user) return null;

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
    setConfig({
      skin: Math.floor(Math.random() * AVATAR_COUNTS.skin),
      eyes: Math.floor(Math.random() * AVATAR_COUNTS.eyes),
      mouth: Math.floor(Math.random() * AVATAR_COUNTS.mouth),
      hair: Math.floor(Math.random() * AVATAR_COUNTS.hair),
      bg: Math.floor(Math.random() * AVATAR_COUNTS.bg),
    });

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-1 flex flex-col gap-6">
      <Card glow>
        <CardHeader>
          <CardTitle>{t("profile.avatarTitle")}</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-muted mb-6">{t("profile.avatarDesc")}</p>
          <div className="grid md:grid-cols-[260px_1fr] gap-8">
            {/* Live preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="animate-float">
                <Avatar seed={seed} size={200} ring />
              </div>
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
            </div>

            {/* Pickers */}
            <div className="flex flex-col gap-5">
              {CATEGORIES.map((cat) => (
                <div key={cat}>
                  <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">
                    {t(`profile.${cat}`)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: AVATAR_COUNTS[cat] }, (_, i) => {
                      const active = config[cat] === i;
                      const preview = buildAvatarSeed({ ...config, [cat]: i });
                      return (
                        <button
                          key={i}
                          onClick={() => setConfig((c) => ({ ...c, [cat]: i }))}
                          aria-pressed={active}
                          className={
                            "rounded-full p-0.5 transition " +
                            (active
                              ? "ring-2 ring-brand-cyan shadow-glow"
                              : "ring-1 ring-border hover:ring-brand-cyan/50")
                          }
                        >
                          {cat === "skin" || cat === "bg" ? (
                            <span
                              className="block w-10 h-10 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  (cat === "skin" ? AVATAR_SKINS : AVATAR_BGS)[i]![0]
                                }, ${
                                  (cat === "skin" ? AVATAR_SKINS : AVATAR_BGS)[i]![1]
                                })`,
                              }}
                            />
                          ) : (
                            <Avatar seed={preview} size={40} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={save}
                  loading={saving}
                  disabled={!dirty}
                >
                  {t("profile.save")}
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
