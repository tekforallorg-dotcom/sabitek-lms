-- ============================================================
-- Institution team invites.
--
-- 1. Adds 'instructor' to institution_role: institutions can now
--    grant the instructor role (previously impossible — the enum
--    only had institution_admin/program_manager/facilitator/viewer).
-- 2. Creates institution_invites: token-based invites (mirroring
--    the proven cohort_invites mechanics) so admins can onboard
--    team members who do NOT have an account yet. The old
--    members endpoint required the invitee to already exist.
--
-- Purely additive; safe to apply before the app code ships.
-- ============================================================

ALTER TYPE institution_role ADD VALUE IF NOT EXISTS 'instructor';

CREATE TABLE IF NOT EXISTS public.institution_invites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  role           institution_role NOT NULL DEFAULT 'viewer',
  email          text,
  token          varchar NOT NULL,
  status         cohort_invite_status NOT NULL DEFAULT 'ACTIVE',
  expires_at     timestamptz,
  max_uses       integer,
  use_count      integer NOT NULL DEFAULT 0,
  created_by     uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at     timestamptz NOT NULL DEFAULT now(),
  revoked_at     timestamptz,
  revoked_by     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT institution_invites_token_key UNIQUE (token),
  CONSTRAINT institution_invites_max_uses_positive
    CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT institution_invites_use_count_nonneg
    CHECK (use_count >= 0),
  CONSTRAINT institution_invites_use_count_not_over
    CHECK (max_uses IS NULL OR use_count <= max_uses),
  CONSTRAINT institution_invites_revoke_consistency
    CHECK (
      (status = 'REVOKED' AND revoked_at IS NOT NULL)
      OR (status <> 'REVOKED' AND revoked_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_institution_invites_institution
  ON public.institution_invites (institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_institution_invites_active
  ON public.institution_invites (institution_id, status)
  WHERE status = 'ACTIVE';

ALTER TABLE public.institution_invites ENABLE ROW LEVEL SECURITY;

-- Institution admins manage their institution's invites.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'institution_invites'
      AND policyname = 'institution_invites_admin_all'
  ) THEN
    CREATE POLICY institution_invites_admin_all ON public.institution_invites
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM institution_members im
          WHERE im.institution_id = institution_invites.institution_id
            AND im.user_id = auth.uid()
            AND im.status = 'active'::institution_member_status
            AND im.role = 'institution_admin'::institution_role
        )
      ) WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM institution_members im
          WHERE im.institution_id = institution_invites.institution_id
            AND im.user_id = auth.uid()
            AND im.status = 'active'::institution_member_status
            AND im.role = 'institution_admin'::institution_role
        )
      );
  END IF;
END $$;

-- Platform staff full access.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'institution_invites'
      AND policyname = 'institution_invites_platform_admin'
  ) THEN
    CREATE POLICY institution_invites_platform_admin ON public.institution_invites
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
