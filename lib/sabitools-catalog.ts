import { 
  Sparkles, 
  Briefcase, 
  MessageSquare, 
  PenTool, 
  Users,
  Bot,
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
}

export const sabitoolsCatalog: SabiTool[] = [
  {
    id: 'sabibot',
    name: 'SabiBot',
    slug: 'sabibot',
    href: '/sabibot',
    shortDescription: 'AI learning assistant',
    longDescription: 'Your personal AI tutor that helps you understand concepts, answers questions, and guides your learning journey.',
    icon: Bot,
    tags: ['ai', 'tutor', 'assistant'],
    status: 'popular',
  },
  {
    id: 'sabiquiz',
    name: 'SabiQuiz',
    slug: 'sabiquiz',
    href: '/sabiquiz',
    shortDescription: 'AI-powered quizzes',
    longDescription: 'Generate personalized quizzes from any topic or material. Track your progress and master any subject.',
    icon: Sparkles,
    tags: ['quiz', 'ai', 'assessment'],
    status: 'popular',
  },
  {
    id: 'sabiadvisor',
    name: 'SabiAdvisor',
    slug: 'sabiadvisor',
    href: '/sabiadvisor',
    shortDescription: 'Career path discovery',
    longDescription: 'Find your perfect tech career path with AI-powered recommendations based on your interests and skills.',
    icon: Briefcase,
    tags: ['career', 'ai', 'guidance'],
  },
  {
    id: 'sabiwrite',
    name: 'SabiWrite',
    slug: 'sabiwrite',
    href: '/sabiwrite',
    shortDescription: 'AI writing assistant',
    longDescription: 'Transform your ideas into polished content. Get help with essays, reports, and professional documents.',
    icon: PenTool,
    tags: ['writing', 'ai', 'content'],
    status: 'new',
  },
  {
    id: 'sabicommunity',
    name: 'SabiCommunity',
    slug: 'community',
    href: '/community',
    shortDescription: 'Peer-to-peer learning',
    longDescription: 'Connect with mentors and learners. Share knowledge, book sessions, and grow together.',
    icon: Users,
    tags: ['community', 'mentorship', 'peer'],
    status: 'new',
  },
]