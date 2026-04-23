-- =====================================================
-- ROLLBACK: Institution Layer Foundation
-- Run this to undo migration 002
-- =====================================================

-- Drop helper functions
DROP FUNCTION IF EXISTS is_platform_admin(UUID);
DROP FUNCTION IF EXISTS is_institution_admin(UUID, UUID);
DROP FUNCTION IF EXISTS generate_slug(TEXT);

-- Drop triggers
DROP TRIGGER IF EXISTS update_instructor_profiles_updated_at ON instructor_profiles;
DROP TRIGGER IF EXISTS update_institution_members_updated_at ON institution_members;
DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;

-- Drop tables (cascade drops policies)
DROP TABLE IF EXISTS instructor_profiles CASCADE;
DROP TABLE IF EXISTS institution_members CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;

-- Drop column from users
ALTER TABLE users DROP COLUMN IF EXISTS platform_role;

-- Drop enums (must be after tables that use them)
DROP TYPE IF EXISTS instructor_status;
DROP TYPE IF EXISTS platform_role;
DROP TYPE IF EXISTS institution_member_status;
DROP TYPE IF EXISTS institution_role;
DROP TYPE IF EXISTS institution_status;
DROP TYPE IF EXISTS institution_type;

DO $$
BEGIN
  RAISE NOTICE 'Rollback 002_institution_layer completed';
END $$;