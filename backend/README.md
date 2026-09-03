# SceneScribe — Backend API

SceneScribe is an AI-powered English learning platform. Users watch short real-life video scenes, describe what they see in English, and receive instant AI-generated feedback with scores, grammar tips, vocabulary suggestions, and corrections.

**Stack:** Node.js 22 · Express 4 · Sequelize 6 · PostgreSQL 16 · Anthropic Claude API · JWT · Nodemailer · Docker

---

## Project Structure

```
src/
├── index.js              # Entry point — Express setup, DB sync, admin seed
├── config/database.js    # Sequelize instance
├── middleware/auth.js    # authenticate (JWT) + requireAdmin
├── models/
│   ├── index.js          # Associations
│   ├── User.js
│   ├── Scene.js
│   ├── Submission.js
│   ├── Vocabulary.js
│   └── Grammar.js
├── routes/
│   ├── auth.js           # Register, verify OTP, login
│   ├── dashboard.js      # Today's scene + submit + result
│   ├── profile.js        # User stats + history
│   └── admin.js          # Scene scheduling CRUD + analytics
└── services/email.js     # OTP email via Nodemailer
```

---

## Database Schema

### Users
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `username` | string | unique, 3–30 chars; null until OTP verified |
| `email` | string | unique |
| `password_hash` | string | bcrypt; null until OTP verified |
| `is_registered` | boolean | false = OTP pending |
| `otp` | string | cleared after verify |
| `otp_expires_at` | date | 10-min window |
| `curr_streak` | int | default 0 |
| `longest_streak` | int | default 0 |
| `total_completed` | int | default 0 |
| `last_submission_date` | date | used for streak logic |
| `is_admin` | boolean | default false |

### Scenes
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `title` | string | falls back to first 60 chars of description |
| `description` | text | brief scene summary |
| `youtube_url` | string | |
| `reference_description` | text | ideal answer used in AI prompt |
| `additional_notes` | text | grammar/vocab hints for AI |
| `publish_date` | date | unique per date |
| `difficulty` | enum | beginner / intermediate / advanced |
| `language` | string | default 'English' |
| `is_premium` | boolean | default false |
| `submission_count` | int | auto-incremented on each submission |

### Submissions
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | → Users |
| `scene_id` | UUID FK | → Scenes |
| `response_text` | text | student's input |
| `input_type` | enum | keyboard / microphone |
| `score` | int | 0–10 overall |
| `grammar_score` | int | 0–10 |
| `vocabulary_score` | int | 0–10 |
| `clarity_score` | int | 0–10 |
| `feedback` | jsonb | `string[]` — flat list of feedback notes from AI |
| `ai_response` | text | AI-generated improved version of the user's response |
| `status` | enum | pending / processing / completed / failed |

### Vocabularies
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `scene_id` | UUID FK | → Scenes |
| `word` | string | |
| `definition` | text | |
| `example` | text | optional |
| `part_of_speech` | string | optional |

### Grammars
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `scene_id` | UUID FK | → Scenes |
| `pattern` | string | e.g. "Present Continuous" |
| `explanation` | text | |
| `example` | text | optional |

---

## API Endpoints

Base URL: `http://localhost:3001/api`

All responses use: `{ "success": true, "data": {...} }` or `{ "success": false, "error": { "code": "...", "message": "..." } }`

---

### Auth

#### `POST /auth/register`
Step 1 of registration. Sends a 6-digit OTP to the email (valid 10 min). Re-sends if email is already pending.

**Request**
```json
{ "email": "user@example.com" }
```

**Response `200`**
```json
{
  "success": true,
  "data": { "email": "user@example.com" },
  "message": "OTP sent to your email. Please verify within 10 minutes."
}
```

---

#### `POST /auth/verify`
Step 2 of registration. Verifies OTP, sets username + password, returns JWT.

**Request**
```json
{
  "email": "user@example.com",
  "otp": "483920",
  "user_name": "johndoe",
  "password": "secret123"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "uuid", "user_name": "johndoe", "email": "user@example.com", "is_admin": false }
  },
  "message": "Email verified. Registration complete."
}
```

---

#### `POST /auth/login`
Authenticate and receive a JWT (7-day expiry).

