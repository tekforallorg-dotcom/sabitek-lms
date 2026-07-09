-- ============================================================
-- Capture cohort_invites into migration history.
--
-- This table (and its enums, constraints, indexes, and RLS
-- policies) was created directly in the Supabase dashboard and
-- never tracked in a migration. Applying this file to production
-- is a no-op; in a fresh environment it recreates the exact
-- production definition as of 2026-07-09.
-- ============================================================

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cohort_invite_type') THEN
    CREATE TYPE cohort_invite_type AS ENUM ('LINK', 'QR', 'EMAIL_CAMPAIGN', 'BULK_CSV');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cohort_invite_status') THEN
    CREATE TYPE cohort_invite_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'EXHAUSTED');
  END IF;
END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.cohort_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id     uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  token         varchar NOT NULL,
  type          cohort_invite_type NOT NULL DEFAULT 'LINK',
  status        cohort_invite_status NOT NULL DEFAULT 'ACTIVE',
  expires_at    timestamptz,
  max_uses      integer,
  use_count     integer NOT NULL DEFAULT 0,
  created_by    uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz,
  revoked_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  revoke_reason text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT cohort_invites_token_key UNIQUE (token),
  CONSTRAINT cohort_invites_max_uses_positive
    CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT cohort_invites_use_count_nonneg
    CHECK (use_count >= 0),
  CONSTRAINT cohort_invites_use_count_not_over
    CHECK (max_uses IS NULL OR use_count <= max_uses),
  CONSTRAINT cohort_invites_revoke_consistency
    CHECK (
      (status = 'REVOKED' AND revoked_at IS NOT NULL)
      OR (status <> 'REVOKED' AND revoked_at IS NULL)
    )
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_cohort_invites_token
  ON public.cohort_invites (token);
CREATE INDEX IF NOT EXISTS idx_cohort_invites_cohort_id
  ON public.cohort_invites (cohort_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_invites_active
  ON public.cohort_invites (cohort_id, status)
  WHERE status = 'ACTIVE';

-- RLS
ALTER TABLE public.cohort_invites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_invites'
      AND policyname = 'cohort_invites_select_staff'
  ) THEN
    CREATE POLICY cohort_invites_select_staff ON public.cohort_invites
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM cohorts c
          JOIN programs p ON p.id = c.program_id
          JOIN institution_members im ON im.institution_id = p.institution_id
          WHERE c.id = cohort_invites.cohort_id
            AND im.user_id = auth.uid()
            AND im.status = 'active'::institution_member_status
            AND im.role = ANY (ARRAY[
              'institution_admin'::institution_role,
              'program_manager'::institution_role,
              'facilitator'::institution_role
            ])
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_invites'
      AND policyname = 'cohort_invites_insert_staff'
  ) THEN
    CREATE POLICY cohort_invites_insert_staff ON public.cohort_invites
      FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
          SELECT 1
          FROM cohorts c
          JOIN programs p ON p.id = c.program_id
          JOIN institution_members im ON im.institution_id = p.institution_id
          WHERE c.id = cohort_invites.cohort_id
            AND im.user_id = auth.uid()
            AND im.status = 'active'::institution_member_status
            AND im.role = ANY (ARRAY[
              'institution_admin'::institution_role,
              'program_manager'::institution_role
            ])
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_invites'
      AND policyname = 'cohort_invites_update_staff'
  ) THEN
    CREATE POLICY cohort_invites_update_staff ON public.cohort_invites
      FOR UPDATE USING (
        EXISTS (
          SELECT 1
          FROM cohorts c
          JOIN programs p ON p.id = c.program_id
          JOIN institution_members im ON im.institution_id = p.institution_id
          WHERE c.id = cohort_invites.cohort_id
            AND im.user_id = auth.uid()
            AND im.status = 'active'::institution_member_status
            AND im.role = ANY (ARRAY[
              'institution_admin'::institution_role,
              'program_manager'::institution_role
            ])
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_invites'
      AND policyname = 'cohort_invites_select_platform_admin'
  ) THEN
    CREATE POLICY cohort_invites_select_platform_admin ON public.cohort_invites
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
            AND (u.is_super_admin = true OR u.platform_role IS NOT NULL)
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_invites'
      AND policyname = 'cohort_invites_all_platform_admin'
  ) THEN
    CREATE POLICY cohort_invites_all_platform_admin ON public.cohort_invites
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
            AND (u.is_super_admin = true OR u.platform_role IS NOT NULL)
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
            AND (u.is_super_admin = true OR u.platform_role IS NOT NULL)
        )
      );
  END IF;
END $$;
