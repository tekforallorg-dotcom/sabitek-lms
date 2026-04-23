-- =====================================================
-- ITERATION 1: Institution Layer Foundation
-- Adds institutions, members, and role-based access
-- Safe to run - does NOT modify existing data
-- =====================================================

-- 1. CREATE ENUMS FOR INSTITUTION LAYER
-- =====================================================

-- Institution type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institution_type') THEN
    CREATE TYPE institution_type AS ENUM (
      'school',
      'ngo',
      'government',
      'training_center',
      'company',
      'other'
    );
  END IF;
END $$;

-- Institution status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institution_status') THEN
    CREATE TYPE institution_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'suspended',
      'archived'
    );
  END IF;
END $$;

-- Institution member role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institution_role') THEN
    CREATE TYPE institution_role AS ENUM (
      'institution_admin',
      'program_manager',
      'facilitator',
      'viewer'
    );
  END IF;
END $$;

-- Institution member status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institution_member_status') THEN
    CREATE TYPE institution_member_status AS ENUM (
      'active',
      'invited',
      'suspended'
    );
  END IF;
END $$;


-- 2. CREATE INSTITUTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type institution_type NOT NULL DEFAULT 'other',
  description TEXT,
  
  -- Location (optional)
  country TEXT,
  state TEXT,
  lga TEXT,
  address TEXT,
  
  -- Contact
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  email_domain_allowlist TEXT[], -- e.g., ['@school.edu.ng']
  
  -- Branding
  logo_url TEXT,
  accent_color TEXT DEFAULT '#dc2626', -- Sabitek red
  banner_url TEXT,
  
  -- Status and verification
  status institution_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for institutions
CREATE INDEX IF NOT EXISTS idx_institutions_slug ON institutions(slug);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(type);
CREATE INDEX IF NOT EXISTS idx_institutions_created_by ON institutions(created_by);
CREATE INDEX IF NOT EXISTS idx_institutions_country ON institutions(country);

COMMENT ON TABLE institutions IS 'Organizations that run learning programs on Sabitek';
COMMENT ON COLUMN institutions.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN institutions.email_domain_allowlist IS 'Allowed email domains for auto-join';
COMMENT ON COLUMN institutions.status IS 'Approval workflow status';


-- 3. CREATE INSTITUTION_MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS institution_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role and status
  role institution_role NOT NULL DEFAULT 'viewer',
  status institution_member_status NOT NULL DEFAULT 'invited',
  
  -- Invitation tracking
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  
  -- Suspension tracking
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES users(id),
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Ensure one membership per user per institution
  UNIQUE(institution_id, user_id)
);

-- Indexes for institution_members
CREATE INDEX IF NOT EXISTS idx_institution_members_institution ON institution_members(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_user ON institution_members(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_role ON institution_members(role);
CREATE INDEX IF NOT EXISTS idx_institution_members_status ON institution_members(status);

COMMENT ON TABLE institution_members IS 'User memberships and roles within institutions';
COMMENT ON COLUMN institution_members.role IS 'Permission level within the institution';


-- 4. ADD PLATFORM ROLE TO USERS TABLE
-- =====================================================

-- Platform-level roles (distinct from institution roles)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_role') THEN
    CREATE TYPE platform_role AS ENUM (
      'super_admin',
      'ops',
      'trust_safety',
      'partnerships',
      'support'
    );
  END IF;
END $$;

-- Add platform_role column to users (nullable - most users don't have one)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS platform_role platform_role;

CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role);

COMMENT ON COLUMN users.platform_role IS 'Platform-level administrative role';


-- 5. CREATE INSTRUCTOR PROFILES TABLE
-- =====================================================

-- Instructor status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instructor_status') THEN
    CREATE TYPE instructor_status AS ENUM (
      'pending',
      'approved',
      'limited',
      'suspended'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS instructor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference (one profile per user)
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Profile info
  headline TEXT,
  bio TEXT,
  specializations TEXT[],
  years_experience INTEGER,
  
  -- Affiliation (optional)
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  
  -- Status and approval
  status instructor_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  -- Settings
  can_publish_public BOOLEAN DEFAULT false,
  can_monetize BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for instructor_profiles
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user ON instructor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_status ON instructor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_institution ON instructor_profiles(institution_id);

COMMENT ON TABLE instructor_profiles IS 'Extended profile for users who create courses';
COMMENT ON COLUMN instructor_profiles.can_publish_public IS 'Can publish courses visible to all users';
COMMENT ON COLUMN instructor_profiles.can_monetize IS 'Can set prices on courses';


-- 6. ADD UPDATED_AT TRIGGERS
-- =====================================================

-- Apply trigger to institutions
DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;
CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to institution_members
DROP TRIGGER IF EXISTS update_institution_members_updated_at ON institution_members;
CREATE TRIGGER update_institution_members_updated_at
  BEFORE UPDATE ON institution_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to instructor_profiles
DROP TRIGGER IF EXISTS update_instructor_profiles_updated_at ON instructor_profiles;
CREATE TRIGGER update_instructor_profiles_updated_at
  BEFORE UPDATE ON instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 7. ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;


-- 8. CREATE RLS POLICIES
-- =====================================================

-- ==================== INSTITUTIONS ====================

-- Anyone can view approved institutions (for public discovery)
CREATE POLICY "Anyone can view approved institutions"
  ON institutions FOR SELECT
  USING (status = 'approved');

-- Users can view their own pending institution (creator)
CREATE POLICY "Creators can view own pending institution"
  ON institutions FOR SELECT
  USING (created_by = auth.uid());

-- Institution members can view their institution
CREATE POLICY "Members can view their institution"
  ON institutions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institutions.id
      AND institution_members.user_id = auth.uid()
      AND institution_members.status = 'active'
    )
  );

-- Super admins and platform roles can view all institutions
CREATE POLICY "Platform admins can view all institutions"
  ON institutions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_super_admin = true OR users.platform_role IS NOT NULL)
    )
  );

