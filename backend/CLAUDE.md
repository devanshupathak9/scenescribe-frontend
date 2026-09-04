# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start

# With Docker (recommended — spins up Postgres + API together)
docker compose up --build

# Or the whole stack including the web app, from the repo root
cd .. && docker compose up --build
```

No test suite is configured. There is no linter config.

### Required environment variables

Copy `.env.example` to `.env` and set at minimum:
- `DATABASE_URL` — Postgres connection string (e.g. `postgres://postgres:password@localhost:5432/scenescribe`)
- `JWT_SECRET` — any strong secret string
- `OPENAI_API_KEY` — for AI feedback on submissions (GPT-4o via `services/sentenceAnalysis.js`)

`DATABASE_SSL` is optional: `config/database.js` auto-detects from the hostname in `DATABASE_URL` (SSL off for `localhost`/`127.0.0.1`/`::1`/`db`/`postgres`, on for hosted databases). Set it to `true`/`false` only to override. SSL was previously hard-required, which made the API unable to talk to its own compose Postgres — don't reintroduce that.

SMTP variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are optional locally — when absent, OTPs are printed to the server console instead of being emailed.

`process.env.TZ` is force-set to `'UTC'` at the top of `src/index.js` (and in the Docker image/compose file) so all `Date`/`DATEONLY` comparisons — especially the "today" lookups in `dashboard.js` — are consistent regardless of host timezone.

## Architecture

**Entry point:** `src/index.js` — starts Express, runs `sequelize.sync({ alter: true })` on boot (auto-migrates schema), then seeds the two hardcoded accounts.

**Request flow:**
```
Request → Express → middleware/auth.js → routes/*.js → models/ → Postgres
                                                      → services/email.js (auth only)
                                                      → services/sentenceAnalysis.js → OpenAI (dashboard/submit + analyse only)
```

**Route files map 1:1 to API domains:**
- `routes/auth.js` — registration (2-step OTP), login
- `routes/dashboard.js` — today's scene(s) + AI-scored submission
- `routes/profile.js` — stats + submission history
- `routes/admin.js` — scene scheduling CRUD + analytics (admin-only)
- `routes/analyse.js` — re-scores an existing submission's text against its scene (used to re-run/override AI scoring outside the normal submit flow)

**Models** are defined in `src/models/` and associations are wired in `src/models/index.js`. All models use UUID primary keys. Sequelize `{ alter: true }` sync means schema changes take effect on next restart without manual migrations.

**Auth middleware** (`src/middleware/auth.js`):
- `authenticate` — verifies JWT, loads `req.user`; applied to all dashboard/profile/admin/analyse routes
- `requireAdmin` — checks `req.user.is_admin`; applied to all admin routes

## Key patterns and gotchas

**Two-step registration:** `POST /auth/register` only takes `{ email }` and creates a pending user (`is_registered: false`). The user row has `null` username and password until `POST /auth/verify` completes. Code that accesses `user.username` must handle this.

**Password hashing:** The `User` model's `beforeCreate` hook only hashes `password_hash` if one is already set (so it's a no-op for step-1 registration, which creates the row with no password). Whenever *you* set an already-hashed value directly (`seedAdmin()`, `seedDefaultUser()`, the verify route), pass `{ hooks: false }` to avoid double-hashing.

**Multiple scenes per day:** A single `publish_date` can have up to `MAX_SCENES_PER_DAY` (4, defined in `routes/admin.js`) scenes, ordered by `Scene.scene_order`. `GET /dashboard/today` returns `{ scenes: [...] }` — an array, one entry per scene for today, each with its own `status` (`pending`/`submitted`) and submission if completed. It 404s with `NO_SCENE` only when *zero* scenes exist for today; there is no fallback to previous days. `GET /admin/schedule/:date` mirrors this shape for a given date.

**AI feedback fallback:** `analyseSentence()` in `services/sentenceAnalysis.js` wraps the OpenAI call in a try/catch; on any failure it calls the local `fallback()` helper, which returns fixed scores of 6 (grammar/vocabulary/clarity/overall) so the submission always resolves as `completed` rather than `failed`. Both `routes/dashboard.js` (`/submit`) and `routes/analyse.js` (`/sentence`) go through this same function, so the fallback behavior is shared.

**Submission AI fields:** beyond the numeric scores, a completed `Submission` carries `feedback` (jsonb `{ issues: string[], suggestions: string[] }`), `ai_response`/`improved_ai_response` (corrected rewrite of the student's sentence — currently duplicated across two columns), and `ideal_sentence` (best-possible answer derived from the scene's `description` and hints). All four come straight from the OpenAI structured-output response in `sentenceAnalysis.js`.

**Seed accounts:** On every startup, `src/index.js` upserts two fixed accounts and resets their passwords:
- Admin: `xyz@gmail.com` / `xyz@12345` (`is_admin: true`)
- Default user: `abc@gmail.com` / `abc@12345` (`is_admin: false`)

This is intentional so both accounts are always in a known state.

**Response envelope:** All responses follow `{ success: true, data: {...} }` or `{ success: false, error: { code: "...", message: "..." } }`. Maintain this consistently.

**AI model:** All LLM calls use GPT-4o via the `openai` npm package (`services/sentenceAnalysis.js`), not Anthropic/Claude despite the product name and some stale mentions in `README.md`. Structured-output mode (`json_schema` + `strict: true`) guarantees the response matches `SCHEMA` — no markdown stripping needed.

**`Scene.description` is dual-purpose:** it's both the scene summary shown to the student and the reference/"admin" answer fed into the AI prompt as ground truth (see `buildPrompt()` in `sentenceAnalysis.js`). There is no separate `reference_description` column — `README.md`'s schema table is out of date on this and a few other Scene columns (no `language`, `submission_count`, or `reference_description` fields exist on the model).
