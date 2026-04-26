[paste the full File 2 content here]
-- ============================================================================
-- ROLLBACK: courses.institution_id (Iteration C — Slice C.1)
-- Date: 2026-04-25
-- Reverses: 20260425_courses_institution_id.sql
-- ============================================================================
--
-- WARNING: any institution_id values stored in courses will be lost when this
-- runs. If you have already shipped C.2+ and have institution-owned courses,
-- export them first:
--
--   SELECT id, title, institution_id
--     FROM public.courses
--    WHERE institution_id IS NOT NULL;
--
-- After C.1 alone (no application code touches the column yet), running this
-- is safe and lossless.
-- ============================================================================

-- 1) Drop the index
DROP INDEX IF EXISTS public.idx_courses_institution_id;

-- 2) Drop the column (the FK constraint is dropped automatically with it)
ALTER TABLE public.courses
  DROP COLUMN IF EXISTS institution_id;

-- 3) Verification
DO $$
DECLARE
  has_column BOOLEAN;
  has_index  BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'courses'
       AND column_name  = 'institution_id'
  ) INTO has_column;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename  = 'courses'
       AND indexname  = 'idx_courses_institution_id'
  ) INTO has_index;

  IF has_column OR has_index THEN
    RAISE EXCEPTION 'Rollback incomplete: column=%, index=%', has_column, has_index;
  END IF;

  RAISE NOTICE 'courses.institution_id rollback complete.';
END $$;