-- ============================================================================
-- MIGRATION: platform_settings (Iteration 4.5 — Slice A, Feature Flags)
-- Date: 2026-04-16
-- Forward: creates platform_settings, enables RLS, seeds six Model-A flags
-- Rollback: see block at bottom (commented — run manually if ever needed)
-- ============================================================================

-- 1) Table
CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE  platform_settings IS 'Platform-wide key/value settings & feature flags. Writable only by super admins.';
COMMENT ON COLUMN platform_settings.key         IS 'Stable snake_case identifier; e.g. public_signup_enabled';
COMMENT ON COLUMN platform_settings.value       IS 'JSONB — booleans, numbers, objects. Readers cast as needed.';
COMMENT ON COLUMN platform_settings.is_public   IS 'When true, GET /api/platform/flags exposes this key to clients. Default false (server-only).';
COMMENT ON COLUMN platform_settings.updated_by  IS 'User who last wrote this row (null for seeded system rows).';

-- 2) updated_at auto-touch
CREATE OR REPLACE FUNCTION platform_settings_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION platform_settings_touch_updated_at();

-- 3) RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Super admins can read everything
DROP POLICY IF EXISTS platform_settings_super_admin_select ON platform_settings;
CREATE POLICY platform_settings_super_admin_select
  ON platform_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.is_super_admin = TRUE OR users.platform_role IS NOT NULL)
    )
  );

-- Super admins can write everything
DROP POLICY IF EXISTS platform_settings_super_admin_write ON platform_settings;
CREATE POLICY platform_settings_super_admin_write
  ON platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.is_super_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.is_super_admin = TRUE
    )
  );

-- NOTE: service_role bypasses RLS automatically (that's how server reads happen).
-- Anon / authenticated users without super-admin flag get zero rows — by design.

-- 4) Seed Model-A defaults (idempotent via ON CONFLICT)
INSERT INTO platform_settings (key, value, description, is_public) VALUES
  ('public_signup_enabled',       'false'::jsonb, 'If true, /auth/register accepts users without an invite token. Model A default: false.', FALSE),
  ('waitlist_enabled',            'true'::jsonb,  'Show waitlist CTA on homepage/login/register when public signup is disabled.',            FALSE),
  ('provider_apps_enabled',       'false'::jsonb, 'Accept Verified Training Provider applications. Off until Slice 4.5.6 ships.',            FALSE),
  ('institution_apps_enabled',    'true'::jsonb,  'Accept institution "Request a workspace" applications.',                                   FALSE),
  ('domain_allowlist_enforced',   'true'::jsonb,  'Enforce institution email_domain_allowlist on join/accept.',                               FALSE),
  ('require_instructor_approval', 'true'::jsonb,  'Independent instructors need manual approval to publish publicly / monetize.',             FALSE)
ON CONFLICT (key) DO NOTHING;

-- 5) Verification block (runs during migration; logs counts)
DO $$
DECLARE
  seeded_count INT;
BEGIN
  SELECT COUNT(*) INTO seeded_count FROM platform_settings
   WHERE key IN (
     'public_signup_enabled','waitlist_enabled','provider_apps_enabled',
     'institution_apps_enabled','domain_allowlist_enforced','require_instructor_approval'
   );
  IF seeded_count <> 6 THEN
    RAISE WARNING 'platform_settings seed count = % (expected 6). Check ON CONFLICT path.', seeded_count;
  ELSE
    RAISE NOTICE 'platform_settings seeded OK (6 rows).';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK (manual — not auto-executed)
-- ============================================================================
-- DROP TRIGGER  IF EXISTS trg_platform_settings_updated_at ON platform_settings;
-- DROP FUNCTION IF EXISTS platform_settings_touch_updated_at();
-- DROP POLICY   IF EXISTS platform_settings_super_admin_select ON platform_settings;
-- DROP POLICY   IF EXISTS platform_settings_super_admin_write  ON platform_settings;
-- DROP TABLE    IF EXISTS platform_settings;