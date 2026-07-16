# Sabitek End-to-End Test Flow

One continuous story: each section creates the data the next one reads.
Setup: two browsers (normal = owner/admin, incognito = fresh accounts).
Section J needs Nigeria-evening timing (cron runs 19:00 WAT).

## A. Visitor & Access
- [ ] Homepage loads; Sparkles icon appears ONLY in the wordmark
- [ ] Courses while logged out -> login wall
- [ ] URL normalizes to www.sabitek.app

## B. New Learner Core Loop (creates "Ada")
- [ ] Fresh signup -> single stable landing on learner dashboard
- [ ] "Start learning 1/5" onboarding card (profile pre-checked)
- [ ] Enroll -> text lesson: reading time, progress bar, TOC
- [ ] Save as PDF prints ONLY the article
- [ ] End-of-lesson recap with check-marked sections + Continue
- [ ] Quiz lesson: "Pass quiz to complete" locked button
- [ ] Network tab: quiz payload has NO correct_answer fields
- [ ] Fail on purpose -> server-graded review with explanations
- [ ] "Ask SabiBot to explain what I missed" button appears
- [ ] Pass -> next lesson unlocks in sidebar
- [ ] Dashboard Resume card points at exact next lesson

## C. Gamification (reads B)
- [ ] Daily ring filled; flame at 1 with "1 freeze" chip; weekly XP
- [ ] Badge wall: First Steps + Quiz Rookie earned; hints on locked
- [ ] Leaderboard shows Ada
- [ ] Learning Journey stats match reality

## D. SabiBot
- [ ] Floating bot on a lesson: "Tutoring: [lesson]", teaches content, no em dashes
- [ ] Goal message -> rose course pill (tappable) when catalog matches
- [ ] Goals tab populates ~10s after stating a goal; Insights fill
- [ ] "How am I doing?" cites real numbers

## E. Ask-Instructor + Notifications (cross-persona)
- [ ] Ada asks in the Ask Instructor tab -> "awaiting answer"
- [ ] Instructor Questions inbox -> answer inline
- [ ] Ada's bell badges -> deep-link -> answer visible to all learners

## F. Certificates
- [ ] Course completion issues certificate; list shows mini-cert card
- [ ] Premium document scales on mobile width, no horizontal scroll
- [ ] Print outputs only the certificate; PDF download works
- [ ] Verify link works logged-out
- [ ] WhatsApp/LinkedIn unfurl shows learner name card (og-image)

## G. Instructor Journey
- [ ] Slash menu: callout, columns, CTA (editable via strip)
- [ ] Drag-drop image -> resize + caption persists after save
- [ ] Close mid-edit -> "Unsaved draft found" restore bar
- [ ] Published-course edit shows live warning
- [ ] Preview as learner (new tab) matches exactly
- [ ] Analytics: KPIs, trend, funnel w/ Ada, quiz item analysis, roster
- [ ] Announcement (confirm modal) -> Ada gets email + bell

## H. Institution Machine
- [ ] Apply -> approve -> welcome email ARRIVES
- [ ] Admin onboarding checklist 0/5 -> walk it
- [ ] Instructor invite -> accept -> proprietary course stamped
- [ ] Viewer invite -> Reports only, bounced from management
- [ ] Course Library -> attach to program
- [ ] Cohort (welcome+reminders ON, access code) -> Share modal -> copy link+code
- [ ] Vanity link logged out: branded landing -> signup -> code -> joined
- [ ] Program sequencing: course 2 locked until course 1 complete
- [ ] Welcome email + bell on join
- [ ] Bulk CSV invite with per-row results
- [ ] Reports -> cohort drill-down -> at-risk chip + Nudge -> CSV export
- [ ] Tenancy: outsider cannot see/open the proprietary course

## I. Security Spot-Checks
- [ ] No dashboard ping-pong for any persona
- [ ] bhcict2020@gmail.com -> stable learner dashboard

## J. Cron & Email (overnight)
- [ ] 19:00 WAT streak-save email for about-to-break streaks
- [ ] Missing exactly one day consumes the freeze (streak survives)
- [ ] Program completion overnight: completed_at + congrats email + PROGRAM certificate ("offered by [Institution]")
- [ ] Day-3 cohort reminder for inactive members

## K. Owner Cockpit
- [ ] /admin cockpit tiles + AI spend with per-model split
