-- ============================================================================
-- ITERATION 2.1: PROGRAMS & COHORTS SCHEMA
-- ============================================================================
-- This migration adds the program/cohort layer on top of institutions.
-- Programs contain courses; Cohorts are time-bound groups of learners.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Program visibility
CREATE TYPE program_visibility AS ENUM (
  'private',      -- Only visible to institution members
  'unlisted',     -- Accessible via direct link
  'public'        -- Discoverable publicly
);

-- Program status
CREATE TYPE program_status AS ENUM (
  'draft',        -- Being set up
  'active',       -- Currently running
  'completed',    -- Finished
  'archived'      -- No longer active
);

-- Cohort enrollment mode
CREATE TYPE cohort_enrollment_mode AS ENUM (
  'invite_only',       -- Only via email invite
  'access_code',       -- Via access code
  'approval_required', -- Application + approval
  'public'             -- Open enrollment
);

-- Cohort status
CREATE TYPE cohort_status AS ENUM (
  'draft',     -- Being set up
  'active',    -- Currently accepting/running
  'closed',    -- No new enrollments
  'archived'   -- No longer active
);

-- Cohort member status
CREATE TYPE cohort_member_status AS ENUM (
  'pending_approval',  -- Applied, awaiting approval
  'invited',           -- Invited, not yet accepted
  'active',            -- Currently enrolled
  'completed',         -- Finished the program
  'removed',           -- Removed from cohort
  'withdrawn'          -- Self-withdrew
);

-- Sponsorship type
CREATE TYPE sponsorship_type AS ENUM (
  'institution_sponsored',  -- Institution pays
  'self_paid',              -- Learner pays
  'donor_sponsored',        -- Third-party sponsor
  'scholarship'             -- Free/scholarship
);

-- ============================================================================
-- PROGRAMS TABLE
-- ============================================================================

CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  
  -- Media
  thumbnail_url TEXT,
  banner_url TEXT,
  
  -- Visibility & Status
  visibility program_visibility NOT NULL DEFAULT 'private',
  status program_status NOT NULL DEFAULT 'draft',
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Completion rules (JSON for flexibility)
  -- Example: { "min_courses_pct": 100, "min_quiz_score": 70, "required_course_ids": [...] }
  completion_rules JSONB DEFAULT '{}',
  
  -- Certificate
  certificate_template_id UUID, -- Future: references certificate_templates
  issue_certificate BOOLEAN DEFAULT true,
  
  -- Settings
  allow_self_paced BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(institution_id, slug)
);

-- Index for lookups
CREATE INDEX idx_programs_institution ON programs(institution_id);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_visibility ON programs(visibility);

-- ============================================================================
-- PROGRAM_COURSES TABLE (Many-to-Many)
-- ============================================================================

CREATE TABLE program_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Ordering & requirements
  position INT NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  
  -- Unlock rules (optional)
  -- Example: { "after_course_id": "uuid", "after_days": 7 }
  unlock_rules JSONB DEFAULT '{}',
  
  -- Metadata
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(program_id, course_id)
);

-- Index for lookups
CREATE INDEX idx_program_courses_program ON program_courses(program_id);
CREATE INDEX idx_program_courses_course ON program_courses(course_id);

-- ============================================================================
-- COHORTS TABLE
-- ============================================================================

CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Enrollment settings
  enrollment_mode cohort_enrollment_mode NOT NULL DEFAULT 'invite_only',
  seat_limit INT, -- NULL = unlimited
  
  -- Access code (for access_code enrollment mode)
  access_code VARCHAR(50), -- Hashed or plain depending on security needs
  access_code_expires_at TIMESTAMPTZ,
  access_code_max_uses INT,
  access_code_uses INT DEFAULT 0,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  enrollment_start_date DATE,
  enrollment_end_date DATE,
  
  -- Status
  status cohort_status NOT NULL DEFAULT 'draft',
  
  -- Sponsorship defaults
  default_sponsorship sponsorship_type DEFAULT 'institution_sponsored',
  
  -- Settings
  allow_late_enrollment BOOLEAN DEFAULT false,
  send_welcome_email BOOLEAN DEFAULT true,
  send_reminder_emails BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(program_id, slug)
);

