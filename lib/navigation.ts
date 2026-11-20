import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  History,
  Home,
  Layers,
  LifeBuoy,
  Library,
  ListChecks,
  MessageSquare,
  PenLine,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react'

/**
 * The one map of the signed-in app. The sidebar, the mobile drawer and the
 * command palette are all drawn from it, so a page is reachable from all
 * three or from none. tests/navigation.test.ts checks every link here points
 * at a page that exists.
 */

export type Persona = 'learner' | 'instructor' | 'institution' | 'viewer' | 'admin'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Active only on this exact path (for area home pages). */
  exact?: boolean
  /** Extra words the command palette matches on. */
  keywords?: string
}

export interface NavGroup {
  /** Short heading above the group. The first group has none. */
  heading?: string
  items: NavItem[]
}

export function resolvePersona(facts: {
  role?: string | null
  homeRoute?: string | null
  isSuperAdmin?: boolean | null
}): Persona {
  if (facts.homeRoute === '/admin' || facts.isSuperAdmin) return 'admin'
  if (facts.homeRoute === '/institution/dashboard') return 'institution'
  // An institution member who may only read reports.
  if (facts.homeRoute === '/institution/reports') return 'viewer'
  if (facts.role === 'instructor' || facts.homeRoute === '/instructor') return 'instructor'
  return 'learner'
}

export const HOME_ROUTE: Record<Persona, string> = {
  learner: '/dashboard',
  instructor: '/instructor',
  institution: '/institution/dashboard',
  viewer: '/institution/reports',
  admin: '/admin',
}

const PRACTISE: NavGroup = {
  heading: 'Practise',
  items: [
    { label: 'SabiQuiz', href: '/sabiquiz', icon: ListChecks, keywords: 'quiz test practice questions exam' },
    { label: 'SabiAdvisor', href: '/sabiadvisor', icon: Briefcase, keywords: 'career cv resume cover letter interview jobs' },
    { label: 'SabiBot', href: '/sabibot', icon: Bot, keywords: 'ask ai chat tutor help' },
  ],
}

const CONNECT: NavGroup = {
  heading: 'Connect',
  items: [
    { label: 'Community', href: '/community', icon: Users, keywords: 'mentor mentors sessions messages peers' },
  ],
}

const COURSES: NavItem = {
  label: 'Courses',
  href: '/courses',
  icon: BookOpen,
  keywords: 'catalog browse learn lessons',
}

const NAV: Record<Persona, NavGroup[]> = {
  learner: [
    { items: [{ label: 'Home', href: '/dashboard', icon: Home, exact: true, keywords: 'dashboard my learning' }] },
    {
      heading: 'Learn',
      items: [
        COURSES,
        { label: 'Certificates', href: '/certificates', icon: Award, keywords: 'credentials download verify' },
      ],
    },
    PRACTISE,
    CONNECT,
  ],
  instructor: [
    { items: [{ label: 'Home', href: '/instructor', icon: Home, exact: true, keywords: 'dashboard my courses' }] },
    {
      heading: 'Teach',
      items: [
        { label: 'New course', href: '/instructor/courses/create', icon: PlusCircle, keywords: 'create add publish' },
        { label: 'Learner questions', href: '/instructor/questions', icon: MessageSquare, keywords: 'answer q&a help' },
      ],
    },
    { heading: 'Learn', items: [COURSES] },
    PRACTISE,
    CONNECT,
  ],
  institution: [
    {
      items: [
        { label: 'Home', href: '/institution/dashboard', icon: Home, exact: true, keywords: 'dashboard overview' },
      ],
    },
    {
      heading: 'Manage',
      items: [
        { label: 'Programs', href: '/institution/programs', icon: Layers, keywords: 'programmes tracks' },
        { label: 'Cohorts', href: '/institution/cohorts', icon: GraduationCap, keywords: 'learners classes groups invite' },
        { label: 'Course library', href: '/institution/courses', icon: Library, keywords: 'catalog assign' },
        { label: 'Reports', href: '/institution/reports', icon: BarChart3, keywords: 'progress analytics export' },
      ],
    },
    // No link to /instructor: an institution admin whose own role is learner
    // is turned away from it (lib/route-access.ts).
    { heading: 'Learn', items: [COURSES] },
    CONNECT,
    {
      heading: 'Organisation',
      items: [{ label: 'Settings', href: '/institution/settings', icon: Settings, keywords: 'branding team members' }],
    },
  ],
  viewer: [
    {
      items: [
        { label: 'Reports', href: '/institution/reports', icon: BarChart3, exact: true, keywords: 'progress analytics export' },
      ],
    },
    { heading: 'Learn', items: [COURSES] },
    CONNECT,
  ],
  admin: [
    { items: [{ label: 'Admin panel', href: '/admin', icon: ShieldCheck, exact: true, keywords: 'users institutions billing' }] },
    { heading: 'Learn', items: [COURSES] },
    PRACTISE,
    CONNECT,
  ],
}

export function navFor(persona: Persona): NavGroup[] {
  return NAV[persona]
}

