import {
  AVATAR_BGS,
  AVATAR_HAIR_COLORS,
  AVATAR_SHIRTS,
  AVATAR_SKINS,
} from "./avatarPalettes";
import { parseAvatarSeed, type AvatarConfig } from "./Avatar";

/**
 * Avatar v3 — GLB-based character ("Creative Character" pack).
 * The character is assembled from a bare body plus swappable part meshes,
 * all sharing one skeleton rest pose and one texture atlas, so composing
 * is just "load body + selected parts". Colors are material tints.
 */
export interface Avatar3DConfig {
  skin: number; // body tint — AVATAR_SKINS
  hair: number; // index into AVATAR3D_PARTS.hair (0 = none)
  hairColor: number; // AVATAR_HAIR_COLORS
  hat: number; // 0 = none
  glasses: number; // 0 = none
  top: number; // t-shirt / jackets / full costumes
  topColor: number; // AVATAR_SHIRTS tint
  bottom: number; // pants / shorts
  shoes: number;
  extra: number; // moustache, headphones, clown nose… (0 = none)
  emotion: number; // face expression
  bg: number; // AVATAR_BGS
  pose: number; // AVATAR3D_POSES — stance used on the hero globe / previews
}

/** Procedural stances (bone offsets live in the web renderer). */
export const AVATAR3D_POSES = ["idle", "wave", "victory", "walk"] as const;

/**
 * Part slot → list of GLB basenames under /avatar3d/ (null = nothing worn).
 * Order matters: indexes are persisted inside avatarSeed.
 */
export const AVATAR3D_PARTS = {
  hair: [null, "hairstyle_male_010", "hairstyle_male_012"],
  hat: [null, "hat_010", "hat_049", "hat_057"],
  glasses: [null, "glasses_004", "glasses_006"],
  top: [
    "t-shirt_009",
    "outwear_029",
    "outwear_036",
    "costume_6_001",
    "costume_10_001",
  ],
  bottom: ["pants_010", "pants_014", "shorts_003"],
  shoes: ["shoe_sneakers_009", "shoe_slippers_002", "shoe_slippers_005", null],
  extra: [
    null,
    "moustache_001",
    "moustache_002",
    "headphones_002",
    "clown_nose_001",
    "pacifier_001",
    "gloves_006",
    "gloves_014",
    "socks_008",
  ],
  emotion: [
    "male_emotion_usual_001",
    "male_emotion_happy_002",
    "male_emotion_angry_003",
  ],
} as const;

export const AVATAR3D_BODY = "body_010";

/** Full costumes replace the bottom garment (they cover the whole torso+legs). */
export const AVATAR3D_COSTUME_TOPS = new Set([3, 4]);

export const AVATAR3D_COUNTS = {
  skin: AVATAR_SKINS.length,
  hair: AVATAR3D_PARTS.hair.length,
  hairColor: AVATAR_HAIR_COLORS.length,
  hat: AVATAR3D_PARTS.hat.length,
  glasses: AVATAR3D_PARTS.glasses.length,
  top: AVATAR3D_PARTS.top.length,
  topColor: AVATAR_SHIRTS.length + 1, // 0 = the garment's original texture
  bottom: AVATAR3D_PARTS.bottom.length,
  shoes: AVATAR3D_PARTS.shoes.length,
  extra: AVATAR3D_PARTS.extra.length,
  emotion: AVATAR3D_PARTS.emotion.length,
  bg: AVATAR_BGS.length,
  pose: AVATAR3D_POSES.length,
} as const;

const ORDER3: Array<keyof Avatar3DConfig> = [
  "skin",
  "hair",
  "hairColor",
  "hat",
  "glasses",
  "top",
  "topColor",
  "bottom",
  "shoes",
  "extra",
  "emotion",
  "bg",
  "pose",
];

export const AVATAR3D_CATEGORIES = ORDER3;

export function buildAvatar3DSeed(c: Avatar3DConfig): string {
  return `av3:${ORDER3.map((k) => c[k]).join(".")}`;
}

export function parseAvatar3DSeed(seed: string): Avatar3DConfig | null {
  if (!seed.startsWith("av3:")) return null;
  const parts = seed.slice(4).split(".").map((n) => Number.parseInt(n, 10));
  if (parts.length < 12 || parts.some((n) => Number.isNaN(n) || n < 0)) {
    return null;
  }
  const cfg = {} as Avatar3DConfig;
  ORDER3.forEach((k, i) => {
    // Fields appended after launch (e.g. pose) default to 0 in older seeds.
    cfg[k] = (parts[i] ?? 0) % AVATAR3D_COUNTS[k];
  });
  return cfg;
}

/** Map an old Mii config onto the closest 3D look. */
export function avatar3DFromMii(c: AvatarConfig): Avatar3DConfig {
  return {
    skin: c.skin % AVATAR3D_COUNTS.skin,
    hair: c.hair === 0 ? 0 : 1 + (c.hair % (AVATAR3D_COUNTS.hair - 1)),
    hairColor: c.hairColor % AVATAR3D_COUNTS.hairColor,
    hat: 0,
    glasses: 0,
    top: c.shirt % 3, // keep everyone in regular clothes, not costumes
    topColor: c.shirt % AVATAR3D_COUNTS.topColor,
    bottom: c.head % AVATAR3D_COUNTS.bottom,
    shoes: c.eyes % 3,
    extra: 0,
    emotion: c.mouth % AVATAR3D_COUNTS.emotion,
    bg: c.bg % AVATAR3D_COUNTS.bg,
    pose: 0,
  };
}

function hash3(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic 3D config from ANY seed — av3, av2/av1 (mapped) or legacy hash. */
export function avatar3DFromSeed(seed: string): Avatar3DConfig {
  const v3 = parseAvatar3DSeed(seed);
  if (v3) return v3;
  const mii = parseAvatarSeed(seed);
  if (mii) return avatar3DFromMii(mii);
  const h = hash3(seed);
  const pick = (shift: number, k: keyof typeof AVATAR3D_COUNTS) =>
    (h >> shift) % AVATAR3D_COUNTS[k];
  return {
    skin: pick(0, "skin"),
    hair: pick(3, "hair"),
    hairColor: pick(5, "hairColor"),
    hat: h % 4 === 0 ? pick(8, "hat") : 0,
    glasses: h % 5 === 0 ? pick(10, "glasses") : 0,
    top: pick(12, "top") % 3,
    topColor: pick(15, "topColor"),
    bottom: pick(19, "bottom"),
    shoes: pick(21, "shoes") % 3,
    extra: h % 3 === 0 ? pick(23, "extra") : 0,
    emotion: pick(26, "emotion"),
    bg: pick(28, "bg"),
    pose: 0,
  };
}

/** GLB basenames a config wears, in draw order (body first). */
export function avatar3DPartFiles(c: Avatar3DConfig): string[] {
  const files: Array<string | null | undefined> = [
    AVATAR3D_BODY,
    AVATAR3D_PARTS.emotion[c.emotion],
    AVATAR3D_PARTS.hair[c.hair],
    AVATAR3D_PARTS.hat[c.hat],
    AVATAR3D_PARTS.glasses[c.glasses],
    AVATAR3D_PARTS.top[c.top],
    AVATAR3D_COSTUME_TOPS.has(c.top) ? null : AVATAR3D_PARTS.bottom[c.bottom],
    AVATAR3D_PARTS.shoes[c.shoes],
    AVATAR3D_PARTS.extra[c.extra],
  ];
  return files.filter((f): f is string => Boolean(f));
}