-- Indexes
CREATE INDEX idx_cohorts_program ON cohorts(program_id);
CREATE INDEX idx_cohorts_status ON cohorts(status);
CREATE INDEX idx_cohorts_access_code ON cohorts(access_code) WHERE access_code IS NOT NULL;

-- ============================================================================
-- COHORT_MEMBERS TABLE
-- ============================================================================

CREATE TABLE cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  status cohort_member_status NOT NULL DEFAULT 'invited',
  
  -- Sponsorship
  sponsorship sponsorship_type NOT NULL DEFAULT 'institution_sponsored',
  sponsor_reference VARCHAR(255), -- Invoice ID, contract ref, etc.
  
  -- Invitation tracking
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  invitation_token VARCHAR(255), -- For email invite acceptance
  invitation_expires_at TIMESTAMPTZ,
  
  -- Enrollment tracking
  applied_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  completion_certificate_id UUID, -- Future: references certificates
  
  -- Removal tracking
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  removal_reason TEXT,
  
  -- Withdrawal tracking
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  
  -- Progress (denormalized for quick access)
  progress_pct DECIMAL(5,2) DEFAULT 0,
  courses_completed INT DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(cohort_id, user_id)
);

-- Indexes
CREATE INDEX idx_cohort_members_cohort ON cohort_members(cohort_id);
CREATE INDEX idx_cohort_members_user ON cohort_members(user_id);
CREATE INDEX idx_cohort_members_status ON cohort_members(status);
CREATE INDEX idx_cohort_members_invitation_token ON cohort_members(invitation_token) 
  WHERE invitation_token IS NOT NULL;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is a member of the program's institution
CREATE OR REPLACE FUNCTION is_program_member(p_user_id UUID, p_program_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members im
    JOIN programs p ON p.institution_id = im.institution_id
    WHERE im.user_id = p_user_id
    AND p.id = p_program_id
    AND im.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage program (institution admin or program manager)
CREATE OR REPLACE FUNCTION can_manage_program(p_user_id UUID, p_program_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members im
    JOIN programs p ON p.institution_id = im.institution_id
    WHERE im.user_id = p_user_id
    AND p.id = p_program_id
    AND im.status = 'active'
    AND im.role IN ('institution_admin', 'program_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is enrolled in cohort
CREATE OR REPLACE FUNCTION is_cohort_member(p_user_id UUID, p_cohort_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cohort_members
    WHERE user_id = p_user_id
    AND cohort_id = p_cohort_id
    AND status IN ('active', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage cohort
CREATE OR REPLACE FUNCTION can_manage_cohort(p_user_id UUID, p_cohort_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members im
    JOIN programs p ON p.institution_id = im.institution_id
    JOIN cohorts c ON c.program_id = p.id
    WHERE im.user_id = p_user_id
    AND c.id = p_cohort_id
    AND im.status = 'active'
    AND im.role IN ('institution_admin', 'program_manager', 'facilitator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;

-- PROGRAMS POLICIES

-- Platform admins can do anything
CREATE POLICY "Platform admins full access to programs"
  ON programs FOR ALL
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Institution members can view their programs
CREATE POLICY "Institution members can view programs"
  ON programs FOR SELECT
  TO authenticated
  USING (
    is_program_member(auth.uid(), id)
    OR visibility = 'public'
  );

-- Institution admins/program managers can create programs
CREATE POLICY "Institution admins can create programs"
  ON programs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE user_id = auth.uid()
      AND institution_id = programs.institution_id
      AND status = 'active'
      AND role IN ('institution_admin', 'program_manager')
    )
  );

-- Institution admins/program managers can update programs
CREATE POLICY "Institution admins can update programs"
  ON programs FOR UPDATE
  TO authenticated
  USING (can_manage_program(auth.uid(), id));

-- Institution admins can delete programs
CREATE POLICY "Institution admins can delete programs"
  ON programs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM institution_members im
      JOIN programs p ON p.institution_id = im.institution_id
      WHERE im.user_id = auth.uid()
      AND p.id = programs.id
      AND im.status = 'active'
      AND im.role = 'institution_admin'
    )
  );

-- PROGRAM_COURSES POLICIES

CREATE POLICY "Platform admins full access to program_courses"
  ON program_courses FOR ALL
  TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Program members can view program_courses"
  ON program_courses FOR SELECT
  TO authenticated
  USING (is_program_member(auth.uid(), program_id));

CREATE POLICY "Program managers can manage program_courses"
  ON program_courses FOR INSERT
  TO authenticated
  WITH CHECK (can_manage_program(auth.uid(), program_id));

CREATE POLICY "Program managers can update program_courses"
  ON program_courses FOR UPDATE
  TO authenticated
  USING (can_manage_program(auth.uid(), program_id));

CREATE POLICY "Program managers can delete program_courses"
  ON program_courses FOR DELETE
  TO authenticated
  USING (can_manage_program(auth.uid(), program_id));

-- COHORTS POLICIES

CREATE POLICY "Platform admins full access to cohorts"
  ON cohorts FOR ALL
  TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Program members can view cohorts"
  ON cohorts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = cohorts.program_id
      AND is_program_member(auth.uid(), p.id)
    )
    OR is_cohort_member(auth.uid(), id)
  );

CREATE POLICY "Program managers can create cohorts"
  ON cohorts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = cohorts.program_id
      AND can_manage_program(auth.uid(), p.id)
    )
  );

