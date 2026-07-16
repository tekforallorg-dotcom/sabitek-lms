-- Ask-the-instructor: per-lesson question threads. Learners ask; the
-- course instructor answers; answered questions become visible to all
-- authenticated learners (shared knowledge), pending ones only to the
-- asker. Answers are written via a service-role API only.

BEGIN;

CREATE TABLE IF NOT EXISTS public.lesson_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  answered_by uuid REFERENCES public.users(id),
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_questions_lesson_idx
  ON public.lesson_questions (lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lesson_questions_course_pending_idx
  ON public.lesson_questions (course_id) WHERE answered_at IS NULL;

ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;

-- Read: your own questions always; everyone's answered ones
CREATE POLICY "lesson_questions_select" ON public.lesson_questions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR answered_at IS NOT NULL);

-- Ask: own row only, question length sane
CREATE POLICY "lesson_questions_ask" ON public.lesson_questions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND char_length(question) BETWEEN 5 AND 1000 AND answer IS NULL);

REVOKE UPDATE, DELETE ON public.lesson_questions FROM anon, authenticated;

COMMIT;
