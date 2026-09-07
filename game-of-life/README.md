# Game of Life

An RPG-style self-growth web app. You pick a few real-life skills to focus on (Social, Career, Health, Mind, Creativity), get a handful of daily quests scaled to how much effort you want to spend, and earn XP that levels those skills up. There are streaks, weekly boss quests, 15 unlockable achievements, a 10-tier "life title" progression (Wanderer → Ascended), a reflection journal for completed quests, and an admin panel for editing the quest template library.

Built on Replit. No public signup flow by design — it authenticates through Replit Auth (OpenID Connect).

> **Build log:** not written yet. This README is a placeholder description; a detailed build log (real prompts, bugs hit, fixes, design decisions) hasn't been done for this project.

## Stack

- **Frontend:** React + Vite + Tailwind + Framer Motion + Wouter + TanStack Query (in `client/`)
- **Backend:** Express + Node, TypeScript via `tsx` (in `server/`)
- **Database:** PostgreSQL via Drizzle ORM (schema in `shared/schema.ts`)
- **Auth:** Replit Auth / OpenID Connect (`server/replit_integrations/auth/`)
- **Object storage:** Google Cloud Storage wrapper for quest reflection photo uploads (`server/replit_integrations/object_storage/`)

## Layout

```
client/            React app (pages/, components/, hooks/, lib/, assets/)
server/            Express routes, storage layer, quest generator + seed
  replit_integrations/  Replit Auth + object storage integrations
shared/            Drizzle schema, shared types/constants, achievement defs
script/build.ts    Production build script
attached_assets/   Original Replit build prompts + UI screenshots (build history)
replit.md          Detailed feature/architecture/design notes from the build
quest_templates_export.csv   Snapshot of the quest template library
```

## Running it

> **Known limitation:** this won't run from a plain `git clone`. Login is wired to Replit Auth (OpenID Connect) — the server needs `REPL_ID` at startup or it throws, and there's no alternative login path. Running it off Replit means replacing the auth layer in `server/replit_integrations/auth/` and provisioning your own PostgreSQL (and, for photo uploads, object storage). Nothing here is secret; it's a platform coupling, not a config gap.

This was built to run on Replit (click Run), where the database, auth, and object storage are provisioned automatically.

```bash
npm install
npm run dev      # starts Express + Vite on PORT (default 5000)
```

`npm run dev` sets `NODE_ENV` inline (`NODE_ENV=development tsx server/index.ts`), which is bash syntax — on Windows use Git Bash, WSL, or add `cross-env` to the script.

Other scripts:

```bash
npm run build    # bundle client + server into dist/
npm start        # run the production build (NODE_ENV=production)
npm run check    # tsc typecheck
npm run db:push  # push the Drizzle schema to the database
```

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `SESSION_SECRET` | Express session signing secret |
| `PORT` | Server port (defaults to 5000) |
| `REPL_ID`, `ISSUER_URL` | Replit Auth / OpenID Connect config |
| `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS` | Object storage paths for photo uploads |
| `ADMIN_EMAIL` | Email allowed to access the `/admin` quest editor |

On startup the server seeds ~55 quest templates into the `quest_templates` table if it's empty.

## Notes

- Light mode only, intentionally — flat, bold, iOS-native minimal style, no gradients or shadows.
- `replit.md` has a much deeper breakdown of features, API endpoints, database tables, and the design system, plus a running change log from the original build.
