# 🎬📝 SceneScribe

**Learn English by describing what you see.**

Most people learn English by memorising rules. SceneScribe flips that around: you watch a short, real-life video clip, describe what is happening in your own words, and get instant, personal feedback on how you said it.

It takes about five minutes a day.

---

## 🌟 How it works

**1. Watch** — A short clip appears each day. Someone ordering coffee. A traveller checking in at an airport. Everyday moments, not textbook dialogues.

**2. Describe** — Write a sentence or a short paragraph about what is happening. Type it, or say it out loud and let SceneScribe transcribe your voice as you speak.

**3. Get scored** — Your description is reviewed and scored out of 10, broken down into the three things that matter: **grammar**, **vocabulary**, and **clarity**.

**4. Learn** — This is the part that makes it stick. You get back:

- The specific issues in what you wrote — not vague advice
- Practical suggestions you can act on next time
- **Your own sentence, corrected** — so you can see exactly what changed
- An **ideal example** showing the best way to describe that scene

You get one attempt per scene. That is deliberate: it encourages a considered first try instead of guessing until something works.

---

## ✨ Features

**📅 A fresh scene every day.** New clips are published daily — up to four on a single day, each tracked separately. Do one now, come back for the rest later.

**🎚️ Difficulty levels.** Every scene is labelled **beginner**, **intermediate**, or **advanced**, so you know what you are walking into.

**📚 Built-in learning aids.** A scene can come with help before you write a word: **key vocabulary** (definition, part of speech, and an example for each word), a **grammar focus** to practise, and **notes** pointing you toward what to pay attention to.

**🎙️ Type it or say it.** Write your description, or tap the microphone and speak naturally — your words appear as you talk. Both are scored exactly the same way.

**🔥 Streaks.** Practise on consecutive days and build a streak. SceneScribe tracks your **current streak** and your **longest ever**. Miss a day and the current streak resets; the record stays.

**📊 Your progress.** A profile showing your average score, your highest score, both streaks, and how many scenes you have completed in total.

**🕘 Full history.** Every scene you have ever done, newest first. Open any one to see the complete feedback again. Old feedback never disappears, so you can always go back and re-study.

**🎬 Curated content.** Scenes are hand-picked and scheduled by the SceneScribe team, each with its own reference description. Feedback is graded against what the content creator actually intended you to notice — not a generic rubric.

---

## 🚪 Getting started

1. Enter your email address — a 6-digit verification code arrives, valid for 10 minutes
2. Enter the code, then pick a username and password
3. That is it. You stay signed in for a week at a time

---

## 🛠️ Running it locally

Docker is the quickest way to get the whole stack — web app, API, and database — running together:

```bash
docker compose up --build
```

| | |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:3001/api/health |

It works with no configuration. Without an OpenAI key, scoring falls back to a fixed placeholder score; without SMTP settings, verification codes are printed to the API logs instead of being emailed. To enable either, copy `.env.example` to `.env` and fill in what you need.

Two accounts are always available for testing:

| | Email | Password |
|---|---|---|
| Admin | `xyz@gmail.com` | `xyz@12345` |
| User | `abc@gmail.com` | `abc@12345` |

To run a single part on its own, or for anything beyond a quick look, see the README inside that folder.

---

## 📂 Inside this repository

| Folder | What is in it | Details |
|---|---|---|
| [`web/`](./web) | The React web app | [`web/README.md`](./web/README.md) |
| [`backend/`](./backend) | The API, database, and AI scoring | [`backend/README.md`](./backend/README.md) |
| `android/` | The native Android app — not started yet | — |

---

## 📱 Where you can use it

| Platform | Status |
|---|---|
| **Web** | ✅ Available |
| **Android** | 🚧 Planned |
