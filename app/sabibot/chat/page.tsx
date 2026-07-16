'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import SabiLoader from '@/components/ui/SabiLoader'
import {
  Bot,
  Send,
  ArrowLeft,
  Globe,
  RefreshCw,
  Flame,
  Trophy,
  TrendingUp,
  X,
  Target,
  Lightbulb,
  BarChart3,
  Zap,
  BookOpen,
  GraduationCap,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UserMemory {
  streak?: {
    current_streak: number
    longest_streak: number
    total_study_days: number
  }
  context?: {
    learning_goals?: string[]
    career_goals?: string[]
    current_occupation?: string
  }
  insights?: Array<{
    insight_type: string
    insight_content: string
  }>
}

const LANGUAGES = [
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'pidgin', label: 'Pidgin', flag: '🇳🇬' },
  { value: 'yoruba', label: 'Yoruba', flag: '🇳🇬' },
  { value: 'hausa', label: 'Hausa', flag: '🇳🇬' },
  { value: 'igbo', label: 'Igbo', flag: '🇳🇬' },
]

const SUGGESTED_PROMPTS = [
  '6-month frontend dev plan',
  'Prepare for JAMB',
  'Data analyst salary in Lagos',
  'Transition to tech',
  'AWS certification plan',
  'Start freelancing',
]

// When grounded in a lesson, the chips become tutor actions
const LESSON_PROMPTS = [
  'Explain this lesson simply',
  'Give me a real-life example',
  'Quiz me on this lesson',
  'What are the key points?',
  'Explain like I am new to this',
]

