/**
 * Vertical Pack Templates — OmniBiz-style configuration packs
 *
 * Each institution type gets default terminology, KPIs, onboarding steps,
 * reporting format, and required fields. These are stored as JSONB on the
 * institutions table and can be customized per-institution.
 *
 * Design principle: same engine, different language and priorities.
 */

export type InstitutionVerticalType =
  | 'school'
  | 'ngo'
  | 'government'
  | 'training_center'
  | 'company'
  | 'other'

/* ── Terminology Pack ── */
export interface TerminologyPack {
  /** What learners are called */
  learner: string
  learner_plural: string
  /** What instructors/facilitators are called */
  instructor: string
  instructor_plural: string
  /** What a program is called */
  program: string
  program_plural: string
  /** What a cohort is called */
  cohort: string
  cohort_plural: string
  /** What a course is called */
  course: string
  course_plural: string
  /** What completion means */
  completion: string
  /** What the institution dashboard is called */
  dashboard_title: string
  /** CTA label for inviting learners */
  invite_cta: string
}

/* ── KPI Pack ── */
export interface KpiPack {
  /** Primary metrics shown first on dashboard */
  primary_metrics: string[]
  /** Secondary metrics shown below */
  secondary_metrics: string[]
  /** Chart types to prioritize */
  chart_types: string[]
}

/* ── Onboarding Pack ── */
export interface OnboardingStep {
  id: string
  title: string
  description: string
  required: boolean
}

export interface OnboardingPack {
  steps: OnboardingStep[]
  welcome_message: string
  setup_checklist: string[]
}

/* ── Reporting Pack ── */
export type ReportingFormat = 'ACADEMIC' | 'DONOR' | 'WORKFORCE' | 'GOV_COMPLIANCE' | 'GENERAL'

export interface ReportingPack {
  format: ReportingFormat
  exports: ('csv' | 'pdf' | 'evidence_pack')[]
  default_metrics: string[]
  evidence_pack_enabled: boolean
}

/* ── Required Fields Pack ── */
export interface RequiredFieldsPack {
  /** Extra fields shown during institution setup */
  fields: {
    key: string
    label: string
    type: 'text' | 'number' | 'select' | 'date'
    options?: string[]
    required: boolean
    placeholder?: string
  }[]
}

/* ── Combined Pack Type ── */
export interface VerticalPacks {
  terminology_pack: TerminologyPack
  kpi_pack: KpiPack
  onboarding_pack: OnboardingPack
  reporting_pack: ReportingPack
  required_fields_pack: RequiredFieldsPack
}

/* ════════════════════════════════════════════════════════════════
   DEFAULT PACKS PER VERTICAL
   ════════════════════════════════════════════════════════════════ */

const SCHOOL_PACKS: VerticalPacks = {
  terminology_pack: {
    learner: 'Student',
    learner_plural: 'Students',
    instructor: 'Teacher',
    instructor_plural: 'Teachers',
    program: 'Curriculum',
    program_plural: 'Curricula',
    cohort: 'Class',
    cohort_plural: 'Classes',
    course: 'Subject',
    course_plural: 'Subjects',
    completion: 'Graduation',
    dashboard_title: 'School Dashboard',
    invite_cta: 'Add Students',
  },
  kpi_pack: {
    primary_metrics: ['completion_rate', 'active_students', 'attendance_proxy', 'assessments_taken'],
    secondary_metrics: ['quiz_pass_rate', 'avg_score', 'certificates_issued', 'teacher_activity'],
    chart_types: ['completion_by_class', 'performance_distribution', 'progress_timeline'],
  },
  onboarding_pack: {
    welcome_message: 'Welcome! Let\'s set up your school on Sabitek.',
    steps: [
      { id: 'basic_info', title: 'School Details', description: 'Confirm your school name, type, and location', required: true },
      { id: 'term_setup', title: 'Academic Terms', description: 'Set up your academic calendar and terms', required: false },
      { id: 'class_setup', title: 'Create Classes', description: 'Create your first class (cohort) and assign subjects', required: true },
      { id: 'teacher_invite', title: 'Invite Teachers', description: 'Add teachers who will facilitate learning', required: false },
      { id: 'student_import', title: 'Add Students', description: 'Import students via CSV or invite individually', required: true },
    ],
    setup_checklist: ['Create a curriculum', 'Add subjects to curriculum', 'Create a class', 'Invite teachers', 'Add students'],
  },
  reporting_pack: {
    format: 'ACADEMIC',
    exports: ['csv', 'pdf'],
    default_metrics: ['completion_rate', 'quiz_pass_rate', 'avg_score', 'attendance_proxy'],
    evidence_pack_enabled: false,
  },
  required_fields_pack: {
    fields: [
      { key: 'school_level', label: 'School Level', type: 'select', options: ['Primary', 'Secondary', 'Tertiary', 'Vocational'], required: true },
      { key: 'student_count', label: 'Approximate Student Count', type: 'number', required: false, placeholder: 'e.g., 500' },
    ],
  },
}

