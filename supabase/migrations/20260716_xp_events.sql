-- XP engine for weekly leaderboards. Written ONLY by service-role API
-- routes (lazy sync from real user_progress / quiz_attempts rows), so XP
-- cannot be farmed or spoofed. The unique key makes every award idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source text NOT NULL,          -- lesson_complete | quiz_pass | quiz_perfect
  points integer NOT NULL,
  ref_id text NOT NULL,          -- lesson id the event derives from
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, ref_id)
);
CREATE INDEX IF NOT EXISTS xp_events_user_week_idx
  ON public.xp_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS xp_events_week_idx
  ON public.xp_events (created_at);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xp_events FROM anon, authenticated;

COMMIT;
