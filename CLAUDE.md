# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Three independent top-level projects, no root-level tooling, no workspace/monorepo manager. Run every command from inside the relevant directory.

| Dir | What | Notes |
|---|---|---|
| `backend/` | Node/Express + Sequelize + Postgres REST API | Has its own `CLAUDE.md` — **read it before touching backend code** |
| `web/` | React 18 + Vite 6 SPA | The only shipped client |
| `android/` | Native Android app | **Empty** — only a `.gitkeep` and an empty README. Despite what the root README implies, nothing has been started here |

`backend/SCENESCRIBE.md` is the product spec (what the app does, in prose) — the best place to check intended behaviour before changing feature logic.

## Commands

```bash
# Whole stack — web + API + Postgres (from the repo root)
docker compose up --build    # web :5173, API :3001; WEB_PORT/API_PORT override

# Backend (from backend/)
npm run dev                  # nodemon on :3001
npm start                    # plain node
docker compose up --build    # API + Postgres 16 together (recommended)

# Web (from web/)
npm run dev                  # Vite on :5173
npm run build                # → dist/
npm run preview
```

There is **no test suite and no linter anywhere in this repo** — not in backend, web, or root. Don't invent `npm test`; verify changes by running the app.

## Architecture

```
web (React SPA, :5173)
  └─ src/api.js  ──HTTP──▶  backend Express (:3001, all routes under /api)
                              ├─ middleware/auth.js  (JWT → req.user, requireAdmin)
                              ├─ routes/*.js         (1:1 with API domains)
                              ├─ models/             (Sequelize → Postgres, UUID PKs)
                              └─ services/sentenceAnalysis.js ──▶ OpenAI GPT-4o
```

The two halves are deployed separately (web → Vercel with **Root Directory = `web`**; backend → any container host), so the HTTP contract in `backend/README.md` is the integration boundary. There is no shared code, no generated client, and no type checking across it — a field rename in a route response silently breaks the matching page.

### The cross-cutting contract

1. **Response envelope.** Every endpoint returns `{ success: true, data: {...} }` or `{ success: false, error: { code, message } }`. `web/src/api.js` depends on this shape; keep it on any new route.
2. **Auth.** JWT (7-day) in `localStorage` under `token`, plus the user object under `user`. `api.js` attaches `Authorization: Bearer` to everything except `/auth/login`, `/auth/register`, `/auth/verify`, and clears both keys on any `401` so the app drops back to the auth screen. `App.jsx` holds the signed-in user in `useState` — there is no context or store; each page fetches its own data in a `useEffect`.
3. **Postgres SSL is auto-detected** in `config/database.js` from the hostname in `DATABASE_URL` — off for `localhost`/`127.0.0.1`/`::1`/`db`/`postgres`, on for hosted databases, overridable with `DATABASE_SSL`. It used to be unconditionally required, which made the API unable to connect to any local or containerised Postgres.
4. **`VITE_API_URL` is an origin, not a base path** — no trailing slash and no `/api` suffix, because `api.js` appends `/api` itself. Vite inlines it at build time (changing it needs a rebuild, not a restart) and proxies `/api` + `/uploads` to it in dev. `VITE_PROXY_TARGET` overrides *only* the proxy target — needed in Docker, where the browser and the proxy must reach the API by different names.

### Naming mismatch: `video_*` (API) vs `scene_*` (DB)

The database and models call the entity a **Scene** (`Scene`, `scene_id`, `scene_order`, `publish_date`), but the HTTP layer exposes it as a **video** (`video_id`, `video_url`, `POST /dashboard/submit { video_id }`, `/admin/schedule`). The translation happens inside the route handlers. When adding fields, follow the convention of the layer you're in rather than unifying them — the web client is written against the `video_*` names.

### Multiple scenes per day

Up to 4 scenes (`MAX_SCENES_PER_DAY` in `routes/admin.js`) share a `publish_date`, ordered by `scene_order`. `GET /dashboard/today` returns `{ scenes: [...] }` — an array, each entry with its own `status` and submission. `Home.jsx` renders these as a carousel where every slide owns independent input state. Any change to today's-scene fetching has to stay array-shaped on both sides.

### `Scene.description` is dual-purpose

It is both the summary shown to the learner **and** the reference/ground-truth answer fed to the AI prompt (`buildPrompt()` in `sentenceAnalysis.js`). There is no separate `reference_description` column.

## Documentation drift — verify before trusting

`backend/README.md` is a detailed API reference whose endpoint bodies are **stale in specific, load-bearing ways** (its stack line and new environment section are current). Read the code, not the README, for these:

- Its Scene schema lists `reference_description`, `language`, and `submission_count`. None exist on the model.
- `POST /admin/schedule` is documented as taking `scene_description` and `reference_description`. The route destructures **`description`** (`routes/admin.js:15`); the documented names are silently dropped and the request 400s.
- The `/analyse/sentence` section describes a `USE_AI` mock flag and `ANTHROPIC_API_KEY`. Neither exists.
- It documents `feedback` as a flat `string[]`. It is actually jsonb `{ issues: string[], suggestions: string[] }`.
- It says one scene per date; the limit is four (see above).

`web/README.md` and `backend/CLAUDE.md` are accurate and current.

## Web gotchas

- `web/src/pages/Login.jsx` and `Register.jsx` are **dead code** — superseded by `AuthPage.jsx`, not imported anywhere. Don't edit them expecting an effect.
- All styling is one ~1,700-line `src/styles/global.css` driven by CSS custom properties on `:root`; restyling usually means changing a token. The auth page is isolated behind an `ap-*` class prefix.
- `web/vercel.json` rewrites all paths to `index.html`; without it, refreshing `/profile` or `/feedback/:id` 404s.
- Voice input uses the browser-native Web Speech API (Chrome/Edge only) — no library, no server-side transcription.
