# SceneScribe

SceneScribe is an AI-powered English learning app. Every day, a learner watches a short real-life video clip, describes what they see in English, and gets instant, personalized feedback on how well they described it — with a corrected version and an ideal example to learn from.

It's available as a web app and an Android app, with the same daily practice experience on both.

## Core loop: the daily scene

1. **Watch** — a short YouTube clip is shown (e.g. "a man ordering coffee," "a traveller checking in at an airport").
2. **Describe** — the learner writes (or speaks) a sentence or short paragraph describing what's happening in the clip.
3. **Get scored** — the description is evaluated and scored on three dimensions: **grammar**, **vocabulary**, and **clarity**, plus an overall score out of 10.
4. **Learn** — alongside the score, the learner receives:
   - A list of specific issues found in their writing.
   - Actionable suggestions for improvement.
   - Their own sentence, corrected.
   - An "ideal" example sentence showing the best possible way to describe the scene.
5. Each scene can only be submitted once — there's one attempt per scene, encouraging a considered first try rather than trial-and-error retries.

### Multiple scenes per day

A day isn't limited to one clip — up to four scenes can be scheduled for the same day. Learners move between them (via a carousel on the app, or in sequence on web), completing each independently. Every scene tracks its own progress, so a learner can do one now and come back for the rest later.

### Difficulty and learning aids

Each scene is tagged with a difficulty level — **beginner**, **intermediate**, or **advanced** — so learners can gauge what to expect before diving in. Scenes can also come with built-in learning aids to help the learner before they write:

- **Key vocabulary** — words relevant to the scene, each with a definition, part of speech, and an example sentence.
- **Grammar focus** — a grammar pattern relevant to the scene (e.g. "Present Continuous," "Modal verbs"), with an explanation and example.
- **Additional notes** — free-form hints from whoever scheduled the scene, nudging the learner toward what to focus on.

Scenes also have a "premium" tag, reserved for potential future paid content — it doesn't currently restrict access to anything.

### Two ways to answer

Learners can either type their description or speak it aloud using voice input, which is transcribed to text in real time as they talk. Both input methods are scored identically.

## Tracking progress

### Streaks

Completing a scene on consecutive days builds a streak. SceneScribe tracks:
- **Current streak** — consecutive days with at least one completed scene.
- **Longest streak** — the best streak ever achieved, for a personal best to chase.

Missing a day resets the current streak back to one on the next completed submission.

### Profile and stats

A learner's profile shows:
- Average score across all completed scenes.
- Highest score ever achieved.
- Current and longest streaks.
- Total scenes completed.
- Full submission history, paginated, newest first — each entry showing the scene, date, and score.

Tapping into any past submission (today's or historical) shows the full feedback detail again: the original response, the score breakdown, the issues/suggestions, the corrected sentence, and the ideal example — so learners can always revisit and re-study past feedback.

## Getting started (registration & login)

Signing up is a two-step process:
1. Enter an email address — a 6-digit verification code is sent (valid for 10 minutes).
2. Enter the code along with a chosen username and password to complete registration.

After that, it's a normal email + password login. Sessions stay signed in for a week before needing to log in again.

## Admin / content management

Behind an admin role, whoever curates content for SceneScribe can:
- **Schedule scenes** — pick a date, attach a YouTube clip, write the scene description (which also doubles as the reference/ideal answer used for scoring), set difficulty, add vocabulary words and grammar patterns, and add teaching notes — up to four scenes per date.
- **View and manage the schedule** — see all upcoming and past scheduled scenes, edit any field, or remove a scene entirely.
- **View platform analytics** — total registered users, total submissions completed, total scenes published, the platform-wide average score, and a live feed of the ten most recent submissions across all learners.

## What makes the feedback trustworthy

Every scene's description also serves as the "reference answer" the AI grades against, so feedback is grounded in what the content creator actually intended learners to notice and describe — not a generic rubric. If AI scoring is ever unavailable, a learner's submission still completes (rather than getting stuck) using a safe default score, so the daily habit is never blocked by a backend hiccup.