function formatMarkdown(text: string): string {
  if (!text) return ''

  let formatted = text
    // Sabitek course links become tappable pills; other links stay simple
    .replace(
      /\[([^\]]+)\]\((\/courses\/[^)\s]+)\)/g,
      '<a href="$2" class="inline-flex items-center gap-1.5 px-3 py-1 my-0.5 bg-rose-50 border border-rose-200 text-red-600 rounded-full text-xs font-semibold hover:bg-rose-100 no-underline cursor-pointer"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>$1</a>'
    )
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-red-600 underline underline-offset-2">$1</a>'
    )
    .replace(/^### \*\*(.*?)\*\*$/gm, '<h3 class="text-sm font-bold text-gray-900 mt-3 mb-1">$1</h3>')
    .replace(/^### (.*?)$/gm, '<h3 class="text-sm font-bold text-gray-900 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-base font-bold text-gray-900 mt-3 mb-1">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr class="my-2 border-rose-100" />')
    .replace(/^- (.*?)$/gm, '<li class="ml-3 mb-0.5 text-gray-700">• $1</li>')
    .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-3 mb-0.5 text-gray-700">$1. $2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br />')

  return `<p class="mb-2">${formatted}</p>`
}

function SabiBotChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userProfile, loading: authLoading } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState('english')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [initialPromptSent, setInitialPromptSent] = useState(false)
  const [userMemory, setUserMemory] = useState<UserMemory | null>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [statsTab, setStatsTab] = useState<'overview' | 'insights' | 'goals'>('overview')
  // Lesson grounding: when set, the server injects the lesson content and
  // SabiBot answers as a tutor for THAT lesson.
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const isUserScrolling = useRef(false)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/sabibot/chat')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.id) {
      fetchUserMemory()
    }
  }, [user?.id])

  // Pick up lesson grounding from the URL (lesson viewer / quiz remediation)
  useEffect(() => {
    const lid = searchParams.get('lessonId')
    const lt = searchParams.get('lessonTitle')
    if (lid) {
      setLessonId(lid)
      setLessonTitle(lt)
    }
  }, [searchParams])

  const fetchUserMemory = async () => {
    try {
      const res = await fetch(`/api/sabibot/memory?userId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setUserMemory(data)
      }
    } catch (error) {
      console.error('Failed to fetch memory:', error)
    }
  }

  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt && messages.length === 0 && !initialPromptSent && user) {
      setInitialPromptSent(true)
      setInput(prompt)
      setTimeout(() => {
        handleSendWithPrompt(prompt)
      }, 500)
    }
  }, [searchParams, messages.length, initialPromptSent, user])

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150

      if (scrollTop < lastScrollTop.current) {
        isUserScrolling.current = true
      }
      if (isNearBottom) {
        isUserScrolling.current = false
      }
      lastScrollTop.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToBottom = (force = false) => {
    if ((force || !isUserScrolling.current) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  const handleSendWithPrompt = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setTimeout(() => scrollToBottom(true), 100)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMessage])

    const setAssistantContent = (content: string) =>
      setMessages(prev => prev.map(m => (m.id === assistantMessage.id ? { ...m, content } : m)))

    try {
      const response = await fetch('/api/sabibot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          lessonId: lessonId || undefined,
          userContext: {
            userId: user?.id,
            userName: userProfile?.full_name,
            userRole: userProfile?.role,
            preferredLanguage: language,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      // Non-stream JSON (quota exceeded, config errors) comes back as JSON
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const json = await response.json()
        setAssistantContent(json.content || 'Something went wrong. Please try again.')
        return
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const json = JSON.parse(data)
              if (json.content) {
                fullContent += json.content
                setAssistantContent(fullContent)
              }
            } catch (e) {}
          }
        }
      }

      fetchUserMemory()
    } catch (error) {
      console.error('Chat error:', error)
      setAssistantContent('Sorry, I encountered an error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => {
    handleSendWithPrompt(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
    setInitialPromptSent(false)
    isUserScrolling.current = false
  }

  const clearLessonContext = () => {
    setLessonId(null)
    setLessonTitle(null)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fffcfb] flex items-center justify-center">
        <SabiLoader text="Loading chat..." size="lg" />
      </div>
    )
  }

  if (!user) return null

  const streak = userMemory?.streak
  const nextMilestone = streak ? Math.ceil((streak.current_streak + 1) / 3) * 3 : 3
  const progressToMilestone = streak ? (streak.current_streak / nextMilestone) * 100 : 0
  const daysToMilestone = streak ? nextMilestone - streak.current_streak : 3

  const grounded = !!lessonId
  const prompts = grounded ? LESSON_PROMPTS : SUGGESTED_PROMPTS

  const sendBtnClass =
    'relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full flex items-center justify-center shadow-[0_12px_26px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 cursor-pointer'

  const composerClass =
    'w-full px-5 py-3.5 bg-white/85 backdrop-blur border border-white ring-1 ring-rose-100 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40 text-sm shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] transition-shadow placeholder:text-gray-400'

  return (
    <div className="h-screen flex flex-col bg-[#fffcfb] relative">
      {/* Ambient rose atmosphere */}
      <div className="pointer-events-none absolute -top-24 right-[-10%] w-96 h-96 bg-rose-100/60 rounded-full blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-[-10%] w-80 h-80 bg-red-50 rounded-full blur-[90px]" />

      {/* ── Glass header ── */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-rose-100/80">
        <span className="absolute bottom-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
        <div className="px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/sabibot')}
              className="p-2 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-8px_rgba(225,29,72,0.55)]">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
              </div>
              <div>
                <h1 className="font-semibold tracking-tight text-gray-900 text-sm sm:text-base leading-tight">
                  Sabi<span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">Bot</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400">
                  {grounded ? 'Lesson tutor mode' : 'AI learning companion'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {streak && (
              <button
                onClick={() => setShowStatsModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-50 border border-amber-100 text-amber-700 rounded-full hover:border-amber-200 transition-colors cursor-pointer"
                title="View your learning analytics"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold tabular-nums">{streak.current_streak}</span>
                <span className="hidden sm:inline">days</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/70 border border-rose-100 hover:border-rose-200 rounded-full transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-base leading-none">{LANGUAGES.find(l => l.value === language)?.flag}</span>
              </button>
              {showLanguageMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur rounded-2xl shadow-[0_20px_45px_-20px_rgba(225,29,72,0.4)] border border-white ring-1 ring-rose-100 py-1.5 z-20 overflow-hidden">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => {
                          setLanguage(lang.value)
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                          language === lang.value
                            ? 'bg-rose-50 text-red-600 font-semibold'
                            : 'text-gray-700 hover:bg-rose-50/60'
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="font-medium">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleNewChat}
              className="p-2 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
              title="New chat"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Lesson context chip ── */}
        {grounded && (
          <div className="px-3 sm:px-4 pb-2.5 -mt-0.5">
            <div className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 bg-rose-50/80 border border-rose-100 rounded-full max-w-full">
              <BookOpen className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-xs text-gray-700 truncate">
                Discussing:{' '}
                <span className="font-semibold text-gray-900">{lessonTitle || 'Current lesson'}</span>
              </span>
              <button
                onClick={clearLessonContext}
                className="p-0.5 hover:bg-rose-100 rounded-full transition-colors cursor-pointer"
                title="Leave lesson mode"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats modal ── */}
      {showStatsModal && streak && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowStatsModal(false)}
          />
          <div className="fixed inset-x-4 top-20 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white/95 backdrop-blur rounded-3xl shadow-[0_30px_70px_-25px_rgba(225,29,72,0.5)] border border-white ring-1 ring-rose-100 z-50 overflow-hidden">
            <div className="relative bg-gradient-to-br from-red-500 to-rose-600 p-4 sm:p-5 text-white">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" aria-hidden="true" />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold tracking-tight text-lg">Your Learning Journey</h2>
                    <p className="text-xs text-white/80">Track progress. Build momentum.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { icon: Flame, label: 'Streak', value: streak.current_streak, tint: 'text-orange-200' },
                  { icon: Trophy, label: 'Best', value: streak.longest_streak, tint: 'text-yellow-200' },
                  { icon: TrendingUp, label: 'Total', value: streak.total_study_days, tint: 'text-emerald-200' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-2.5 text-center border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <s.icon className={`w-3.5 h-3.5 ${s.tint}`} />
                      <span className="text-[10px] uppercase tracking-wide text-white/80">{s.label}</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex border-b border-rose-100 bg-rose-50/40">
              {([
                ['overview', BarChart3, 'Overview'],
                ['insights', Lightbulb, 'Insights'],
                ['goals', Target, 'Goals'],
              ] as const).map(([key, Icon, label]) => (
                <button
                  key={key}
                  onClick={() => setStatsTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                    statsTab === key
                      ? 'text-red-600 border-b-2 border-red-500 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4 max-h-64 overflow-y-auto">
              {statsTab === 'overview' && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Study Streak</h3>
                        <Zap className="w-5 h-5 text-yellow-500" />
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">Keep the momentum going!</p>
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-3xl font-bold text-orange-500 tabular-nums">{streak.current_streak}</span>
                        <span className="text-gray-500 text-sm">days</span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-orange-200/50">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-gray-600">Next milestone</span>
                          <span className="font-bold text-orange-600">{nextMilestone} days</span>
                        </div>
                        <div className="h-2.5 bg-orange-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all"
                            style={{ width: `${Math.min(progressToMilestone, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                          {daysToMilestone} more day{daysToMilestone !== 1 ? 's' : ''} to go!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {statsTab === 'insights' && (
                <div className="space-y-3">
                  {userMemory?.insights && userMemory.insights.length > 0 ? (
                    userMemory.insights.slice(0, 5).map((insight, idx) => (
                      <div key={idx} className="bg-rose-50/60 rounded-2xl p-3.5 border border-rose-100">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wide text-red-600 font-semibold">
                              {insight.insight_type.replace('_', ' ')}
                            </span>
                            <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{insight.insight_content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Lightbulb className="w-7 h-7 text-rose-200" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No insights yet</p>
                      <p className="text-xs text-gray-400 mt-1">Chat with SabiBot to generate insights</p>
                    </div>
                  )}
                </div>
              )}

              {statsTab === 'goals' && (
                <div className="space-y-3">
                  {userMemory?.context?.learning_goals && userMemory.context.learning_goals.length > 0 ? (
                    <>
                      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Learning Goals</h4>
                      {userMemory.context.learning_goals.map((goal, idx) => (
                        <div key={idx} className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Target className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">{goal}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Target className="w-7 h-7 text-rose-200" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No goals set yet</p>
                      <p className="text-xs text-gray-400 mt-1">Tell SabiBot about your goals</p>
                    </div>
                  )}

                  {userMemory?.context?.career_goals && userMemory.context.career_goals.length > 0 && (
                    <>
                      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mt-4">Career Goals</h4>
                      {userMemory.context.career_goals.map((goal, idx) => (
                        <div key={idx} className="bg-rose-50/60 rounded-2xl p-3.5 border border-rose-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">{goal}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Chat area ── */}
      <div
        ref={chatContainerRef}
        className="relative z-0 flex-1 overflow-y-auto"
        style={{ overscrollBehavior: 'contain' }}
      >
        {messages.length === 0 ? (
          /* ── Empty state: the moment ── */
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-rose-300/40 rounded-3xl blur-2xl scale-125" aria-hidden="true" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-3xl flex items-center justify-center shadow-[0_20px_40px_-12px_rgba(225,29,72,0.6)]">
                {grounded ? (
                  <GraduationCap className="w-8 h-8 text-white" />
                ) : (
                  <Bot className="w-8 h-8 text-white" />
                )}
              </div>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
              {grounded ? 'Lesson tutor' : 'Your AI companion'}
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 mb-1.5 text-center">
              {grounded ? (
                <>
                  Let&apos;s master{' '}
                  <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
                    this lesson
                  </span>
                </>
              ) : (
                <>
                  What are we{' '}
                  <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
                    learning
                  </span>{' '}
                  today?
                </>
              )}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
              {grounded
                ? `I have read "${lessonTitle || 'this lesson'}" and can explain any part of it, in your language.`
                : 'Ask about exams, careers, study plans, or anything learning-related.'}
            </p>

            <div className="flex flex-wrap justify-center gap-2 max-w-md mb-8">
              {prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendWithPrompt(prompt)}
                  className="px-3.5 py-2 bg-white/80 backdrop-blur hover:bg-white border border-rose-100 hover:border-rose-200 rounded-full transition-all text-xs text-gray-600 hover:text-red-600 flex items-center gap-1.5 shadow-sm hover:shadow-[0_10px_24px_-12px_rgba(225,29,72,0.4)] hover:-translate-y-0.5 cursor-pointer"
                >
                  <span className="w-1 h-1 rounded-full bg-rose-400" aria-hidden="true" />
                  {prompt}
                </button>
              ))}
            </div>

            <div className="w-full max-w-xl px-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={grounded ? 'Ask about this lesson...' : 'Ask SabiBot anything...'}
                    rows={1}
                    className={composerClass}
                    style={{ minHeight: '52px', maxHeight: '120px' }}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`${sendBtnClass} h-[52px] w-[52px] flex-shrink-0`}
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  {isLoading ? (
                    <SabiLoader text="" size="sm" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Messages ── */
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-2.5 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_8px_16px_-6px_rgba(225,29,72,0.5)]">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-b from-red-500 to-rose-600 text-white rounded-3xl rounded-br-lg shadow-[0_12px_26px_-12px_rgba(225,29,72,0.55)]'
                      : 'relative bg-white/85 backdrop-blur border border-white ring-1 ring-rose-100 text-gray-800 rounded-3xl rounded-bl-lg shadow-[0_12px_30px_-22px_rgba(225,29,72,0.4)] overflow-hidden'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <span className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent" aria-hidden="true" />
                  )}
                  {message.content ? (
                    message.role === 'assistant' ? (
                      <div
                        className="text-sm prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                      />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 py-0.5">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-400">SabiBot is thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* ── Composer (when in conversation) ── */}
      {messages.length > 0 && (
        <div className="relative z-10 bg-white/70 backdrop-blur-xl border-t border-rose-100/80 p-3 sm:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={grounded ? 'Ask about this lesson...' : 'Ask SabiBot...'}
                  rows={1}
                  className={composerClass}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`${sendBtnClass} h-12 w-12 flex-shrink-0`}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                {isLoading ? (
                  <SabiLoader text="" size="sm" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              SabiBot can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ChatLoading() {
  return (
    <div className="min-h-screen bg-[#fffcfb] flex items-center justify-center">
      <SabiLoader text="Loading chat..." size="lg" />
    </div>
  )
}

export default function SabiBotChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <SabiBotChatContent />
    </Suspense>
  )
}