const NGO_PACKS: VerticalPacks = {
  terminology_pack: {
    learner: 'Beneficiary',
    learner_plural: 'Beneficiaries',
    instructor: 'Facilitator',
    instructor_plural: 'Facilitators',
    program: 'Program',
    program_plural: 'Programs',
    cohort: 'Cohort',
    cohort_plural: 'Cohorts',
    course: 'Training Module',
    course_plural: 'Training Modules',
    completion: 'Completion',
    dashboard_title: 'Program Dashboard',
    invite_cta: 'Enroll Beneficiaries',
  },
  kpi_pack: {
    primary_metrics: ['beneficiaries_reached', 'completion_rate', 'outcomes_achieved', 'cost_per_learner'],
    secondary_metrics: ['demographics_breakdown', 'location_coverage', 'certificates_issued', 'drop_off_rate'],
    chart_types: ['outcomes_funnel', 'demographics_pie', 'location_map', 'progress_distribution'],
  },
  onboarding_pack: {
    welcome_message: 'Welcome! Let\'s set up your training program on Sabitek.',
    steps: [
      { id: 'basic_info', title: 'Organization Details', description: 'Confirm your NGO name, focus area, and location', required: true },
      { id: 'target_group', title: 'Target Group', description: 'Define your target beneficiary demographics', required: true },
      { id: 'program_setup', title: 'Create Program', description: 'Set up your first training program with outcomes', required: true },
      { id: 'cohort_setup', title: 'Create Cohort', description: 'Create your first cohort with enrollment method', required: true },
      { id: 'donor_info', title: 'Donor / Funder Info', description: 'Add donor details for evidence reporting (optional)', required: false },
    ],
    setup_checklist: ['Define target group', 'Create a program', 'Add training modules', 'Create a cohort', 'Enroll beneficiaries'],
  },
  reporting_pack: {
    format: 'DONOR',
    exports: ['csv', 'pdf', 'evidence_pack'],
    default_metrics: ['beneficiaries_reached', 'completion_rate', 'cost_per_learner', 'outcomes_achieved'],
    evidence_pack_enabled: true,
  },
  required_fields_pack: {
    fields: [
      { key: 'focus_area', label: 'Focus Area', type: 'select', options: ['Education', 'Health', 'Livelihoods', 'Digital Skills', 'Agriculture', 'WASH', 'Other'], required: true },
      { key: 'target_beneficiaries', label: 'Target Beneficiary Count', type: 'number', required: false, placeholder: 'e.g., 1000' },
      { key: 'donor_name', label: 'Primary Donor / Funder', type: 'text', required: false, placeholder: 'e.g., USAID, GIZ, World Bank' },
    ],
  },
}

