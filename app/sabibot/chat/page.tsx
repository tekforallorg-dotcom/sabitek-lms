'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { 
  Bot, 
  Send, 
  ArrowLeft,
  Loader2,
  Globe,
  Sparkles,
  RefreshCw,
  User,
  Flame,
  Trophy,
  Calendar,
  TrendingUp,
  X,
  Target,
  Lightbulb,
  BarChart3,
  Zap,
  MessageSquare
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
  "6-month frontend dev plan",
  "Prepare for JAMB",
  "Data analyst salary in Lagos",
  "Transition to tech",
  "AWS certification plan",
  "Start freelancing",
]

function formatMarkdown(text: string): string {
  if (!text) return ''
  
  let formatted = text
    .replace(/^### \*\*(.*?)\*\*$/gm, '<h3 class="text-sm font-bold text-gray-900 mt-3 mb-1">$1</h3>')
    .replace(/^### (.*?)$/gm, '<h3 class="text-sm font-bold text-gray-900 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-base font-bold text-gray-900 mt-3 mb-1">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr class="my-2 border-gray-200" />')
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

  // Improved scroll handling - doesn't force scroll during streaming
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150
      
      // Detect if user is scrolling up
      if (scrollTop < lastScrollTop.current) {
        isUserScrolling.current = true
      }
      
      // Reset if user scrolls back to bottom
      if (isNearBottom) {
        isUserScrolling.current = false
      }
      
      lastScrollTop.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Only auto-scroll on new user messages, not during streaming
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
    
    // Scroll after user sends message
    setTimeout(() => scrollToBottom(true), 100)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/sabibot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userContext: {
            userId: user?.id,
            userName: userProfile?.full_name,
            userRole: userProfile?.role,
            preferredLanguage: language,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

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
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { ...m, content: fullContent }
                      : m
                  )
                )
                // Don't auto-scroll during streaming - let user control
              }
            } catch (e) {}
          }
        }
      }
      
      fetchUserMemory()
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        )
      )
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="w-12 h-12 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-spin border-b-pink-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-sm text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const streak = userMemory?.streak
  const nextMilestone = streak ? Math.ceil((streak.current_streak + 1) / 3) * 3 : 3
  const progressToMilestone = streak ? (streak.current_streak / nextMilestone) * 100 : 0
  const daysToMilestone = streak ? nextMilestone - streak.current_streak : 3

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
      {/* Enhanced Pink Gradient Header */}
      <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-lg shadow-pink-500/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/sabibot')}
            className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
  <Bot className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
</div>
            <div>
              <h1 className="font-bold text-white text-sm sm:text-base">SabiBot</h1>
              <p className="text-[10px] sm:text-xs text-white/70">AI Learning Companion</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Stats Button */}
          {streak && (
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors border border-white/20"
              title="View your learning analytics"
            >
              <Flame className="w-3.5 h-3.5 text-orange-200" />
              <span className="font-bold">{streak.current_streak}</span>
              <span className="hidden sm:inline text-white/80">days</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-colors border border-white/20"
            >
              <Globe className="w-3.5 h-3.5 text-white" />
              <span className="text-lg leading-none">{LANGUAGES.find(l => l.value === language)?.flag}</span>
            </button>
            {showLanguageMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} />
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 overflow-hidden">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setLanguage(lang.value)
                        setShowLanguageMenu(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-pink-50 flex items-center gap-2.5 transition-colors ${
                        language === lang.value ? 'bg-pink-50 text-pink-600' : 'text-gray-700'
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

          {/* New Chat */}
          <button
            onClick={handleNewChat}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            title="New chat"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Stats Modal - Enhanced */}
      {showStatsModal && streak && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowStatsModal(false)}
          />
          <div className="fixed inset-x-4 top-20 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 p-4 sm:p-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Your Learning Journey</h2>
                    <p className="text-xs text-white/80">Track progress • Build momentum</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-3.5 h-3.5 text-orange-200" />
                    <span className="text-[10px] uppercase tracking-wide text-white/80">Streak</span>
                  </div>
                  <p className="text-2xl font-bold">{streak.current_streak}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="w-3.5 h-3.5 text-yellow-200" />
                    <span className="text-[10px] uppercase tracking-wide text-white/80">Best</span>
                  </div>
                  <p className="text-2xl font-bold">{streak.longest_streak}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-200" />
                    <span className="text-[10px] uppercase tracking-wide text-white/80">Total</span>
                  </div>
                  <p className="text-2xl font-bold">{streak.total_study_days}</p>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setStatsTab('overview')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
                  statsTab === 'overview' 
                    ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setStatsTab('insights')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
                  statsTab === 'insights' 
                    ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Insights
              </button>
              <button
                onClick={() => setStatsTab('goals')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
                  statsTab === 'goals' 
                    ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Target className="w-4 h-4" />
                Goals
              </button>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto">
              {statsTab === 'overview' && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Study Streak</h3>
                        <Zap className="w-5 h-5 text-yellow-500" />
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">Keep the momentum going!</p>
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-3xl font-bold text-orange-500">{streak.current_streak}</span>
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
                      <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3.5 border border-blue-100">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wide text-blue-600 font-semibold">
                              {insight.insight_type.replace('_', ' ')}
                            </span>
                            <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{insight.insight_content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Lightbulb className="w-7 h-7 text-gray-300" />
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
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Learning Goals</h4>
                      {userMemory.context.learning_goals.map((goal, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3.5 border border-green-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Target className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">{goal}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Target className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No goals set yet</p>
                      <p className="text-xs text-gray-400 mt-1">Tell SabiBot about your goals</p>
                    </div>
                  )}

                  {userMemory?.context?.career_goals && userMemory.context.career_goals.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Career Goals</h4>
                      {userMemory.context.career_goals.map((goal, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3.5 border border-purple-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
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

      {/* Chat Content Area - Flex grow with overflow */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto"
        style={{ overscrollBehavior: 'contain' }}
      >
        {messages.length === 0 ? (
          /* Enhanced Empty State */
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-xl shadow-pink-500/20 mb-4">
  <Bot className="w-8 h-8 text-white" />
</div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-1">How can I help you today?</h2>
            <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
              Ask about exams, careers, study plans, or anything learning-related
            </p>

            {/* Suggested Prompts */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md mb-8">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(prompt)
                    inputRef.current?.focus()
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-pink-50 border border-gray-200 hover:border-pink-300 rounded-xl transition-all text-xs text-gray-600 hover:text-pink-600 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input in empty state */}
            <div className="w-full max-w-xl px-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask SabiBot anything..."
                    rows={1}
                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-shadow"
                    style={{ minHeight: '52px', maxHeight: '120px' }}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white h-[52px] w-[52px] rounded-2xl p-0 flex-shrink-0 shadow-lg shadow-pink-500/20 transition-all hover:shadow-xl hover:shadow-pink-500/30"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Messages - Enhanced */
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-2.5 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-pink-500/20">
                    <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-br-md shadow-md shadow-pink-500/20'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                  }`}
                >
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
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-500">Thinking...</span>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom when messages exist */}
      {messages.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 p-3 sm:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask SabiBot..."
                  rows={1}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm transition-all hover:bg-white"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white h-12 w-12 rounded-2xl p-0 flex-shrink-0 shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto mb-4">
          <div className="w-12 h-12 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-spin border-b-pink-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-sm text-gray-600">Loading chat...</p>
      </div>
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