/**
 * Personal pages. They sit in the account menu, not the sidebar.
 *
 * The wallet, the learner plan page and instructor earnings are left out on
 * purpose: their links were hidden before this map existed, and the paid tools
 * still link to the wallet where a balance is needed.
 */
export const ACCOUNT_ITEMS: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: User, keywords: 'account name photo password settings' },
  // The app shell has no footer, so this is the way to the help pages.
  { label: 'Help and support', href: '/support', icon: LifeBuoy, keywords: 'contact faq problem' },
]

/**
 * Deeper destinations: one step past a sidebar item. They appear in the
 * command palette only, phrased as the thing the person wants to get done.
 */
const SHORTCUTS: Record<Persona, NavItem[]> = {
  learner: [
    { label: 'Start a practice quiz', href: '/sabiquiz/materials', icon: ListChecks, keywords: 'sabiquiz generate test' },
    { label: 'See past quiz results', href: '/sabiquiz/history', icon: History, keywords: 'sabiquiz attempts scores' },
    { label: 'Build a CV', href: '/sabiadvisor/cv', icon: FileText, keywords: 'resume sabiadvisor' },
    { label: 'Write a cover letter', href: '/sabiadvisor/cover-letter', icon: PenLine, keywords: 'application sabiadvisor' },
    { label: 'Ask SabiBot a question', href: '/sabibot/chat', icon: Sparkles, keywords: 'chat ai tutor' },
    { label: 'Join a cohort with a code', href: '/cohorts/join', icon: GraduationCap, keywords: 'program invite code' },
    { label: 'Find a mentor', href: '/community/browse', icon: Users, keywords: 'community browse' },
    { label: 'Read messages', href: '/community/inbox', icon: MessageSquare, keywords: 'community inbox chat' },
  ],
  instructor: [
    { label: 'Ask SabiBot a question', href: '/sabibot/chat', icon: Sparkles, keywords: 'chat ai' },
    { label: 'Read messages', href: '/community/inbox', icon: MessageSquare, keywords: 'community inbox chat' },
  ],
  viewer: [],
  institution: [
    { label: 'Create a cohort', href: '/institution/cohorts/create', icon: PlusCircle, keywords: 'new class group' },
    { label: 'Read messages', href: '/community/inbox', icon: MessageSquare, keywords: 'community inbox chat' },
  ],
  admin: [
    { label: 'Manage users', href: '/admin/users', icon: Users, keywords: 'accounts roles' },
    { label: 'Manage institutions', href: '/admin/institutions', icon: Building2, keywords: 'organisations' },
    { label: 'Review applications', href: '/admin/applications', icon: FileText, keywords: 'approve institutions' },
  ],
}

export interface Command extends NavItem {
  group: string
}

/** Everything the command palette can jump to, in display order. */
export function commandsFor(persona: Persona): Command[] {
  const pages = navFor(persona).flatMap((group) => group.items.map((item) => ({ ...item, group: 'Go to' })))
  const shortcuts = SHORTCUTS[persona].map((item) => ({ ...item, group: 'Do' }))
  const account = ACCOUNT_ITEMS.map((item) => ({ ...item, group: 'Account' }))
  return [...pages, ...shortcuts, ...account]
}

/** Every link in the map, for the test that checks each one exists. */
export function allNavHrefs(): string[] {
  const personas: Persona[] = ['learner', 'instructor', 'institution', 'viewer', 'admin']
  const hrefs = personas.flatMap((persona) => commandsFor(persona).map((command) => command.href))
  return [...new Set(hrefs)].sort()
}

export function isActive(item: Pick<NavItem, 'href' | 'exact'>, pathname: string | null): boolean {
  if (!pathname) return false
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/** Areas only a signed-in person can open, so the app shell can be assumed. */
const SIGNED_IN_ONLY = ['/dashboard', '/instructor', '/institution', '/courses', '/certificates', '/account', '/profile']

/** Areas with a public landing page for visitors and the shell once signed in. */
const SIGNED_IN_OR_PUBLIC = ['/sabiquiz', '/sabiadvisor', '/sabibot', '/community', '/cohorts', '/billing']

/**
 * Screens that need the whole window: a lesson, a quiz in progress, and the
 * SabiAdvisor document builders, which have a sidebar and a preview of their
 * own.
 */
const FOCUS_ROUTES = [
  /^\/courses\/[^/]+\/lessons\//,
  /^\/sabiquiz\/quiz\//,
  /^\/sabiadvisor\/(?:cv|cover-letter|profile)(?:\/|$)/,
]

const under = (prefixes: string[], pathname: string) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

export type ShellMode = 'app' | 'app-if-signed-in' | 'focus' | 'site'

/**
 * Which frame a path gets: the app shell, the bare window for focus screens,
 * or the public site header and footer.
 */
export function shellModeFor(pathname: string | null): ShellMode {
  if (!pathname) return 'site'
  if (FOCUS_ROUTES.some((route) => route.test(pathname))) return 'focus'
  if (under(SIGNED_IN_ONLY, pathname)) return 'app'
  if (under(SIGNED_IN_OR_PUBLIC, pathname)) return 'app-if-signed-in'
  return 'site'
}
