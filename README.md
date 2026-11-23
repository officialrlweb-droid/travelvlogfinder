# TravelVlogFinder

Discover YouTube and Instagram travel creators across **Kerala, India** matched to your destination, trip duration, and per-day INR budget (covering stay, food, and local travel).

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database:** PostgreSQL (`pg` when `DATABASE_URL` is configured, with automatic zero-config embedded PostgreSQL via `@electric-sql/pglite` for local development)
- **Search:** PostgreSQL GIN indexes + Full-Text Search (`tsvector` + `websearch_to_tsquery` + prefix matching) across creator names, places covered, `best_known_for`, and video titles/descriptions
- **Embeds:** Official YouTube (`youtube-nocookie.com/embed` + official YouTube oEmbed API) and official Instagram embeds — zero scraping

## Getting Started

```bash
npm install
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

### Using External PostgreSQL

Copy `.env.example` to `.env.local` and set `DATABASE_URL`:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/travelvlogfinder
```

Then run migrations and seed sample Kerala creators:

```bash
npm run db:migrate
npm run db:seed
```

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run typecheck` — TypeScript check
- `npm run test` — Run PostgreSQL search, budget matching, FTS, and embed tests
- `npm run db:migrate` — Apply SQL migrations in `db/migrations/`
- `npm run db:seed` — Seed 10 Kerala sample creators across Wayanad, Munnar, Varkala, and Kochi (`--reset` to re-seed)

## Project Structure

- `db/migrations/001_initial_schema.sql` — `creators`, `videos`, `profile_claims`, B-tree/GIN/FTS indexes and triggers
- `db/migrations/002_phase2_transcripts.sql` — Phase 2 scaffold (`video_transcripts`, `creator_oauth_connections`)
- `src/lib/constants/taxonomy.ts` — Shared fixed taxonomy values for destinations, styles, languages, and platforms
- `src/lib/search/query.ts` — Budget matching, full-fit-first sorting, and Postgres FTS query engine
- `src/lib/embeds/official-embed.ts` — Official YouTube/Instagram embed URL builders and oEmbed helper
- `src/lib/admin/` — Password-protected admin auth, strict taxonomy validation, RFC 4180 CSV parser, and Postgres CRUD/claims repository
- `src/app/admin/page.tsx` — Password-protected Admin MVP (`/admin`; default local password `admin123`, override via `ADMIN_PASSWORD` in `.env.local`)
- `src/lib/phase2/` — Phase 2 OAuth + Malayalam/English STT + AI extraction contracts