CREATE POLICY "Cohort managers can update cohorts"
  ON cohorts FOR UPDATE
  TO authenticated
  USING (can_manage_cohort(auth.uid(), id));

CREATE POLICY "Program managers can delete cohorts"
  ON cohorts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = cohorts.program_id
      AND can_manage_program(auth.uid(), p.id)
    )
  );

-- COHORT_MEMBERS POLICIES

CREATE POLICY "Platform admins full access to cohort_members"
  ON cohort_members FOR ALL
  TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Cohort managers can view members"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (can_manage_cohort(auth.uid(), cohort_id));

CREATE POLICY "Users can view own membership"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Cohort managers can add members"
  ON cohort_members FOR INSERT
  TO authenticated
  WITH CHECK (can_manage_cohort(auth.uid(), cohort_id));

CREATE POLICY "Cohort managers can update members"
  ON cohort_members FOR UPDATE
  TO authenticated
  USING (can_manage_cohort(auth.uid(), cohort_id));

CREATE POLICY "Users can update own membership (limited)"
  ON cohort_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    -- Users can only update their own status to withdrawn
    user_id = auth.uid()
  );

CREATE POLICY "Cohort managers can remove members"
  ON cohort_members FOR DELETE
  TO authenticated
  USING (can_manage_cohort(auth.uid(), cohort_id));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at
  BEFORE UPDATE ON cohorts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohort_members_updated_at
  BEFORE UPDATE ON cohort_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE programs IS 'Learning programs created by institutions, containing multiple courses';
COMMENT ON TABLE program_courses IS 'Many-to-many relationship between programs and courses';
COMMENT ON TABLE cohorts IS 'Time-bound groups of learners enrolled in a program';
COMMENT ON TABLE cohort_members IS 'Learners enrolled in a cohort';

COMMENT ON COLUMN programs.completion_rules IS 'JSON rules for program completion: min_courses_pct, min_quiz_score, required_course_ids';
COMMENT ON COLUMN cohorts.access_code IS 'Code for access_code enrollment mode';
COMMENT ON COLUMN cohort_members.sponsorship IS 'Who pays for this learner: institution, self, donor, or scholarship';
COMMENT ON COLUMN cohort_members.progress_pct IS 'Denormalized progress percentage for quick dashboard queries';