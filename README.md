# GeoPin 🌐📍

Multiplayer geography-guessing game. GeoGuessr-style gameplay built on a production-grade stack: **Next.js + NestJS + PostgreSQL + Redis + BullMQ**, fully real-time via Socket.IO with a Redis adapter.

---

## Monorepo layout

```
geoPin/
├── apps/
│   ├── web/          Next.js 14 App Router (public site + game UI)
│   └── api/          NestJS backend (REST + WebSocket gateway + BullMQ)
├── packages/
│   ├── types/        Shared TS types (WS events, DTOs, constants)
│   ├── ui/           Design-system components (React + Tailwind)
│   └── config/       Tailwind preset + design tokens
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Tech decisions

| Layer           | Choice                                            | Why |
|-----------------|---------------------------------------------------|-----|
| Frontend        | Next.js App Router, Tailwind, Zustand             | Static hero + dynamic game UI; Zustand for the minimal client state |
| Realtime client | `socket.io-client`                                | Robust reconnection, JWT handshake |
| Backend         | NestJS 10 (modular)                               | Clean DI / module graph; easy to grow into microservices |
| Realtime server | `@nestjs/websockets` + `@socket.io/redis-adapter` | Horizontal scale — every node sees every event |
| DB              | PostgreSQL + Prisma                               | Strong types, migrations, relational leaderboards |
| Cache           | Redis (Upstash-ready)                             | Ephemeral room state, timers, Socket.IO pub/sub |
| Queue           | BullMQ                                            | Async ranking recalculation, future jobs |
| Auth            | JWT (bcrypt) + guest mode, OAuth-ready            | Session-free, easy to deploy behind a CDN |
| Maps            | Leaflet + OpenStreetMap / ESRI tiles              | No API key needed; swap for Mapillary or Google in prod |

---

## Running locally

### 1. Prereqs
* Node.js 20+, pnpm 9+
* Docker (for Postgres + Redis) — or bring your own

### 2. Install deps
```bash
pnpm install
```

### 3. Start infra
```bash
cp .env.example .env
pnpm docker:up         # starts postgres + redis (port 5432 & 6379)
```

### 4. Prepare the API
```bash
cd apps/api
cp ../../.env.example .env           # or edit as needed
pnpm prisma:push                     # create schema (dev-friendly)
pnpm prisma:seed                     # seed 30 locations
```

### 5. Start dev
From the repo root:
```bash
pnpm dev
```

This runs both **API** (http://localhost:4000/api/health) and **Web** (http://localhost:3000) in parallel via Turbo.

---

## Playing

1. Visit http://localhost:3000.
2. Click **Sign in → Play as guest** (no email required for dev).
3. Create a room — the code is shown in the lobby (copy with the button).
4. In a second browser or incognito, sign in as another guest, open `/play`, paste the code, hit **Join**.
5. Host clicks **Start game**. Rounds play in real-time, timers stay in sync.

---

## WebSocket contract

All events are defined in `packages/types/src/index.ts` under `WS_EVENTS`.

| Event             | Direction       | Payload                               |
|-------------------|-----------------|---------------------------------------|
| `join_room`       | client → server | `{ code: string \| null }`            |
| `start_game`      | client → server | `{ rounds?, roundSeconds?, difficulty? }` |
| `submit_guess`    | client → server | `{ guess: { lat, lng } }`             |
| `next_round`      | client → server | none (host only)                      |
| `chat`            | client → server | `{ text }`                            |
| `room_state`      | server → client | `RoomState` (sanitized for current round) |
| `round_started`   | server → client | `{ roundIndex, location, endsAt }`    |
| `round_ended`     | server → client | `{ roundIndex, location, guesses, leaderboard }` |
| `game_ended`      | server → client | `{ winnerId, leaderboard }`           |
| `timer_tick`      | server → client | `{ remainingMs, roundIndex }`         |

Authorization: clients send a JWT via `socket.handshake.auth.token`. The gateway validates it through `WsJwtGuard`.

---

## Scoring

Haversine distance → exponential decay:

```
distance_km = haversine(guess, actual)
score       = 5000 · exp(-distance_km / 2000)
```

5000 pts on a bull's-eye; ~1800 pts at 1000 km; ~250 pts at 6000 km. Tune `mapScaleKm` per mode (Duel uses a smaller scale).

---

## Deployment

### Web → Vercel
```bash
cd apps/web
vercel link
vercel env add NEXT_PUBLIC_API_URL         # https://api.geopin.app
vercel env add NEXT_PUBLIC_WS_URL          # wss://api.geopin.app
vercel env add NEXT_PUBLIC_MAPILLARY_TOKEN # optional
vercel deploy --prod
```

### API → Docker (Fly.io / Render / Railway / AWS)
```bash
docker build -f apps/api/Dockerfile -t geopin-api .
```

Configure these env vars:
```
DATABASE_URL=postgresql://...      # Neon / Supabase / RDS
REDIS_URL=rediss://...             # Upstash / Redis Cloud / MemoryDB
JWT_SECRET=<long random>
API_CORS_ORIGIN=https://geopin.app
```

> **Redis is required** for multi-instance deployments. Without it, rooms are bound to a single pod.

### DB
Run migrations on deploy:
```
pnpm --filter @geopin/api prisma migrate deploy
pnpm --filter @geopin/api prisma:seed   # optional — first deploy only
```

---

## Monetization hooks

* `users.isPremium` boolean on the `User` model — gate access in `AuthGuard` + frontend via `useAuthStore().user.isPremium`.
* Freemium: check a `playCount` counter in Redis before calling `start_game` (not yet wired).
* Premium tiers ideas: unlimited rooms, `DUEL` mode, pro stats, custom location packs, private invite-only rooms, team rankings.

## AI differentiators (stubs)

* `/api/ai/hint`: call an LLM (Anthropic / OpenAI / AI Gateway) with the current `Location` to generate a subtle clue.
* `/api/ai/analyze/:userId`: summarize a player's weak regions from `RoundGuess` rows.
* `/api/ai/training`: weak-region drill that prioritizes low-accuracy regions per user.

These are not implemented yet — wire them as additional Nest modules that call your provider of choice behind a backend proxy (so no keys leak to the browser).

---

## Security checklist implemented

* Helmet + strict CORS
* Global `ValidationPipe` with `class-validator`
* `@nestjs/throttler` rate limiting (20 rps burst, 200/min)
* JWT on both REST and WebSocket layers
* Backend-side scoring (client cannot fabricate distances)
* No third-party map keys exposed (synthetic / OSM by default)
* Parameterized Prisma queries (no raw SQL)

---

## What's next / TODOs

* Google OAuth wiring (Nest Passport strategy is a 30-line add).
* Duel/Team modes on top of the existing `GameMode` enum.
* Replace the synthetic viewer with Google Street View or Mapillary embed.
* BullMQ dashboard (bull-board) at `/admin/queues` behind an admin guard.
* E2E tests (Playwright) for the full round flow.
