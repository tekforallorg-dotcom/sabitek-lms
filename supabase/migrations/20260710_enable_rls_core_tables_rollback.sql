-- Rollback for 20260710_enable_rls_core_tables.sql
-- Restores the previous (insecure) state. Use only if the RLS
-- enablement breaks a flow that cannot be fixed forward.

BEGIN;

ALTER TABLE public.courses        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates   DISABLE ROW LEVEL SECURITY;

GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.courses, public.lessons, public.quizzes,
     public.quiz_attempts, public.certificates
  TO anon;

GRANT TRUNCATE, REFERENCES, TRIGGER
  ON public.courses, public.lessons, public.quizzes,
     public.quiz_attempts, public.certificates
  TO authenticated;

DROP POLICY IF EXISTS "Users can insert own certificates" ON public.certificates;

COMMIT;