**Request**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "uuid", "user_name": "johndoe", "email": "user@example.com", "is_admin": false }
  }
}
```

---

### Dashboard
All routes require `Authorization: Bearer <token>`.

#### `GET /dashboard/today`
Returns the scene scheduled for today (`publish_date === today`) and the user's submission status for it. Returns `NO_SCENE` 404 if no scene is scheduled for today — there is no fallback to previous days.

**Response — not submitted**
```json
{
  "success": true,
  "data": {
    "status": "pending",
    "video": {
      "video_id": "uuid",
      "video_url": "https://youtube.com/...",
      "title": "Man ordering coffee",
      "scene_description": "...",
      "reference_description": "...",
      "additional_notes": "...",
      "difficulty": "intermediate",
      "language": "English",
      "submission_count": 14,
      "vocabularies": [{ "word": "barista", "definition": "...", "example": "...", "part_of_speech": "noun" }],
      "grammars": [{ "pattern": "Present Continuous", "explanation": "...", "example": "..." }]
    }
  }
}
```

**Response — already submitted**
```json
{
  "success": true,
  "data": {
    "status": "submitted",
    "video": { "...same as above..." },
    "submission": {
      "submission_id": "uuid",
      "response_text": "A man is ordering a latte...",
      "input_type": "keyboard",
      "score": 7,
      "breakdown": { "grammar": 6, "vocabulary": 7, "clarity": 8 },
      "feedback": ["Work on verb tense consistency.", "Use more descriptive vocabulary."],
      "ai_response": "A man walks into a coffee shop and orders a latte from the barista."
    }
  }
}
```

---

#### `POST /dashboard/submit`
Submit a scene description. Calls Claude AI for scoring, updates streak stats.

**Request**
```json
{
  "video_id": "uuid",
  "response_text": "A man walks into a coffee shop and orders a latte.",
  "input_type": "keyboard"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "submission_id": "uuid",
    "score": 7,
    "breakdown": { "grammar": 6, "vocabulary": 7, "clarity": 8 },
    "input_type": "keyboard",
    "feedback": ["Work on verb tense consistency.", "Consider using more vivid vocabulary."],
    "ai_response": "A man walks into a coffee shop and politely orders a latte from the barista.",
    "new_streak": 5
  }
}
```

---

#### `GET /dashboard/result/:submissionId`
Fetch a completed submission by ID (must belong to the authenticated user).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "submission_id": "uuid",
    "video": { "video_url": "...", "scene_description": "...", "reference_description": "...", "title": "..." },
    "response_text": "...",
    "input_type": "keyboard",
    "score": 7,
    "breakdown": { "grammar": 6, "vocabulary": 7, "clarity": 8 },
    "feedback": ["Good use of present tense.", "Vocabulary could be more varied."],
    "ai_response": "A man walks into a coffee shop and orders a latte from the barista.",
    "date": "2026-04-10T10:30:00.000Z"
  }
}
```

---

### Profile
All routes require `Authorization: Bearer <token>`.

#### `GET /profile/me`
Authenticated user's profile and stats.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "user": { "user_name": "johndoe", "email": "user@example.com", "is_admin": false },
    "stats": {
      "avg_score": "7.2",
      "highest_score": 9,
      "current_streak": 5,
      "longest_streak": 12,
      "total_completed": 20
    }
  }
}
```

---

#### `GET /profile/history?page=1`
Paginated list of the user's completed submissions (10 per page, newest first).

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "submission_id": "uuid",
      "date": "2026-04-10T10:30:00.000Z",
      "score": 7,
      "scene_title": "Man ordering coffee",
      "video_url": "https://youtube.com/...",
      "publish_date": "2026-04-10"
    }
  ],
  "meta": { "total": 20, "page": 1, "pages": 2 }
}
```

---

#### `GET /profile/history/:id`
Full detail of a single past submission. Response shape matches `GET /dashboard/result/:submissionId`.

---

### Admin
All routes require `Authorization: Bearer <token>` and `is_admin: true`.

#### `POST /admin/schedule`
Schedule a new scene for a specific date. One scene per date.

**Request**
```json
{
  "date": "2026-04-15",
  "video_url": "https://youtube.com/...",
  "title": "Airport check-in",
  "scene_description": "A traveller checks in at an airport.",
  "reference_description": "The traveller approaches the check-in desk...",
  "additional_notes": "Focus on polite requests.",
  "difficulty": "intermediate",
  "language": "English",
  "is_premium": false,
  "vocabularies": [{ "word": "boarding pass", "definition": "...", "example": "...", "part_of_speech": "noun" }],
  "grammars": [{ "pattern": "Modal verbs", "explanation": "...", "example": "Could I have a window seat?" }]
}
```

