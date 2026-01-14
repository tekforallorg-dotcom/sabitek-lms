import { 
  Briefcase, 
  PenTool, 
  Users,
  Bot,
  HelpCircle,
  LucideIcon
} from 'lucide-react'

export interface SabiTool {
  id: string
  name: string
  slug: string
  href: string
  shortDescription: string
  longDescription: string
  icon: LucideIcon
  tags: string[]
  status?: 'new' | 'popular' | 'beta'
  color: string
}

export const sabitoolsCatalog: SabiTool[] = [
  {
    id: 'sabibot',
    name: 'SabiBot',
    slug: 'sabibot',
    href: '/sabibot',
    shortDescription: 'AI Learning Companion',
    longDescription: 'Your personal AI tutor that helps you understand concepts, answers questions, and guides your learning journey.',
    icon: Bot,
    tags: ['AI Tutor', 'Study Help', '5 Languages'],
    status: 'popular',
    color: 'red',
  },
  {
    id: 'sabiquiz',
    name: 'SabiQuiz',
    slug: 'sabiquiz',
    href: '/sabiquiz',
    shortDescription: 'AI Quiz Generator',
    longDescription: 'Generate personalized quizzes from any PDF. Track progress with XP, streaks, and badges.',
    icon: HelpCircle,
    tags: ['PDF to Quiz', 'XP & Badges', 'Progress Tracking'],
    status: 'popular',
    color: 'orange',
  },
  {
    id: 'sabiadvisor',
    name: 'SabiAdvisor',
    slug: 'sabiadvisor',
    href: '/sabiadvisor',
    shortDescription: 'Career Tools Suite',
    longDescription: 'Build ATS-optimized CVs, cover letters, and get personalized career roadmaps.',
    icon: Briefcase,
    tags: ['CV Builder', 'Cover Letters', 'Career Roadmap'],
    color: 'blue',
  },
  {
    id: 'sabiwrite',
    name: 'SabiWrite',
    slug: 'sabiwrite',
    href: '/sabiwrite',
    shortDescription: 'AI Writing Suite',
    longDescription: 'Rewrite, humanize, detect AI, and check plagiarism. All writing tools in one place.',
    icon: PenTool,
    tags: ['AI Detection', 'Humanizer', 'Plagiarism Check'],
    status: 'new',
    color: 'purple',
  },
  {
    id: 'sabicommunity',
    name: 'SabiCommunity',
    slug: 'community',
    href: '/community',
    shortDescription: 'Peer-to-Peer Learning',
    longDescription: 'Connect with mentors and learners. Share knowledge, book sessions, and earn credits.',
    icon: Users,
    tags: ['Find Mentors', 'Teach & Earn', 'Book Sessions'],
    status: 'new',
    color: 'green',
  },
]