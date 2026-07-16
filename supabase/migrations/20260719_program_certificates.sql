-- Program certificates: the artifact institutions actually sell.
-- certificates grows program support (kind='program', program_id set,
-- course_id null); issuance happens in the completion cron via service
-- role. Course certificates are untouched (kind defaults to 'course').

BEGIN;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'course',
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL;

-- Course link becomes optional (program certs have no single course)
ALTER TABLE public.certificates ALTER COLUMN course_id DROP NOT NULL;

-- A cert must belong to exactly one of course/program per its kind
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_kind_target;
ALTER TABLE public.certificates ADD CONSTRAINT certificates_kind_target CHECK (
  (kind = 'course' AND course_id IS NOT NULL)
  OR (kind = 'program' AND program_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS certificates_program_idx
  ON public.certificates (program_id) WHERE program_id IS NOT NULL;

COMMIT;
