# Pixel Paradox — Admin Panel Quiz Manager & Rounds Update Walkthrough

## Summary of Completed Changes

### 1. Stage 0 Prelims Quiz Management in Admin Panel
- **New Dedicated "Quiz Manager (Stage 0)" Tab** in `frontend/app/admin/page.js`:
  - **Question Creator & Editor Form**: Allows the admin to input Question Text, 4 choices (Option A, Option B, Option C, Option D), designate the correct choice (A, B, C, or D), configure points and order numbers.
  - **Question Directory**: Live list showing question cards with the correct answer highlighted with a checkmark badge. Supports in-place editing and instant deletion.
  - **Curated Question Seeding**: Added `⚡ Seed 20 Curated Questions` button to pre-populate 20 competition-ready AI, GAN, and deepfake questions tailored to the symposium theme *"LOGIN 2026: The Last Human"*.
  - **Clear All Questions**: Added safety-confirmed button to wipe and re-import questions if needed.

### 2. Backend Admin Quiz Endpoints (`AdminQuizController.java` & `GameService.java`)
- `GET /api/admin/quiz` — Retrieve all questions in sequential order.
- `POST /api/admin/quiz` — Create a new question.
- `PUT /api/admin/quiz/{id}` — Update existing question text, choices, correct answer, or points.
- `DELETE /api/admin/quiz/{id}` — Delete a specific question.
- `POST /api/admin/quiz/seed` — Pre-seeds 20 curated questions on generative architectures, artifact detection, and prompt engineering.
- `DELETE /api/admin/quiz/all` — Clears questions for reset.
- **Robust Answer Evaluation**: Updated `GameService.java` with case-insensitive, flexible matching so whether the answer is stored as the letter (A/B/C/D) or full text, submissions are reliably graded.
- **Dynamic Team Prelims Scoring**: Each member's score is scaled to 10 points (`(memberScore / maxPoints) * 10`), and the team's average is computed across the registered team size and broadcast to the real-time leaderboard via WebSockets.

### 3. Updated Admin Panel Round Labels
All round labels across the organizer interface now reflect the 4-stage competition structure:
- **Stage 0**: Registration / Lobby (Round 0)
- **Stage 0**: Prelims — 20 MCQ Quiz with silent webcam recording (Round 1)
- **Stage 1**: Pixel Detective — Real vs AI & Model Identification (Round 2)
- **Stage 2**: The Glitch Hunt — Spotting AI artifacts & inconsistencies (Round 3)
- **Stage 3**: Prompt Wars — Prompt engineering & recreation (Round 4)
- **Stage 5**: Game Over / Winner Podium

### 4. Admin Navigation & Controls
- Added direct navigation buttons to `👥 Registered Teams` (`/admin/teams`) and `📹 Webcam Recordings` (`/admin/recordings`) in the Admin navigation bar.
- Added explicit Stage 0 -> Stage 1 (Top 50%), Stage 1 -> Stage 2 (Top 10), and Stage 2 -> Stage 3 (Top 5) cutoff advancement buttons.
- Admin dashboard kept strictly functional with no heavy participant animations.

---

## Verification Results

| Component | Test Executed | Result |
|---|---|---|
| Admin Auth & Access | Login as `ywanth224@gmail.com` | `ROLE_ADMIN` verified |
| Quiz API Seed | `POST /api/admin/quiz/seed` | 20 questions seeded |
| Quiz CRUD | `POST`, `PUT`, `DELETE` on `/api/admin/quiz` | All CRUD operations passed |
| Participant Quiz Fetch | `GET /api/game/prelims/questions` | 20 questions returned, correct answers omitted |
| Quiz Start & Submit | Participant "Alice" (2/20) and "Bob" (20/20) | Graded accurately |
| Scoring Formula | `(Sum of scaled scores out of 10) / teamSize` | Team score calculated and rounded to 4/10 |
| Round Advancement | Advance Top 50% from Stage 0 | Teams promoted to Stage 1, global round = 2 |
| Engine Reset | `POST /api/game/reset` | Scores & submissions reset, questions preserved |
