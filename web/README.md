# 🎬📝 SceneScribe — Web App

The React web client for **SceneScribe**, an app for learning English by describing short real-life video clips and getting instant feedback on how you wrote it.

For what the app does and why, see the [main README](../README.md). This file covers how the web app is put together.

---

## ⚛️ Tech stack

| | |
|---|---|
| **React 18** | UI, function components and hooks only — no class components |
| **Vite 6** | Dev server and production bundler |
| **React Router 6** | Client-side routing, with route guards for private and admin pages |
| **Plain CSS** | One global stylesheet driven by CSS-variable design tokens. No Tailwind, no CSS modules, no component library |
| **Web Speech API** | Browser-native speech-to-text for voice input (Chrome and Edge) |
| **`fetch`** | Thin wrapper in `src/api.js`. No Axios, no data-fetching library, no global state store |

The whole app is plain JavaScript with JSX — there's no TypeScript, and no test or lint setup.

---

## 🚀 Getting started

```bash
npm install
cp .env.example .env      # set VITE_API_URL
npm run dev               # http://localhost:5173
```

This expects an API already running on `VITE_API_URL`. To bring up the web app,
the API and Postgres together instead, use the root compose file:

```bash
cd .. && docker compose up --build     # web on :5173, API on :3001
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `:5173` with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output locally |

### Environment

| Variable | Value |
|---|---|
| `VITE_API_URL` | The API origin — **no trailing slash, no `/api` suffix** |
| `VITE_PROXY_TARGET` | Optional. Overrides *only* the dev-server proxy target, leaving the client's base URL alone |

`src/api.js` appends `/api` itself, so including it here would double up the path. Vite inlines the value at **build time**, which means changing it needs a rebuild, not just a restart. In development, Vite proxies API calls to this origin so there are no CORS issues locally.

`VITE_PROXY_TARGET` exists because that single variable normally does two jobs — the base URL the browser calls *and* the origin the dev proxy forwards to. Those coincide locally but not in Docker, where the browser must reach the API through `localhost:5173` while the proxy itself has to dial the `api` container by name. The root compose file therefore leaves `VITE_API_URL` unset (so the client calls a relative `/api`) and sets `VITE_PROXY_TARGET` instead. You will not need it outside Docker.

---

## 📂 Folder structure

```
web/
├── src/
│   ├── pages/
│   │   ├── AuthPage.jsx        # Sign in + registration, all in one component
│   │   ├── Home.jsx            # Daily scene carousel — watch, describe, get feedback
│   │   ├── Feedback.jsx        # Full feedback detail for one past submission
│   │   ├── Profile.jsx         # Stats, streaks, paginated history
│   │   ├── Admin.jsx           # Scene scheduling (admin only)
│   │   ├── Login.jsx           # ⚠️ legacy — replaced by AuthPage, not imported
│   │   └── Register.jsx        # ⚠️ legacy — replaced by AuthPage, not imported
│   ├── components/
│   │   └── Navbar.jsx          # Top nav, only rendered when signed in
│   ├── styles/
│   │   └── global.css          # Every style in the app, ~1,700 lines
│   ├── api.js                  # fetch wrapper — auth header, error handling
│   ├── App.jsx                 # Routing, auth state, route guards
│   └── main.jsx                # Entry point — mounts <App /> into #root
├── index.html                  # HTML shell, loads Syne + DM Sans from Google Fonts
├── Dockerfile                  # Dev-server image used by the root compose file
├── vite.config.js              # Dev server and API proxy config
├── vercel.json                 # SPA rewrite — all routes served from index.html
├── .env.example                # Copy to .env
└── package.json
```

There's no `public/` directory — the app ships no static assets, and fonts load over the network from `index.html`.

---

## 🧭 Routes

| Route | Screen | Access |
|---|---|---|
| `/` | Auth page when signed out, daily scenes when signed in | Public / private |
| `/login`, `/register` | The same auth page with that tab preselected | Public |
| `/profile` | Stats, streaks and history | Signed in |
| `/feedback/:id` | Detail view of a past submission | Signed in |
| `/admin` | Scene scheduling | Admin only |

Anything unmatched redirects to `/`.

---

## 🧩 Components

### `App.jsx`
Sets up routing and owns the only piece of app-wide state: the signed-in user. Auth is a token plus a user object in `localStorage`, read once on mount. `PrivateRoute` redirects signed-out visitors to `/`, and `AdminRoute` additionally checks the admin flag. There is no context provider or store — each page fetches its own data in a `useEffect`.

### `api.js`
A single `fetch` wrapper exposing `get` / `post` / `patch` / `delete`. It attaches the bearer token to every request except the public auth calls, unwraps the standard response envelope, and turns error responses into readable messages. If any request comes back `401`, it clears the stored credentials so the app falls back to the auth screen instead of silently failing.

### `AuthPage.jsx`
One component covering the entire entry flow through four internal steps: **register** → **verify** → **success** → **sign in**, with an animated tab toggle between signing in and signing up. Includes a live password strength meter (four segments, scoring length, uppercase, numbers and symbols) and a 6-box verification code input with auto-advance, backspace navigation, paste support, and a resend cooldown.

### `Home.jsx`
The main screen. Loads every scene published for today and presents them as a sliding carousel with progress dots showing which are done. Each scene holds its own independent input state, so switching between them never loses what you've typed.

Before submitting: an embedded YouTube player, a textarea, and a microphone button that streams live transcription into the text field via the Web Speech API. Switching scenes stops any active recording.

After submitting: an animated SVG score ring, a grammar / vocabulary / clarity breakdown, colour-coded blocks for the improved and ideal sentences, separate issues and suggestions lists, and the reference description for comparison.

Internal helpers: `ScoreRing`, `ScoreCell`, `SentenceBlock`, and `SceneSlide` — a single carousel slide that renders either the input state or the feedback state.

### `Feedback.jsx`
Full detail for any past submission, reached by tapping a history entry on the profile. Renders the same feedback layout as the post-submission view on Home.

### `Profile.jsx`
Avatar with initials, average and highest score, current and longest streak, total scenes completed, and a paginated history list where each row links through to its feedback.

### `Admin.jsx`
Admin-only. A form to schedule a clip for a date — title, URL, scene description, difficulty and notes — plus the full schedule list with inline editing and deletion. The form covers a subset of what the API accepts: vocabulary, grammar patterns, scene ordering and the premium flag have no UI fields yet.

### `Navbar.jsx`
Fixed top bar, rendered only when signed in. Logo, active-state nav pills, an admin badge and link for admins, and sign out.

---

## 🎨 Styling

Everything lives in `src/styles/global.css`, organised in labelled sections: design tokens, typography, layout, navbar, cards, inputs, buttons, loading and empty states, video block, feedback card, profile, history, admin panel, auth page, and responsive breakpoints at the end.

Colours, spacing and radii are CSS custom properties on `:root`, so restyling generally means changing a token rather than hunting through rules. The auth page keeps its own `ap-*` class prefix to stay isolated from everything else.

---

## ▲ Deploying (Vercel)

The app lives in the `web/` subdirectory, so set the Vercel project's **Root Directory to `web`**. Vite is then auto-detected — build `npm run build`, output `dist`.

`vercel.json` rewrites every path to `index.html`, which client-side routing needs: without it, refreshing or directly opening `/profile` or `/feedback/:id` returns a 404.

Remember to set `VITE_API_URL` in the project's environment variables, and redeploy after changing it.