const GOVERNMENT_PACKS: VerticalPacks = {
  terminology_pack: {
    learner: 'Participant',
    learner_plural: 'Participants',
    instructor: 'Resource Person',
    instructor_plural: 'Resource Persons',
    program: 'Initiative',
    program_plural: 'Initiatives',
    cohort: 'Batch',
    cohort_plural: 'Batches',
    course: 'Module',
    course_plural: 'Modules',
    completion: 'Certification',
    dashboard_title: 'Government Dashboard',
    invite_cta: 'Register Participants',
  },
  kpi_pack: {
    primary_metrics: ['coverage_rate', 'participants_reached', 'completion_rate', 'compliance_score'],
    secondary_metrics: ['region_breakdown', 'lga_performance', 'certificates_issued', 'assessment_pass_rate'],
    chart_types: ['coverage_map', 'compliance_heatmap', 'regional_comparison', 'progress_timeline'],
  },
  onboarding_pack: {
    welcome_message: 'Welcome! Let\'s set up your government training initiative on Sabitek.',
    steps: [
      { id: 'basic_info', title: 'Agency Details', description: 'Confirm your department, ministry, or agency', required: true },
      { id: 'region_setup', title: 'Coverage Area', description: 'Define states, LGAs, or regions covered', required: true },
      { id: 'initiative_setup', title: 'Create Initiative', description: 'Set up your first training initiative', required: true },
      { id: 'batch_setup', title: 'Create Batch', description: 'Create your first training batch', required: true },
      { id: 'compliance_rules', title: 'Compliance Rules', description: 'Define completion and compliance requirements', required: false },
    ],
    setup_checklist: ['Define coverage area', 'Create an initiative', 'Add training modules', 'Create a batch', 'Register participants'],
  },
  reporting_pack: {
    format: 'GOV_COMPLIANCE',
    exports: ['csv', 'pdf', 'evidence_pack'],
    default_metrics: ['coverage_rate', 'compliance_score', 'participants_reached', 'completion_rate'],
    evidence_pack_enabled: true,
  },
  required_fields_pack: {
    fields: [
      { key: 'ministry_department', label: 'Ministry / Department', type: 'text', required: true, placeholder: 'e.g., Federal Ministry of Education' },
      { key: 'coverage_states', label: 'States Covered', type: 'text', required: false, placeholder: 'e.g., Lagos, Ogun, Oyo' },
    ],
  },
}

const TRAINING_CENTER_PACKS: VerticalPacks = {
  terminology_pack: {
    learner: 'Learner',
    learner_plural: 'Learners',
    instructor: 'Instructor',
    instructor_plural: 'Instructors',
    program: 'Program',
    program_plural: 'Programs',
    cohort: 'Cohort',
    cohort_plural: 'Cohorts',
    course: 'Course',
    course_plural: 'Courses',
    completion: 'Completion',
    dashboard_title: 'Training Center Dashboard',
    invite_cta: 'Enroll Learners',
  },
  kpi_pack: {
    primary_metrics: ['enrollment_count', 'completion_rate', 'revenue_per_cohort', 'satisfaction_score'],
    secondary_metrics: ['conversion_rate', 'certificates_issued', 'instructor_rating', 'repeat_enrollment'],
    chart_types: ['revenue_trend', 'completion_funnel', 'satisfaction_distribution', 'enrollment_growth'],
  },
  onboarding_pack: {
    welcome_message: 'Welcome! Let\'s set up your training center on Sabitek.',
    steps: [
      { id: 'basic_info', title: 'Center Details', description: 'Confirm your training center name and specialization', required: true },
      { id: 'program_setup', title: 'Create Program', description: 'Set up your first training program', required: true },
      { id: 'course_setup', title: 'Add Courses', description: 'Add courses to your program', required: true },
      { id: 'pricing_setup', title: 'Set Pricing', description: 'Configure pricing for self-paying learners', required: false },
      { id: 'instructor_invite', title: 'Invite Instructors', description: 'Add instructors to facilitate courses', required: false },
    ],
    setup_checklist: ['Create a program', 'Add courses', 'Set pricing', 'Create a cohort', 'Invite instructors'],
  },
  reporting_pack: {
    format: 'GENERAL',
    exports: ['csv', 'pdf'],
    default_metrics: ['enrollment_count', 'completion_rate', 'revenue_per_cohort', 'satisfaction_score'],
    evidence_pack_enabled: false,
  },
  required_fields_pack: {
    fields: [
      { key: 'specialization', label: 'Specialization', type: 'select', options: ['Technology', 'Business', 'Creative Arts', 'Vocational', 'Professional Development', 'Other'], required: false },
    ],
  },
}

