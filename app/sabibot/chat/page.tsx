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
  Zap
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

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      isUserScrolling.current = !isNearBottom
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToBottomIfNeeded = () => {
    if (!isUserScrolling.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
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
    
    setTimeout(() => scrollToBottomIfNeeded(), 100)

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
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return null

  const streak = userMemory?.streak
  const nextMilestone = streak ? Math.ceil((streak.current_streak + 1) / 3) * 3 : 3
  const progressToMilestone = streak ? (streak.current_streak / nextMilestone) * 100 : 0
  const daysToMilestone = streak ? nextMilestone - streak.current_streak : 3

  return (
    <div className="min-h-[80vh] flex flex-col bg-gray-50">
      {/* SabiBot Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/sabibot')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm">SabiBot</h1>
              <p className="text-[10px] sm:text-xs text-gray-500">AI Learning Companion</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Stats Button */}
          {streak && (
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors"
              title="View your learning analytics"
            >
              <span className="hidden sm:inline text-white/90">Analytics</span>
              <Flame className="w-3.5 h-3.5" />
              <span className="font-bold">{streak.current_streak}</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{LANGUAGES.find(l => l.value === language)?.flag}</span>
            </button>
            {showLanguageMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} />
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setLanguage(lang.value)
                        setShowLanguageMenu(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${
                        language === lang.value ? 'bg-red-50 text-red-600' : 'text-gray-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* New Chat */}
          <button
            onClick={handleNewChat}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="New chat"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Modal */}
      {showStatsModal && streak && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowStatsModal(false)}
          />
          <div className="fixed inset-x-4 top-20 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 via-red-600 to-pink-500 p-4 sm:p-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Your Learning Journey</h2>
                    <p className="text-xs text-white/80">Track progress • Build momentum • Achieve goals</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Flame className="w-3.5 h-3.5 text-orange-200" />
                    <span className="text-[10px] uppercase tracking-wide text-white/80">Streak</span>
                  </div>
                  <p className="text-2xl font-bold">{streak.current_streak}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Trophy className="w-3.5 h-3.5 text-yellow-200" />
                    <span className="text-[10px] uppercase tracking-wide text-white/80">Achievements</span>
                  </div>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-200" />
                    <span className="text-[10px] uppercase tracking-wide text-white/80">Total Days</span>
                  </div>
                  <p className="text-2xl font-bold">{streak.total_study_days}</p>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setStatsTab('overview')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  statsTab === 'overview' 
                    ? 'text-red-600 border-b-2 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setStatsTab('insights')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  statsTab === 'insights' 
                    ? 'text-red-600 border-b-2 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Insights
              </button>
              <button
                onClick={() => setStatsTab('goals')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  statsTab === 'goals' 
                    ? 'text-red-600 border-b-2 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Target className="w-4 h-4" />
                Goals
              </button>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto">
              {statsTab === 'overview' && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Study Streak</h3>
                        <Zap className="w-6 h-6 text-yellow-500" />
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">Keep going! You're building momentum</p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold text-orange-500">{streak.current_streak}</span>
                        <span className="text-gray-600 text-sm">days</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                          Longest: {streak.longest_streak}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          Total: {streak.total_study_days}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-orange-200">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-gray-600">Next milestone</span>
                          <span className="font-semibold text-orange-600">{nextMilestone} days</span>
                        </div>
                        <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                            style={{ width: `${Math.min(progressToMilestone, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                          {daysToMilestone} more day{daysToMilestone !== 1 ? 's' : ''} to your next achievement!
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
                      <div key={idx} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase tracking-wide text-blue-600 font-medium">
                              {insight.insight_type.replace('_', ' ')}
                            </span>
                            <p className="text-sm text-gray-700 mt-0.5">{insight.insight_content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Lightbulb className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Chat with SabiBot to generate insights</p>
                      <p className="text-xs text-gray-400 mt-1">Your learning patterns will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {statsTab === 'goals' && (
                <div className="space-y-3">
                  {userMemory?.context?.learning_goals && userMemory.context.learning_goals.length > 0 ? (
                    <>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Learning Goals</h4>
                      {userMemory.context.learning_goals.map((goal, idx) => (
                        <div key={idx} className="bg-green-50 rounded-xl p-3 border border-green-100">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            <p className="text-sm text-gray-700">{goal}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No goals set yet</p>
                      <p className="text-xs text-gray-400 mt-1">Tell SabiBot about your learning goals</p>
                    </div>
                  )}

                  {userMemory?.context?.career_goals && userMemory.context.career_goals.length > 0 && (
                    <>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-4">Career Goals</h4>
                      {userMemory.context.career_goals.map((goal, idx) => (
                        <div key={idx} className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            <p className="text-sm text-gray-700">{goal}</p>
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

      {/* Chat Content Area */}
      <div ref={chatContainerRef} className="flex-1">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center px-4 pt-8 sm:pt-12 pb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">How can I help you today?</h2>
            <p className="text-xs text-gray-500 text-center mb-4">
              Ask about exams, careers, or study plans
            </p>

            <div className="flex flex-wrap justify-center gap-2 max-w-lg mb-6">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(prompt)
                    inputRef.current?.focus()
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-full transition-colors text-xs text-gray-600 hover:text-red-600 flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-red-400" />
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input in empty state */}
            <div className="w-full max-w-2xl">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask SabiBot..."
                    rows={1}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm shadow-sm"
                    style={{ minHeight: '48px', maxHeight: '100px' }}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white h-12 w-12 rounded-xl p-0 flex-shrink-0 shadow-sm"
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
          /* Messages */
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-red-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  {message.content ? (
                    message.role === 'assistant' ? (
                      <div 
                        className="text-xs sm:text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                      />
                    ) : (
                      <div className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs sm:text-sm">Thinking...</span>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Only when messages exist */}
      {messages.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-3 sm:p-4 sticky bottom-0">
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
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  style={{ minHeight: '44px', maxHeight: '100px' }}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-red-500 hover:bg-red-600 text-white h-11 w-11 rounded-xl p-0 flex-shrink-0"
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
      )}
    </div>
  )
}

function ChatLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Loading chat...</p>
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