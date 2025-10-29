-- =====================================================
-- ROLLBACK SCRIPT FOR ITERATION 1
-- Run this if you need to undo the migration
-- =====================================================

-- 1. Drop RLS policies
DROP POLICY IF EXISTS "Super admins can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can read own certificates" ON certificates;
DROP POLICY IF EXISTS "Super admins can read all certificates" ON certificates;
DROP POLICY IF EXISTS "System can manage certificates" ON certificates;
DROP POLICY IF EXISTS "Super admins can read org metrics" ON org_metrics_daily;

-- 2. Drop new tables
DROP TABLE IF EXISTS org_metrics_daily CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- 3. Drop indexes on users table
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_last_seen_at;

-- 4. Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS last_seen_at CASCADE;

-- 5. Drop custom type
DROP TYPE IF EXISTS user_status CASCADE;

-- 6. Drop trigger function (if not used elsewhere)
-- Note: Only drop if no other tables use this trigger
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Verify rollback
DO $$
BEGIN
  RAISE NOTICE 'Rollback 001_admin_foundation completed successfully';
  RAISE NOTICE 'All admin foundation changes have been reverted';
END $$;