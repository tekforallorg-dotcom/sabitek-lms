-- SabiBot AI engine: usage metering, lesson artifacts, Q&A reuse cache.
-- All three tables are written ONLY by service-role API routes; RLS is
-- enabled with no anon/authenticated write policies (service role bypasses).

BEGIN;

-- Per-request token metering (quota enforcement + admin cost visibility)
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  feature text NOT NULL DEFAULT 'sabibot',
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  cache_read_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_user_day_idx
  ON public.ai_usage (user_id, created_at);

-- One-time generated lesson artifacts (summary/key points/suggested questions)
CREATE TABLE IF NOT EXISTS public.lesson_ai_artifacts (
  lesson_id uuid PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  summary text,
  key_points jsonb,
  suggested_questions jsonb,
  model text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Repeated-question cache: the 40th learner asking the same thing pays zero tokens
CREATE TABLE IF NOT EXISTS public.qa_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  lang text NOT NULL DEFAULT 'english',
  question_hash text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  hits integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, lang, question_hash)
);

ALTER TABLE public.ai_usage            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_ai_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_cache            ENABLE ROW LEVEL SECURITY;

-- Learners may read artifacts for lessons (rendered in the lesson viewer)
CREATE POLICY "lesson_artifacts_read" ON public.lesson_ai_artifacts
  FOR SELECT TO authenticated USING (true);

REVOKE ALL ON public.ai_usage, public.qa_cache FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lesson_ai_artifacts FROM anon, authenticated;

COMMIT;
