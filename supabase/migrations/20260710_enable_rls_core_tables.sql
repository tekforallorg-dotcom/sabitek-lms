-- ============================================================
-- Enable RLS on core content tables and tighten grants.
--
-- Before this migration: courses, lessons, quizzes, quiz_attempts,
-- and certificates had RLS DISABLED while anon + authenticated held
-- full table privileges, so anyone with the public anon key could
-- read/write/delete every row via the REST endpoint. Policies
-- already existed on all five tables but were dormant.
--
-- This migration:
--   1. Adds the one missing policy the app needs (learners insert
--      their own certificate on course completion; issuance is
--      client-side today and moves server-side later).
--   2. Enables RLS on all five tables, activating existing policies.
--   3. Revokes write privileges from anon and drops TRUNCATE /
--      REFERENCES / TRIGGER from both anon and authenticated.
--
-- Verified against production policies on 2026-07-09:
--   * courses: public read published; instructors manage own.
--   * lessons: public read (published course); instructors manage own.
--   * quizzes: authenticated read; instructors manage own.
--   * quiz_attempts: users insert/read own; instructors read for
--     their courses; super admins read all. (App never UPDATEs.)
--   * certificates: users read own; instructors read for their
--     courses; super admins manage all. INSERT policy added below.
--   * /verify/[certificateNumber] moves to a service-role API route
--     in the same deploy (anon can no longer read certificates).
--   * All /api/admin/* routes use the service role and bypass RLS.
-- ============================================================

BEGIN;

-- 1. Certificates: allow a signed-in learner to record their own
--    certificate. Closes anonymous minting and cross-user tampering.
DROP POLICY IF EXISTS "Users can insert own certificates" ON public.certificates;
CREATE POLICY "Users can insert own certificates" ON public.certificates
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 2. Enable RLS (activates all existing dormant policies).
ALTER TABLE public.courses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates   ENABLE ROW LEVEL SECURITY;

-- 3. Tighten grants. RLS is the row filter; grants are the
--    table-level ceiling. anon becomes read-only; nobody keeps
--    TRUNCATE/REFERENCES/TRIGGER.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.courses, public.lessons, public.quizzes,
     public.quiz_attempts, public.certificates
  FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON public.courses, public.lessons, public.quizzes,
     public.quiz_attempts, public.certificates
  FROM authenticated;

COMMIT;
