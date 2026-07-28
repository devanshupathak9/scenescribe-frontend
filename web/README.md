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
- **AI Feedback Display** — Score ring, grammar/vocabulary/clarity breakdown grid, three colour-coded sentence blocks (user / AI suggested / admin reference), vocabulary chip row, grammar fix chip row, and a corrections list with original → corrected → explanation
- **Profile & Stats** — Avatar with initials, average score, highest score, current and longest streak, total scenes completed, and a paginated submission history list with score badges
- **Admin Panel** — Schedule a YouTube video for any future date with scene description, reference answer, and notes; edit and delete scheduled entries from an upcoming schedule list
- **Streak tracking** — Visual streak counter updated on each daily submission, longest streak record maintained server-side
- **Responsive layout** — Two-column auth layout collapses to single column on mobile; left branding panel hidden on small screens; all grids and cards adapt with flexbox/grid

---

## 🧩 Key UI Modules

- **`src/pages/AuthPage.jsx`** — Unified auth component serving `/`, `/login`, and `/register`. Manages four internal states: Register (collects first name, last name, email, username, password), Verify (6-digit OTP boxes), Success (green confirmation screen), and Sign In. Includes a step indicator, animated pill-shaped tab toggle, and password strength bar.

- **`src/pages/Home.jsx`** — Daily dashboard. Fetches today's scene via `GET /api/dashboard/today`. Before submission: shows the YouTube iframe, scene description, textarea, and microphone button. After submission: switches to a compact video, displays the full feedback card with score ring, breakdown grid, sentence comparison, vocabulary/grammar chips, and corrections.

- **`src/pages/Feedback.jsx`** — Detailed view of any past submission loaded from `GET /api/dashboard/result/:id`. Renders the same feedback layout as the post-submission state on Home, reached by clicking a history entry on the Profile page.

- **`src/pages/Profile.jsx`** — User profile screen. Loads `GET /api/profile/me` for stats and `GET /api/profile/history` for paginated submission history. Displays avatar (initials), stat cells (avg score, highest score), a streak card (current + longest), a scenes-completed bar chart, and a history list where each row links to Feedback.

- **`src/pages/Admin.jsx`** — Admin-only panel (guarded by `is_admin` flag). Form to schedule a new YouTube video with date, URL, scene description, reference answer, and optional notes via `POST /api/admin/schedule`. Lists all scheduled videos from `GET /api/admin/schedule` with inline edit (PATCH) and delete actions.

- **`src/components/Navbar.jsx`** — Fixed top navigation bar shown only when a user is logged in. Contains the SceneScribe logo, nav links (Home, Profile, Admin if applicable), and a logout button that clears localStorage and resets app state.

- **`src/api.js`** — Central fetch wrapper. Attaches the Bearer token from localStorage to all non-public requests. Parses error envelopes from the API standard format and throws human-readable messages. Skips token injection for `/auth/login`, `/auth/register`, and `/auth/verify`.

- **`src/styles/global.css`** — Single stylesheet covering the entire app. Organised into: design tokens (CSS variables), typography, layout, navbar, cards, inputs, buttons, loading/empty states, spinner, video block, home input card, result/feedback card, sentences, suggestions, corrections, profile, history list, admin panel, auth page v2 (`ap-*` namespace), and responsive breakpoints.

---

## ⚛️ Tech Stack

- React (Vite)
- JavaScript / TypeScript
- CSS / Tailwind (if used)
- Speech-to-Text API (browser-based or external)
- REST API integration (backend)

---

## 📂 Project Structure

```
scenescribe-frontend/
├── public/                     # Static assets served as-is
├── src/
│   ├── pages/
│   │   ├── AuthPage.jsx        # Unified login + register (4 steps: register, verify, success, sign-in)
│   │   ├── Home.jsx            # Daily scene dashboard — video, input, and post-submission feedback
│   │   ├── Feedback.jsx        # Detailed view of a single past submission
│   │   ├── Profile.jsx         # User stats, streak, and paginated submission history
│   │   └── Admin.jsx           # Admin panel — schedule, edit, and delete daily scenes
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
└── .env                        # Local environment variables (gitignored) — VITE_API_URL
```
