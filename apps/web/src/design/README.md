# GeoPin — Design Notes

All assets here are generated inline or stored as pure SVG under `public/assets/`. No external copyrighted resources.

## Design language

* **Night gamer SaaS** — deep navy `#080B1A` base, glassmorphic panels, neon accent glow.
* **Signature gradient**: `#22E9FF → #8B5CF6 → #FF3CAC` (cyan → violet → magenta).
* **Fonts**: Space Grotesk for display / Inter for body. Load via Google Fonts or self-host.

## Tokens
See `packages/config/src/tokens.ts` and `packages/config/tailwind-preset.cjs`.

## Components
Everything lives in `packages/ui/src/*`. Re-exported from `@geopin/ui`.

* `Button`, `Card`, `Modal`, `Input`, `Badge`, `Avatar`, `Toast`
* `GamePanel`, `Lobby`, `Leaderboard`, `Timer`, `Logo`

## Assets
* `public/assets/logo/` — wordmark + mark
* `public/assets/icons/` — SVG icons
* `public/assets/badges/` — achievement medals
* `public/assets/illustrations/` — hero, empty states
* `public/assets/backgrounds/` — aurora, night
* Avatars are procedurally generated in `<Avatar seed="…"/>` — deterministic, no file needed.
