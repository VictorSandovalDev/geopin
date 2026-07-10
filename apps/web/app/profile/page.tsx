"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AVATAR_BGS,
  AVATAR_HAIR_COLORS,
  AVATAR_SHIRTS,
  AVATAR_SKINS,
  AVATAR3D_COUNTS,
  AVATAR3D_COSTUME_TOPS,
  AVATAR3D_PARTS,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  avatar3DFromSeed,
  buildAvatar3DSeed,
  useToast,
  type Avatar3DConfig,
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
const PartThumb3D = dynamic(
  () => import("@/components/PartThumb3D").then((m) => m.PartThumb3D),
  { ssr: false },
);

type Category = keyof Avatar3DConfig;

/**
 * Editor sections: color swatches for palettes, real 3D part renders for
 * garments/accessories, emoji only where there is no mesh to show (poses).
 */
const CATEGORIES: Array<{
  key: Category;
  swatches?: Array<[string, string]> | string[];
  options?: string[]; // per-option emoji (categories without part meshes)
  parts?: readonly (string | null)[]; // GLB basenames → real icons
  hasNone?: boolean; // option 0 wears nothing / keeps the original color
}> = [
  { key: "pose", options: ["🧍", "👋", "🙌", "🚶"] },
  { key: "skin", swatches: AVATAR_SKINS },
  { key: "hair", parts: AVATAR3D_PARTS.hair, hasNone: true },
  { key: "hairColor", swatches: AVATAR_HAIR_COLORS },
  { key: "emotion", parts: AVATAR3D_PARTS.emotion },
  { key: "hat", parts: AVATAR3D_PARTS.hat, hasNone: true },
  { key: "glasses", parts: AVATAR3D_PARTS.glasses, hasNone: true },
  { key: "top", parts: AVATAR3D_PARTS.top },
  { key: "topColor", swatches: AVATAR_SHIRTS, hasNone: true }, // 0 = original
  { key: "bottom", parts: AVATAR3D_PARTS.bottom },
  { key: "shoes", parts: AVATAR3D_PARTS.shoes, hasNone: true },
  { key: "extra", parts: AVATAR3D_PARTS.extra, hasNone: true },
  { key: "bg", swatches: AVATAR_BGS },
];

/** Tint an option icon so it previews with the currently selected colors. */
function partTint(key: Category, file: string, c: Avatar3DConfig): string | null {
  if (key === "hair" || file.startsWith("moustache")) {
    return AVATAR_HAIR_COLORS[c.hairColor] ?? null;
  }
  if (key === "top" && c.topColor > 0) {
    const idx = (AVATAR3D_PARTS.top as readonly string[]).indexOf(file);
    if (!AVATAR3D_COSTUME_TOPS.has(idx)) {
      return AVATAR_SHIRTS[c.topColor - 1]?.[0] ?? null;
    }
  }
  return null;
}

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

  const initial = useMemo<Avatar3DConfig>(
    () => avatar3DFromSeed(user?.avatarSeed || user?.username || "geopin"),
    [user?.avatarSeed, user?.username],
  );

  const [config, setConfig] = useState<Avatar3DConfig>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setConfig(initial), [initial]);

  useEffect(() => {
    // The persisted token can land a paint after hydration reports done —
    // re-check before bouncing so direct loads don't kick signed-in users.
    if (!hydrated || token) return;
    const id = setTimeout(() => {
      if (!useAuthStore.getState().token) router.replace("/auth");
    }, 250);
    return () => clearTimeout(id);
  }, [hydrated, token, router]);

  if (!hydrated || !token || !user) return null;

  const seed = buildAvatar3DSeed(config);
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
        (Object.keys(AVATAR3D_COUNTS) as Category[]).map((k) => [
          k,
          Math.floor(Math.random() * AVATAR3D_COUNTS[k]),
        ]),
      ) as unknown as Avatar3DConfig,
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
              {CATEGORIES.map(({ key, swatches, options, parts, hasNone }) => (
                <div key={key}>
                  <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">
                    {t(`profile.${key}`)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: AVATAR3D_COUNTS[key] }, (_, i) => {
                      const active = config[key] === i;
                      const partFile = parts?.[i] ?? null;
                      const isNone =
                        (hasNone && i === 0) || (parts ? !partFile : false);
                      return (
                        <button
                          key={i}
                          onClick={() => setConfig((c) => ({ ...c, [key]: i }))}
                          aria-pressed={active}
                          title={isNone ? t("profile.none") : undefined}
                          className={
                            "rounded-full p-0.5 transition " +
                            (active
                              ? "ring-2 ring-brand-cyan shadow-glow"
                              : "ring-1 ring-border hover:ring-brand-cyan/50")
                          }
                        >
                          {swatches && !(hasNone && i === 0) ? (
                            <span
                              className="block w-9 h-9 md:w-10 md:h-10 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  swatchColors(swatches[hasNone ? i - 1 : i]!)[0]
                                }, ${swatchColors(swatches[hasNone ? i - 1 : i]!)[1]})`,
                              }}
                            />
                          ) : swatches ? (
                            <span className="flex w-9 h-9 md:w-10 md:h-10 rounded-full items-center justify-center bg-panel/70 text-lg select-none">
                              🎨
                            </span>
                          ) : (
                            <span
                              className={
                                "flex w-9 h-9 md:w-10 md:h-10 rounded-full items-center justify-center text-lg select-none overflow-hidden " +
                                // Face features are dark meshes — they need a
                                // light chip to be visible.
                                (key === "emotion" && partFile
                                  ? "bg-[#E9D8C3]"
                                  : "bg-panel/70")
                              }
                            >
                              {partFile ? (
                                <PartThumb3D
                                  file={partFile}
                                  size={38}
                                  tint={partTint(key, partFile, config)}
                                />
                              ) : isNone ? (
                                <span className="text-ink-dim text-sm">∅</span>
                              ) : (
                                options?.[i]
                              )}
                            </span>
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