-- Authenticated users can create institutions (application)
CREATE POLICY "Authenticated users can create institution applications"
  ON institutions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Institution admins can update their institution
CREATE POLICY "Institution admins can update their institution"
  ON institutions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institutions.id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role = 'institution_admin'
      AND institution_members.status = 'active'
    )
  );

-- Platform admins can update any institution (for approval)
CREATE POLICY "Platform admins can update any institution"
  ON institutions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_super_admin = true OR users.platform_role IS NOT NULL)
    )
  );


-- ==================== INSTITUTION MEMBERS ====================

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON institution_members FOR SELECT
  USING (user_id = auth.uid());

-- Institution admins can view all members in their institution
CREATE POLICY "Institution admins can view institution members"
  ON institution_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institution_members AS admin_check
      WHERE admin_check.institution_id = institution_members.institution_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role IN ('institution_admin', 'program_manager')
      AND admin_check.status = 'active'
    )
  );

-- Platform admins can view all memberships
CREATE POLICY "Platform admins can view all memberships"
  ON institution_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_super_admin = true OR users.platform_role IS NOT NULL)
    )
  );

-- Institution admins can manage members
CREATE POLICY "Institution admins can manage members"
  ON institution_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM institution_members AS admin_check
      WHERE admin_check.institution_id = institution_members.institution_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role = 'institution_admin'
      AND admin_check.status = 'active'
    )
  );

-- Users can accept their own invitations
CREATE POLICY "Users can accept own invitations"
  ON institution_members FOR UPDATE
  USING (user_id = auth.uid() AND status = 'invited');


-- ==================== INSTRUCTOR PROFILES ====================

-- Users can view their own instructor profile
CREATE POLICY "Users can view own instructor profile"
  ON instructor_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Anyone can view approved instructor profiles (public)
CREATE POLICY "Anyone can view approved instructor profiles"
  ON instructor_profiles FOR SELECT
  USING (status = 'approved');

-- Users can create their own instructor profile
CREATE POLICY "Users can create own instructor profile"
  ON instructor_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own instructor profile
CREATE POLICY "Users can update own instructor profile"
  ON instructor_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Platform admins can manage all instructor profiles
CREATE POLICY "Platform admins can manage instructor profiles"
  ON instructor_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_super_admin = true OR users.platform_role IS NOT NULL)
    )
  );


-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to generate URL-friendly slug
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(name),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user is institution admin
CREATE OR REPLACE FUNCTION is_institution_admin(p_institution_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members
    WHERE institution_id = p_institution_id
    AND user_id = p_user_id
    AND role = 'institution_admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id
    AND (is_super_admin = true OR platform_role IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 002_institution_layer completed successfully';
  RAISE NOTICE 'Created enums: institution_type, institution_status, institution_role, institution_member_status, platform_role, instructor_status';
  RAISE NOTICE 'Created tables: institutions, institution_members, instructor_profiles';
  RAISE NOTICE 'Added column: users.platform_role';
  RAISE NOTICE 'Created RLS policies for institution-scoped access';
  RAISE NOTICE 'Created helper functions: generate_slug, is_institution_admin, is_platform_admin';
END $$;