**Response `201`**
```json
{ "success": true, "data": { "video_id": "uuid" }, "message": "Video scheduled successfully" }
```

---

#### `GET /admin/schedule`
All scheduled scenes ordered by `publish_date` ascending, including vocabularies and grammars.

**Response `200`**
```json
{
  "success": true,
  "data": [{
    "video_id": "uuid",
    "date": "2026-04-15",
    "video_url": "...",
    "title": "Airport check-in",
    "scene_description": "...",
    "reference_description": "...",
    "additional_notes": "...",
    "is_premium": false,
    "difficulty": "intermediate",
    "submission_count": 0,
    "vocabularies": [],
    "grammars": []
  }]
}
```

---

#### `GET /admin/schedule/:date`
Get the scene for a specific date (`YYYY-MM-DD`). Response is a single scene object (same fields as the list above).

---

#### `PATCH /admin/schedule/:id`
Update fields on a scene. All fields optional — only provided fields are changed.

**Request**
```json
{
  "video_url": "...",
  "title": "...",
  "scene_description": "...",
  "reference_description": "...",
  "additional_notes": "...",
  "difficulty": "advanced",
  "language": "English",
  "is_premium": false
}
```

**Response `200`**
```json
{ "success": true, "message": "Video updated successfully" }
```

---

#### `DELETE /admin/schedule/:id`
Permanently delete a scheduled scene.

**Response `200`**
```json
{ "success": true, "message": "Video deleted successfully" }
```

---

#### `GET /admin/analytics`
Platform-wide stats and the 10 most recent submissions.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "total_users": 142,
    "total_submissions": 890,
    "total_scenes": 30,
    "average_score": "6.8",
    "recent_submissions": [
      { "id": "uuid", "username": "johndoe", "scene_title": "Man ordering coffee", "score": 7, "date": "2026-04-10T10:30:00.000Z" }
    ]
  }
}
```

---

### Analyse

#### `POST /analyse/sentence`
Analyse a user sentence against an admin reference sentence. Updates the matching submission row with scores, `ai_response`, and `feedback`. Requires authentication.

To enable real AI scoring, set `USE_AI = true` in `src/services/sentenceAnalysis.js` and ensure `ANTHROPIC_API_KEY` is present in `.env`. While `USE_AI` is `false` a clearly-labelled mock response is returned.

**Request**
```json
{
  "submission_id": "uuid",
  "sentence": "The man walk to the store yesterday.",
  "admin_sentence": "A man walked into the store and browsed the shelves."
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "grammar_score": 5,
    "vocabulary_score": 6,
    "clarity_score": 7,
    "overall_score": 6,
    "issues": ["Incorrect verb tense — 'walk' should be 'walked'"],
    "suggestions": ["Use past tense consistently throughout the sentence."],
    "improved_sentence": "The man walked to the store yesterday.",
    "ideal_sentence": "A man walked into the store and carefully browsed the shelves."
  }
}
```

**DB fields updated on the submission row:**
| Field | Set to |
|---|---|
| `score` | `overall_score` |
| `grammar_score` | `grammar_score` |
| `vocabulary_score` | `vocabulary_score` |
| `clarity_score` | `clarity_score` |
| `ai_response` | `improved_sentence` |
| `feedback` | `{ issues: [], suggestions: [] }` |
| `status` | `completed` |

---

### Health

#### `GET /api/health`
No auth required.

**Response `200`**
```json
{ "success": true, "data": { "status": "ok" } }
```

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_INPUT` | 400 | Missing or invalid fields |
| `NO_OTP` | 400 | No OTP issued — call `/register` first |
| `OTP_EXPIRED` | 400 | OTP expired — call `/register` again |
| `INVALID_OTP` | 400 | OTP does not match |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `NO_TOKEN` | 401 | Authorization header missing |
| `INVALID_TOKEN` | 401 | JWT invalid or expired |
| `USER_NOT_FOUND` | 401 | Token valid but user deleted |
| `EMAIL_NOT_VERIFIED` | 403 | Login before completing email verification |
| `FORBIDDEN` | 403 | Admin access required |
| `NOT_FOUND` | 404 | Resource not found |
| `NO_SCENE` | 404 | No scene available for today |
| `EMAIL_IN_USE` | 409 | Email already registered |
| `USERNAME_TAKEN` | 409 | Username already taken |
| `ALREADY_SUBMITTED` | 409 | User already completed this scene |
| `DATE_CONFLICT` | 409 | Scene already scheduled for that date |
| `SERVER_ERROR` | 500 | Unexpected server error |