const COMPANY_PACKS: VerticalPacks = {
  terminology_pack: {
    learner: 'Employee',
    learner_plural: 'Employees',
    instructor: 'Trainer',
    instructor_plural: 'Trainers',
    program: 'Learning Path',
    program_plural: 'Learning Paths',
    cohort: 'Group',
    cohort_plural: 'Groups',
    course: 'Training',
    course_plural: 'Trainings',
    completion: 'Compliance',
    dashboard_title: 'L&D Dashboard',
    invite_cta: 'Add Employees',
  },
  kpi_pack: {
    primary_metrics: ['compliance_rate', 'completion_rate', 'skill_readiness', 'time_to_competence'],
    secondary_metrics: ['department_breakdown', 'overdue_trainings', 'certificates_issued', 'assessment_scores'],
    chart_types: ['compliance_gauge', 'department_comparison', 'skill_radar', 'completion_timeline'],
  },
  onboarding_pack: {
    welcome_message: 'Welcome! Let\'s set up corporate learning on Sabitek.',
    steps: [
      { id: 'basic_info', title: 'Company Details', description: 'Confirm your company name and industry', required: true },
      { id: 'department_setup', title: 'Departments', description: 'Define departments or teams for training groups', required: false },
      { id: 'learning_path', title: 'Create Learning Path', description: 'Set up your first compliance or skill learning path', required: true },
      { id: 'employee_import', title: 'Add Employees', description: 'Import employees via CSV or invite individually', required: true },
      { id: 'compliance_rules', title: 'Compliance Deadlines', description: 'Set completion deadlines and reminders', required: false },
    ],
    setup_checklist: ['Create a learning path', 'Add trainings', 'Define departments', 'Import employees', 'Set compliance rules'],
  },
  reporting_pack: {
    format: 'WORKFORCE',
    exports: ['csv', 'pdf'],
    default_metrics: ['compliance_rate', 'completion_rate', 'time_to_competence', 'overdue_trainings'],
    evidence_pack_enabled: false,
  },
  required_fields_pack: {
    fields: [
      { key: 'industry', label: 'Industry', type: 'select', options: ['Finance', 'Technology', 'Healthcare', 'Manufacturing', 'Oil & Gas', 'Telecommunications', 'FMCG', 'Other'], required: false },
      { key: 'employee_count', label: 'Approximate Employee Count', type: 'number', required: false, placeholder: 'e.g., 200' },
    ],
  },
}

