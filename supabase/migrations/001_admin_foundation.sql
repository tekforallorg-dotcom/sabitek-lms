-- =====================================================
-- ITERATION 1: Admin Dashboard Foundation
-- Adds admin-specific columns and tables
-- Safe to run - does NOT modify existing data
-- =====================================================

-- 1. ADD NEW COLUMNS TO USERS TABLE
-- =====================================================

-- Add is_super_admin column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false NOT NULL;

-- Add status column for user management (active/suspended/deactivated/soft_deleted)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deactivated', 'soft_deleted');
  END IF;
END $$;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active' NOT NULL;

-- Add last_seen_at for MAU tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at);

COMMENT ON COLUMN users.is_super_admin IS 'Super admin flag for full platform access';
COMMENT ON COLUMN users.status IS 'User account status for admin management';
COMMENT ON COLUMN users.last_seen_at IS 'Last activity timestamp for MAU calculations';


-- 2. CREATE AUDIT_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

COMMENT ON TABLE audit_logs IS 'Audit trail for all admin actions';


-- 3. CREATE CERTIFICATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_code TEXT UNIQUE NOT NULL,
  file_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Ensure one certificate per user per course
  UNIQUE(user_id, course_id)
);

-- Indexes for certificate queries
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);

COMMENT ON TABLE certificates IS 'Generated certificates for course completion';


-- 4. CREATE ORG_METRICS_DAILY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS org_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  mau INTEGER DEFAULT 0,
  new_enrollments INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  avg_time_to_complete_minutes INTEGER DEFAULT 0,
  quiz_pass_rate NUMERIC(5,2) DEFAULT 0,
  total_active_users INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  total_instructors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_org_metrics_date ON org_metrics_daily(date DESC);

COMMENT ON TABLE org_metrics_daily IS 'Precomputed daily metrics for admin dashboard';


-- 5. ADD COURSE STATUS ENUM VALUE (if not exists)
-- =====================================================

-- Check if 'unpublished' value exists in course_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'unpublished' 
    AND enumtypid = 'course_status'::regtype
  ) THEN
    ALTER TYPE course_status ADD VALUE 'unpublished';
  END IF;
END $$;


-- 6. ADD UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to certificates
DROP TRIGGER IF EXISTS update_certificates_updated_at ON certificates;
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to org_metrics_daily
DROP TRIGGER IF EXISTS update_org_metrics_updated_at ON org_metrics_daily;
CREATE TRIGGER update_org_metrics_updated_at
  BEFORE UPDATE ON org_metrics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 7. ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_metrics_daily ENABLE ROW LEVEL SECURITY;


-- 8. CREATE BASIC RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Audit Logs: Only super admins can read
CREATE POLICY "Super admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

-- Audit Logs: System can insert (service role)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Service role will handle this


-- Certificates: Users can read their own certificates
CREATE POLICY "Users can read own certificates"
  ON certificates FOR SELECT
  USING (user_id = auth.uid());

-- Certificates: Super admins can read all certificates
CREATE POLICY "Super admins can read all certificates"
  ON certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

-- Certificates: System can insert/update (service role)
CREATE POLICY "System can manage certificates"
  ON certificates FOR ALL
  USING (true); -- Service role will handle this


-- Org Metrics: Only super admins can read
CREATE POLICY "Super admins can read org metrics"
  ON org_metrics_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_admin_foundation completed successfully';
  RAISE NOTICE 'Added columns: users.is_super_admin, users.status, users.last_seen_at';
  RAISE NOTICE 'Created tables: audit_logs, certificates, org_metrics_daily';
  RAISE NOTICE 'RLS policies created for admin access';
END $$;