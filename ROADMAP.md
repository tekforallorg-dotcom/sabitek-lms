# Sabitek Roadmap — parked & next (updated 2026-07-17)

Everything currently deployed is tracked in git history. This file holds
only what was **deliberately parked or discovered late**, so the next
session starts with a clean map instead of archaeology.

## Next dedicated session: SabiSuite

1. **SabiAdvisor retired Claude models (BREAKAGE, do first)** —
   `lib/advisor/ai/claude.ts` pins `claude-3-5-sonnet-20241022` (retired
   Oct 2025 → its calls error today) and `claude-3-haiku-20240307`
   (retires Apr 2026). Swap to current IDs and retest CV generation.
2. **SabiWrite + SabiTools**: owner-approved direction is hide/kill
   (wallet-dependent, off-core). Execute like the wallet hide.
3. **SabiQuiz rebuild**: practice quizzes on the AI generation engine
   (legacy QuizTaker retired 2026-07-17), server-graded; plus
   "Generate quiz from this lesson" inside the course builder. For
   YouTube lessons: captions/transcript when available, instructor
   key-points fallback, always an editable review screen.
4. **`lesson_ai_artifacts` wiring** (owner said KEEP): per-lesson
   suggested questions (lesson-specific SabiBot chips) + AI key points
   (richer recap card). Generate once per lesson, cached.
5. SabiAdvisor verified-CV upgrade (skills backed by QR-verified
   certificates) — the employability differentiator.

## Other sessions

- **Billing**: institution seats/subscriptions (owner: separate session).
- **Long-tail reskins** (small batches): community, SabiQuiz learner
  pages, SabiAdvisor tool pages, SabiBot landing page.
- **E2E smoke test**: signup → enroll → lesson → quiz pass → certificate.
  Should land BEFORE the next big build wave.

## Small items (discovered late, logged 2026-07-16/17)

- **Historical program completers**: the completion cron only examines
  members who studied *yesterday*, so anyone who finished all program
  courses BEFORE the cron existed never gets `completed_at` or a
  program certificate. Needs a one-time backfill sweep.
- **Freeze reassurance**: `last_freeze_used_on` is exposed but not shown;
  a "a freeze saved your streak last night" note would close the loop.
- **Published-course edit versioning**: the builder now *warns* that
  edits go live instantly; true draft-then-republish is unbuilt.
- Certificate page og-image exists for /verify links; consider one for
  the owner cert page too.
- Longer-term: PWA/offline, UI localization (SabiBot already speaks 5
  languages; the UI doesn't).

## Standing decisions (owner-confirmed)

- Domain allowlist: killed (market doesn't use org domains).
- SabiBot chat + insights: DeepSeek. Lesson summaries: Claude Haiku.
  SabiAdvisor: Claude (fix IDs).
- Course catalog: login-required. Proprietary tenancy enforced.