const OTHER_PACKS: VerticalPacks = {
  terminology_pack: {
    learner: 'Learner',
    learner_plural: 'Learners',
    instructor: 'Instructor',
    instructor_plural: 'Instructors',
    program: 'Program',
    program_plural: 'Programs',
    cohort: 'Cohort',
    cohort_plural: 'Cohorts',
    course: 'Course',
    course_plural: 'Courses',
    completion: 'Completion',
    dashboard_title: 'Institution Dashboard',
    invite_cta: 'Invite Learners',
  },
  kpi_pack: {
    primary_metrics: ['enrollment_count', 'completion_rate', 'active_learners', 'certificates_issued'],
    secondary_metrics: ['quiz_pass_rate', 'avg_progress', 'drop_off_rate'],
    chart_types: ['completion_funnel', 'progress_distribution', 'enrollment_trend'],
  },
  onboarding_pack: {
    welcome_message: 'Welcome! Let\'s set up your institution on Sabitek.',
    steps: [
      { id: 'basic_info', title: 'Institution Details', description: 'Confirm your institution name and details', required: true },
      { id: 'program_setup', title: 'Create Program', description: 'Set up your first program', required: true },
      { id: 'cohort_setup', title: 'Create Cohort', description: 'Create your first cohort', required: true },
      { id: 'invite_learners', title: 'Invite Learners', description: 'Add learners to your cohort', required: true },
    ],
    setup_checklist: ['Create a program', 'Add courses', 'Create a cohort', 'Invite learners'],
  },
  reporting_pack: {
    format: 'GENERAL',
    exports: ['csv', 'pdf'],
    default_metrics: ['enrollment_count', 'completion_rate', 'certificates_issued'],
    evidence_pack_enabled: false,
  },
  required_fields_pack: {
    fields: [],
  },
}

/* ── Pack Registry ── */

const VERTICAL_PACK_REGISTRY: Record<InstitutionVerticalType, VerticalPacks> = {
  school: SCHOOL_PACKS,
  ngo: NGO_PACKS,
  government: GOVERNMENT_PACKS,
  training_center: TRAINING_CENTER_PACKS,
  company: COMPANY_PACKS,
  other: OTHER_PACKS,
}

/**
 * Get default packs for a given institution type.
 * Returns a deep copy to prevent mutation of the registry.
 */
export function getDefaultPacks(type: InstitutionVerticalType): VerticalPacks {
  const packs = VERTICAL_PACK_REGISTRY[type] || VERTICAL_PACK_REGISTRY.other
  return JSON.parse(JSON.stringify(packs))
}

/**
 * Get a specific pack for an institution type.
 */
export function getDefaultTerminology(type: InstitutionVerticalType): TerminologyPack {
  return getDefaultPacks(type).terminology_pack
}

export function getDefaultKpis(type: InstitutionVerticalType): KpiPack {
  return getDefaultPacks(type).kpi_pack
}

export function getDefaultOnboarding(type: InstitutionVerticalType): OnboardingPack {
  return getDefaultPacks(type).onboarding_pack
}

export function getDefaultReporting(type: InstitutionVerticalType): ReportingPack {
  return getDefaultPacks(type).reporting_pack
}

export function getDefaultRequiredFields(type: InstitutionVerticalType): RequiredFieldsPack {
  return getDefaultPacks(type).required_fields_pack
}

/**
 * Merge institution's customized packs with defaults.
 * Institution overrides win; missing keys fall back to defaults.
 */
export function mergeWithDefaults(
  type: InstitutionVerticalType,
  overrides: Partial<VerticalPacks>
): VerticalPacks {
  const defaults = getDefaultPacks(type)
  return {
    terminology_pack: { ...defaults.terminology_pack, ...(overrides.terminology_pack || {}) },
    kpi_pack: { ...defaults.kpi_pack, ...(overrides.kpi_pack || {}) },
    onboarding_pack: overrides.onboarding_pack || defaults.onboarding_pack,
    reporting_pack: { ...defaults.reporting_pack, ...(overrides.reporting_pack || {}) },
    required_fields_pack: overrides.required_fields_pack || defaults.required_fields_pack,
  }
}

/**
 * All available vertical types with display info.
 */
export const VERTICAL_TYPE_OPTIONS = [
  { value: 'school' as const, label: 'School', description: 'Primary, secondary, or tertiary institution' },
  { value: 'ngo' as const, label: 'NGO', description: 'Non-profit / development organization' },
  { value: 'government' as const, label: 'Government', description: 'Government agency or department' },
  { value: 'training_center' as const, label: 'Training Center', description: 'Vocational or professional training' },
  { value: 'company' as const, label: 'Company', description: 'Corporate L&D department' },
  { value: 'other' as const, label: 'Other', description: 'Other type of organization' },
] as const