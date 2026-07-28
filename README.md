# 🎬📝 SceneScribe — Client Platforms

Client applications for **SceneScribe**, an AI-powered English learning app.

Every day a learner watches a short YouTube clip, describes what's happening in English — typed or spoken — and gets instant AI feedback: grammar, vocabulary and clarity scores, an overall score out of 10, specific issues and suggestions, their own sentence corrected, and an "ideal" example sentence to learn from. Streaks and submission history are tracked per learner.

This repository holds the **client apps only**. The API, database and AI scoring live in a separate repository:

> **Backend:** [`devanshupathak9/scenescribe-backend`](https://github.com/devanshupathak9/scenescribe-backend)

---

## 📂 Repository layout

| Path | What it is | Status |
|---|---|---|
| [`web/`](./web) | React + Vite single-page app. The production web client. | ✅ Active |
| `android/` | Placeholder for the future native Android app. | 🚧 Not started |

Everything for the web app — `package.json`, `src/`, `vite.config.js`, `vercel.json`, its own `README` and `.env.example` — lives **inside `web/`**. There is no build at the repository root.

```
scenescribe/
├── web/                  # React SPA (see web/README.md)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json       # SPA rewrite — all routes → index.html
├── android/              # empty placeholder
├── .gitignore
└── README.md             # you are here
```

---

## 🚀 Quick start (web)

```bash
cd web
npm install
cp .env.example .env      # then point VITE_API_URL at your backend
npm run dev               # http://localhost:5173
```

The backend must be running separately (default `http://localhost:3001`). In development Vite proxies `/api` to whatever `VITE_API_URL` is set to, so there are no CORS issues locally.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `:5173` with hot reload |
| `npm run build` | Production build into `web/dist/` |
| `npm run preview` | Serve the built output locally |

There is no test suite or linter configured — verification is manual against a running backend.

---

## 🔑 Environment

One variable, set in `web/.env` (and in the Vercel dashboard for deploys):

| Variable | Value |
|---|---|
| `VITE_API_URL` | Backend **origin only** — no trailing slash, no `/api` suffix |

```bash
# Local
VITE_API_URL=http://localhost:3001

# Production
VITE_API_URL=https://your-backend.up.railway.app
```

`web/src/api.js` appends `/api` itself, so adding it here would produce `/api/api/...`. Vite only exposes variables prefixed with `VITE_` to client code, and the value is **baked into the bundle at build time** — changing it in Vercel requires a redeploy, not just a restart.

---

## ▲ Deploying the web app (Vercel)

Because the app is not at the repository root, the Vercel project must be pointed at the subdirectory:

| Setting | Value |
|---|---|
| **Root Directory** | `web` |
| Framework Preset | Vite |
| Build Command | `npm run build` *(default)* |
| Output Directory | `dist` *(default)* |
| Install Command | `npm install` *(default)* |
| Environment Variable | `VITE_API_URL` = your deployed backend origin |

With the root directory set to `web`, Vercel picks up `web/vercel.json`, whose rewrite sends every path to `index.html` — required for client-side routing, otherwise deep links like `/profile` and `/feedback/:id` 404 on refresh.

---

## 🧭 App routes

| Route | Screen | Access |
|---|---|---|
| `/` | Auth page when signed out, daily dashboard when signed in | Public / private |
| `/login`, `/register` | Same auth page with that tab preselected | Public |
| `/profile` | Stats, streaks and submission history | Signed in |
| `/feedback/:id` | Full feedback detail for a past submission | Signed in |
| `/admin` | Scene scheduling and platform analytics | Admin only |

Auth is a JWT held in `localStorage`; a `401` from any endpoint clears it and drops the user back to the auth page.

---

## ⚛️ Tech stack

- **React 18** with **Vite 6**
- **React Router 6** for routing
- Plain **CSS** — one global stylesheet with CSS-variable design tokens
- **Web Speech API** for voice input (Chrome/Edge)
- REST integration with the SceneScribe backend

See [`web/README.md`](./web/README.md) for the detailed frontend breakdown.
