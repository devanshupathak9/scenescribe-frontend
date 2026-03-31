# SceneScribe — App Overview

## User Flow
- Not logged in → Register / Login screen
- Logged in → Home screen (today's scene)

### Home screen
- Displays today's YouTube video scene embedded via iframe
- "Theory" tab: vocabulary + grammar for today's scene
- "Describe" tab: text input or voice recorder
- Submit → AI processes → Feedback screen

### Feedback screen
- Score (out of 10), grade (A–F), strengths, improvements
- Corrections with explanations
- Native speaker rewrite
- Notes section: grammar corrections, vocabulary suggestions, sentence structure improvements
- Points awarded, streak updated

### Profile screen
- Current streak, total points, submission count, average score
- History of past submissions + scores

### Admin dashboard (separate route — restricted)
- Add new YouTube video link + reference description + vocab/grammar
- Filter videos by date
- View basic analytics

---

## Project Structure

```
SceneScribe/
├── CLAUDE.md
├── scenescribe-backend/
│   ├── package.json
│   ├── .env.example
│   ├── seed.js
│   └── src/
│       ├── index.js                  # Express entry point
│       ├── config/
│       │   └── database.js           # Sequelize PostgreSQL config
│       ├── middleware/
│       │   └── auth.js               # JWT authenticate + requireAdmin
│       ├── models/
│       │   ├── index.js              # Model associations
│       │   ├── User.js               # id, username, email, password_hash, streak, total_points, last_submission_date, is_admin
│       │   ├── Scene.js              # id, title, description, youtube_url, reference_description, publish_date, language, difficulty, submission_count
│       │   ├── Submission.js         # id, user_id, scene_id, text_content, score(0-10), grade, points_awarded, feedback(JSONB), status
│       │   ├── Vocabulary.js         # id, scene_id, word, definition, example, part_of_speech
│       │   └── Grammar.js            # id, scene_id, pattern, explanation, example
│       └── routes/
│           ├── auth.js               # /api/auth
│           ├── scenes.js             # /api/scenes
│           ├── submissions.js        # /api/submissions
│           ├── profile.js            # /api/profile
│           └── admin.js              # /api/admin
│
└── scenescribe-frontend/
    ├── package.json
    ├── vite.config.js                # Proxy /api → localhost:3001
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                   # Router + auth state
        ├── api.js                    # Fetch wrapper (GET/POST/DELETE)
        ├── components/
        │   └── Navbar.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Home.jsx              # Today's scene (YouTube iframe + tabs)
        │   ├── Feedback.jsx          # Score /10, grade, corrections, notes
        │   ├── Profile.jsx           # Streak, points, avg score, history
        │   └── Admin.jsx             # Add scene, analytics, all scenes
        └── styles/
            └── global.css            # Dark theme, responsive breakpoints
```

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |

### Scenes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/scenes/today` | JWT | Get today's scene with vocab/grammar |
| GET | `/api/scenes/:id` | JWT | Get specific scene |

### Submissions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/submissions` | JWT | Submit description → AI feedback, returns score/grade/notes |
| GET | `/api/submissions/:id` | JWT | Get submission details |

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | JWT | User stats (streak, points, average_score) |
| GET | `/api/profile/history?page=N` | JWT | Paginated submission history |

### Admin (JWT + is_admin required)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/scenes` | Admin | Create scene (youtube_url, reference_description, vocab, grammar) |
| PUT | `/api/admin/scenes/:id` | Admin | Update scene |
| GET | `/api/admin/scenes?date=YYYY-MM-DD` | Admin | List scenes, optional date filter |
| DELETE | `/api/admin/scenes/:id` | Admin | Delete scene |
| GET | `/api/admin/analytics` | Admin | User/submission/scene counts, avg score, recent submissions |

---

## Key Implementation Details

### YouTube Integration
- Admin stores YouTube URL (`https://www.youtube.com/watch?v=...`)
- Frontend extracts video ID and embeds via `https://www.youtube.com/embed/{id}`
- Sample video: `https://www.youtube.com/watch?v=jNQXAC9IVRw`

### AI Scoring (Anthropic Claude)
- Model: `claude-sonnet-4-6`
- Score: 0–10 (9-10=A, 7-8=B, 5-6=C, 3-4=D, 0-2=F)
- If admin has set `reference_description`, AI compares submission against it
- Feedback JSON: `{ score, grade, strengths[], improvements[], corrections[], native_rewrite, notes: { grammar[], vocabulary[], structure[] } }`
- Points awarded = score × 5 (max 50/submission)

### Database
- PostgreSQL via Sequelize ORM
- `sequelize.sync({ alter: true })` on startup
- Admin access: set `is_admin = true` directly in DB after first registration

### Environment (backend .env)
```
PORT=3001
DATABASE_URL=postgres://user:pass@localhost:5432/scenescribe
JWT_SECRET=your-secret
ANTHROPIC_API_KEY=your-key
NODE_ENV=development
```

### Running Locally
```bash
# Backend
cd scenescribe-backend && npm install && npm run dev

# Frontend
cd scenescribe-frontend && npm install && npm run dev
# Frontend runs on port 5173, proxies /api to port 3001
