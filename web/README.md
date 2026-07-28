# 🎬📝 SceneScribe Frontend

This repository contains the **frontend application** for SceneScribe — an AI-powered English learning platform where users practice English by describing real-life video scenarios.

---

## 🌐 About SceneScribe

SceneScribe helps users improve English fluency by:

- Watching short real-life scenes  
- Thinking in English  
- Describing what they see naturally  

---

## 🖥️ Frontend Features

- **Unified Auth Page** — Single-page login and registration with a tab toggle, 3-step registration flow (details → OTP verify → success), and sign-in — all at the root `/` route
- **Password Strength Meter** — 4-segment colour bar (red → amber → green) that scores length, uppercase, numbers, and special characters in real time
- **OTP Verification** — 6-box code input with auto-advance on type, backspace navigation, paste support, resend with cooldown timer, and a disabled submit state until all digits are filled
- **YouTube Scene Player** — Embedded iframe video with a 16:9 aspect ratio for the daily scene, shrinks to a compact view after submission
- **Text & Voice Input** — Textarea for typed descriptions plus a microphone button for speech-to-text via the Web Speech API; live recording indicator shown while capturing
- **AI Feedback Display** — Animated score ring, grammar/vocabulary/clarity breakdown grid, colour-coded sentence blocks (the learner's own text, the improved rewrite, the ideal sentence, and the admin reference), plus separate Issues and Suggestions lists
- **Profile & Stats** — Avatar with initials, average score, highest score, current and longest streak, total scenes completed, and a paginated submission history list with score badges
- **Admin Panel** — Schedule a YouTube clip for any date with title, scene description (which doubles as the reference answer used for AI scoring), difficulty and notes; edit and delete entries from the schedule list
- **Streak tracking** — Visual streak counter updated on each daily submission, longest streak record maintained server-side
- **Responsive layout** — Two-column auth layout collapses to single column on mobile; left branding panel hidden on small screens; all grids and cards adapt with flexbox/grid

---

## 🧩 Key UI Modules

- **`src/pages/AuthPage.jsx`** — Unified auth component serving `/`, `/login`, and `/register`. Manages four internal states: Register (collects first name, last name, email, username, password), Verify (6-digit OTP boxes), Success (green confirmation screen), and Sign In. Includes a step indicator, animated pill-shaped tab toggle, and password strength bar.

- **`src/pages/Home.jsx`** — Daily dashboard. Fetches **all** of today's scenes via `GET /api/dashboard/today`, which returns an array of up to four, and renders them as a swipeable carousel with per-scene progress dots. Each scene keeps its own input state (keyed by `video_id`) and its own status. Before submission: YouTube iframe, textarea, and microphone button. After submission: the full feedback card with score ring, breakdown grid, improved/ideal sentences, issues and suggestions, plus the admin reference.

- **`src/pages/Feedback.jsx`** — Detailed view of any past submission loaded from `GET /api/profile/history/:id`. Renders the same feedback layout as the post-submission state on Home, reached by clicking a history entry on the Profile page.

- **`src/pages/Profile.jsx`** — User profile screen. Loads `GET /api/profile/me` for stats and `GET /api/profile/history` for paginated submission history. Displays avatar (initials), stat cells (avg score, highest score), a streak card (current + longest), a scenes-completed bar chart, and a history list where each row links to Feedback.

- **`src/pages/Admin.jsx`** — Admin-only panel (guarded by the `is_admin` flag). Form to schedule a clip with date, URL, title, scene description, difficulty and optional notes via `POST /api/admin/schedule`. Lists all scheduled scenes from `GET /api/admin/schedule` with inline edit (PATCH) and delete actions. Note the form covers a subset of the API — `vocabularies`, `grammars`, `scene_order` and `is_premium` have no UI fields yet and must be sent to the endpoint directly.

- **`src/components/Navbar.jsx`** — Fixed top navigation bar shown only when a user is logged in. Contains the SceneScribe logo, nav links (Home, Profile, Admin if applicable), and a logout button that clears localStorage and resets app state.

- **`src/api.js`** — Central fetch wrapper. Attaches the Bearer token from localStorage to all non-public requests. Parses error envelopes from the API standard format and throws human-readable messages. Skips token injection for `/auth/login`, `/auth/register`, and `/auth/verify`.

- **`src/styles/global.css`** — Single stylesheet covering the entire app. Organised into: design tokens (CSS variables), typography, layout, navbar, cards, inputs, buttons, loading/empty states, spinner, video block, home input card, result/feedback card, sentences, suggestions, corrections, profile, history list, admin panel, auth page v2 (`ap-*` namespace), and responsive breakpoints.

---

## ⚛️ Tech Stack

- **React 18** + **Vite 6** — plain JavaScript (JSX), no TypeScript
- **React Router 6** — client-side routing
- **Plain CSS** — a single `src/styles/global.css` with CSS-variable design tokens. No Tailwind, no CSS modules, no UI library
- **Web Speech API** — browser-native speech-to-text for voice input (Chrome/Edge only; the mic button warns on unsupported browsers)
- **`fetch`** — REST integration with the backend via a small wrapper in `src/api.js`. No Axios, no React Query

---

## 🚀 Getting Started

```bash
npm install
cp .env.example .env      # point VITE_API_URL at your backend origin
npm run dev               # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `:5173`, proxies `/api` → `VITE_API_URL` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output locally |

**`VITE_API_URL` is the backend origin only** — no trailing slash and no `/api` suffix, because `src/api.js` appends `/api` itself. It is inlined into the bundle at build time, so changing it requires a rebuild.

No test suite or linter is configured; verify manually against a running backend.

---

## ▲ Deploying (Vercel)

This app lives in the `web/` subdirectory of the repository, so set the Vercel project's **Root Directory to `web`**. Vercel then auto-detects Vite (build `npm run build`, output `dist`) and picks up `vercel.json`, whose rewrite routes every path to `index.html` — without it, refreshing `/profile` or `/feedback/:id` returns a 404. Add `VITE_API_URL` as an environment variable pointing at the deployed backend.

---

## 📂 Project Structure

```
web/
├── src/
│   ├── pages/
│   │   ├── AuthPage.jsx        # Unified login + register (4 steps: register, verify, success, sign-in)
│   │   ├── Home.jsx            # Daily scene carousel — video, input, and post-submission feedback
│   │   ├── Feedback.jsx        # Detailed view of a single past submission
│   │   ├── Profile.jsx         # User stats, streak, and paginated submission history
│   │   ├── Admin.jsx           # Admin panel — schedule, edit, and delete daily scenes
│   │   ├── Login.jsx           # ⚠️ legacy — superseded by AuthPage.jsx, not imported
│   │   └── Register.jsx        # ⚠️ legacy — superseded by AuthPage.jsx, not imported
│   ├── components/
│   │   └── Navbar.jsx          # Fixed top nav bar (visible only when authenticated)
│   ├── styles/
│   │   └── global.css          # Single global stylesheet — design tokens, layout, all component styles
│   ├── api.js                  # Fetch wrapper — auth header injection, error parsing, standard envelope handling
│   ├── App.jsx                 # Root component — routing, auth state, login/logout handlers
│   └── main.jsx                # Vite entry point — mounts <App /> into #root
├── index.html                  # HTML shell with Google Fonts (Syne, DM Sans) loaded via <link>
├── vite.config.js              # Vite config — dev proxy reads VITE_API_URL from .env
├── vercel.json                 # Vercel SPA rewrite rule — all routes served from index.html
├── .env.example                # Template — copy to .env
└── .env                        # Local environment variables (gitignored) — VITE_API_URL
```

There is no `public/` directory — the app ships no static assets; fonts load from Google Fonts via `index.html`.
