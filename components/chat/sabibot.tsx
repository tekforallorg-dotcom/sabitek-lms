'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, BookOpen, GraduationCap, Target, Briefcase, Globe, BarChart3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import LearningStats from './learning-stats'

interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

type Language = 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'

const LANGUAGES = [
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'pidgin', label: 'Pidgin', flag: '🇳🇬' },
  { value: 'yoruba', label: 'Yorùbá', flag: '🇳🇬' },
  { value: 'hausa', label: 'Hausa', flag: '🇳🇬' },
  { value: 'igbo', label: 'Igbo', flag: '🇳🇬' },
]

export default function SabiBot() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('english')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showLearningStats, setShowLearningStats] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousUserId = useRef<string | null>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false)
      }
    }

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageMenu])

  // Reset chat when user changes
  useEffect(() => {
    if (user?.id !== previousUserId.current) {
      setMessages([])
      setIsOpen(false)
      setIsMinimized(false)
      previousUserId.current = user?.id || null
      
      if (user?.id) {
        loadUserProfile()
      } else {
        setUserProfile(null)
        setPreferredLanguage('english')
      }
    }
  }, [user?.id])

  // Load user profile and language preference
  const loadUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('full_name, role, preferred_language')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading user profile:', error)
        setDefaultWelcome()
        return
      }

      setUserProfile(profile)
      
      // Set language preference
      if (profile?.preferred_language) {
        setPreferredLanguage(profile.preferred_language as Language)
      }
      
      // Get language-specific welcome message
      const welcomeContent = getWelcomeMessage(profile?.full_name, profile?.preferred_language || 'english')
      
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date()
      }
      
      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Error loading profile:', error)
      setDefaultWelcome()
    }
  }

  const getWelcomeMessage = (userName: string | null, lang: string) => {
    const name = userName ? `, ${userName}` : ''
    
    switch (lang) {
      case 'pidgin':
        return `Wetin dey happen${name}! I be SabiBot, your personal AI learning companion.

I fit help you with:
- Course recommendations wey fit match your goals
- Career guidance and learning paths (tech, teaching, any field)
- Tech career transition advice (which area dey pay well)
- Online teaching opportunities (earn in dollars)
- Study strategies and exam preparation
- Professional certifications and adult education
- Understanding course content

How I fit assist your learning journey today?`
      
      case 'yoruba':
        return `Bawo ni${name}! I'm SabiBot, your personal AI learning companion.

I can help you with (Mo le ran e lowo pelu):
- Course recommendations for your goals
- Career guidance and learning paths
- Tech career transitions and specializations
- Online teaching opportunities
- Study strategies and exam preparation
- Professional certifications
- Navigating the platform

How can I assist your learning journey today?`
      
      case 'hausa':
        return `Sannu${name}! I'm SabiBot, your personal AI learning companion.

I can help you with (Zan iya taimaka ka da):
- Course recommendations for your goals
- Career guidance and learning paths
- Tech career transitions and specializations
- Online teaching opportunities
- Study strategies and exam preparation
- Professional certifications
- Navigating the platform

How can I assist your learning journey today?`
      
      case 'igbo':
        return `Kedu${name}! I'm SabiBot, your personal AI learning companion.

I can help you with (Enwere m ike inyere gi aka):
- Course recommendations for your goals
- Career guidance and learning paths
- Tech career transitions and specializations
- Online teaching opportunities
- Study strategies and exam preparation
- Professional certifications
- Navigating the platform

How can I assist your learning journey today?`
      
      default: // english
        return `Welcome back${name}! I'm SabiBot, your personal AI learning companion.

I can help you with:
- Course recommendations tailored to your goals
- Career guidance and strategic planning (all ages, all fields)
- Tech career transitions (which specializations pay most)
- Online teaching opportunities (earn in dollars from Nigeria)
- Study strategies and exam preparation (JAMB, WAEC, professional certs)
- Adult education pathways and certifications
- Understanding course content

How can I assist your learning journey today?`
    }
  }

  const setDefaultWelcome = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to Sabitek. I'm SabiBot, your AI learning companion.

I can help you with:
- Course recommendations tailored to your goals
- Career guidance and strategic planning
- Tech career transitions and specializations
- Online teaching opportunities
- Study strategies and exam preparation
- Professional certifications
- Navigating the platform

How can I assist your learning journey today?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }

  // Initialize welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (user?.id && !userProfile) {
        loadUserProfile()
      } else if (!user?.id) {
        setDefaultWelcome()
      } else if (userProfile) {
        const welcomeContent = getWelcomeMessage(userProfile?.full_name, preferredLanguage)
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: welcomeContent,
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      }
    }
  }, [isOpen, messages.length, user?.id, userProfile])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Handle language change
  const handleLanguageChange = async (newLanguage: Language) => {
    setPreferredLanguage(newLanguage)
    setShowLanguageMenu(false)

    // Save to database if user is authenticated
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ preferred_language: newLanguage })
          .eq('id', user.id)

        if (error) {
          console.error('Error saving language preference:', error)
        } else {
          // Update welcome message with new language
          const welcomeContent = getWelcomeMessage(userProfile?.full_name, newLanguage)
          const welcomeMessage: Message = {
            id: 'welcome-' + Date.now(),
            role: 'assistant',
            content: welcomeContent,
            timestamp: new Date()
          }
          setMessages([welcomeMessage])
        }
      } catch (error) {
        console.error('Error updating language:', error)
      }
    } else {
      // For non-authenticated users, just update the welcome message
      const welcomeContent = getWelcomeMessage(null, newLanguage)
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/sabibot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          userContext: {
            userId: user?.id,
            userName: userProfile?.full_name,
            userRole: userProfile?.role || 'learner',
            isAuthenticated: !!user,
            preferredLanguage: preferredLanguage
          }
        })
      })

      const data = await response.json()
      
      setTimeout(() => {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content || 'I apologize, but I could not generate a response. Please try again.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsTyping(false)

        if (user?.id) {
          saveConversation(userMessage, assistantMessage)
          
          // Update study streak and extract insights
          updateMemory(user.id, userMessage.content, assistantMessage.content)
        }
      }, 500)

    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I encountered a connection issue. Please check your internet and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Save conversation to database - only if table exists
  const saveConversation = async (userMsg: Message, assistantMsg: Message) => {
    if (!user?.id) return

    try {
      const { error } = await supabase.from('chat_history').insert({
        user_id: user.id,
        user_message: userMsg.content,
        assistant_message: assistantMsg.content,
        created_at: new Date().toISOString()
      })
      
      if (error && error.code === '42P01') {
        console.log('Chat history table not found, skipping save')
      } else if (error) {
        console.error('Error saving conversation:', error)
      }
    } catch (error) {
      console.log('Chat history not configured')
    }
  }

  // Update memory: streak and insights
  const updateMemory = async (userId: string, userMsg: string, assistantMsg: string) => {
    try {
      // Update study streak
      fetch('/api/sabibot/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'update_streak'
        })
      }).catch(err => console.log('Streak update failed:', err))

      // Extract insights from conversation
      fetch('/api/sabibot/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'extract_insights',
          userMessage: userMsg,
          assistantMessage: assistantMsg
        })
      }).catch(err => console.log('Insight extraction failed:', err))
    } catch (error) {
      console.log('Memory update error:', error)
    }
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    setTimeout(() => handleSend(), 100)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const QUICK_ACTIONS = [
    { icon: Briefcase, label: 'Career Path', prompt: 'What career path should I choose?' },
    { icon: BookOpen, label: 'Find Courses', prompt: 'Recommend courses for my goals' },
    { icon: GraduationCap, label: 'Study Tips', prompt: 'Give me effective study strategies' },
    { icon: Target, label: 'Get Started', prompt: 'How do I start learning on Sabitek?' },
  ]

  const animatedButtonStyles = `
    @keyframes blink {
      0%, 90%, 100% { opacity: 1; }
      95% { opacity: 0.2; }
    }
    
    .robot-eye {
      animation: blink 4s infinite;
    }
    
    .robot-eye-left {
      animation-delay: 0.1s;
    }
    
    @keyframes antenna-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    
    .robot-antenna {
      animation: antenna-pulse 2s ease-in-out infinite;
    }
    
    @keyframes mouth-speak {
      0%, 100% { width: 8px; }
      50% { width: 6px; }
    }
    
    .robot-mouth {
      animation: mouth-speak 2s infinite;
    }
    
    .animation-delay-200 {
      animation-delay: 200ms;
    }
    
    .animation-delay-400 {
      animation-delay: 400ms;
    }
  `

  return (
    <>
      {/* Floating Chat Button - Animated Robot Head */}
      <button
        onClick={() => setIsOpen(true)}
        className={`${
          isOpen ? 'scale-0' : 'scale-100'
        } fixed bottom-6 right-6 z-50 transition-all duration-200`}
        aria-label="Open SabiBot"
      >
        <div className="relative w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group">
          {/* Animated Robot Icon */}
          <svg
            className="w-9 h-9 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head */}
            <rect x="12" y="14" width="16" height="14" rx="3" fill="white" opacity="0.95"/>
            
            {/* Eyes with Blink Animation */}
            <rect x="15" y="18" width="3" height="4" rx="1" fill="#ef4444" className="robot-eye robot-eye-left"/>
            <rect x="22" y="18" width="3" height="4" rx="1" fill="#ef4444" className="robot-eye"/>
            
            {/* Antenna with Pulse */}
            <line x1="20" y1="14" x2="20" y2="9" stroke="white" strokeWidth="2"/>
            <circle cx="20" cy="8" r="2" fill="white" className="robot-antenna"/>
            
            {/* Mouth - Speaking Animation */}
            <rect x="16" y="24" width="8" height="2" rx="1" fill="#ef4444" className="robot-mouth"/>
            
            {/* Chat Indicator Dots */}
            <circle cx="28" cy="14" r="1" fill="white" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="32" cy="12" r="1.5" fill="white" opacity="0.8">
              <animate
                attributeName="opacity"
                values="0.8;0.4;0.8"
                dur="1s"
                begin="0.3s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          
          {/* Online Status */}
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
          </span>
        </div>
      </button>

      {/* Chat Widget - Professional Design */}
      <div className={`${
        isOpen ? 'visible' : 'invisible'
      } fixed bottom-0 right-0 z-50 transition-all duration-200`}>
        <div
          className={`${
            isOpen 
              ? isMinimized 
                ? 'h-14 w-80' 
                : 'h-[500px] w-[360px]'
              : 'h-0 w-0'
          } ${
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } bg-white rounded-xl shadow-2xl transition-all duration-200 flex flex-col overflow-hidden border border-gray-200 m-6`}
        >
         {/* Header - Solid Sabitek Red */}
<div className="relative bg-red-600 p-3.5 flex items-center justify-between">
  {/* Subtle accent line */}
  <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10"></div>
  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10"></div>
  
  {/* Logo and Title */}
  <div className="flex items-center gap-3 relative z-10">
    <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
      <Bot className="w-5 h-5 text-white" />
    </div>
    <div className="text-white">
      <h3 className="font-semibold text-sm">SabiBot</h3>
      <p className="text-xs opacity-90">Learning Assistant</p>
    </div>
  </div>
  
  {/* Icon Buttons */}
  <div className="flex items-center gap-1 relative z-10">
    {/* Language Selector */}
    <div className="relative z-50" ref={languageMenuRef}>
      <button
        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Change language"
        title="Change language"
      >
        <Globe className="w-4 h-4 text-white" />
      </button>
      
      {/* Language Dropdown */}
      {showLanguageMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              onClick={() => handleLanguageChange(lang.value as Language)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                preferredLanguage === lang.value ? 'bg-red-50 text-red-600' : 'text-gray-700'
              }`}
            >
              <span>{lang.label}</span>
              <span className="text-lg">{lang.flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
    
    {/* Learning Stats Button */}
    {user && (
      <button
        onClick={() => setShowLearningStats(true)}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="View learning stats"
        title="Your learning journey"
      >
        <BarChart3 className="w-4 h-4 text-white" />
      </button>
    )}
    
    {/* Minimize Button */}
    <button
      onClick={() => setIsMinimized(!isMinimized)}
      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
      aria-label="Minimize"
    >
      <ChevronDown className={`w-4 h-4 text-white transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
    </button>
    
    {/* Close Button */}
    <button
      onClick={() => {
        setIsOpen(false)
        setIsMinimized(false)
      }}
      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
      aria-label="Close"
    >
      <X className="w-4 h-4 text-white" />
    </button>
  </div>
</div>

          {!isMinimized && (
            <>
              {/* Messages Area - Clean Styling */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        
                        <div className={`${
                          message.role === 'user' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-white text-gray-800 border border-gray-200'
                        } rounded-lg px-3.5 py-2.5`}>
                          {message.role === 'assistant' ? (
                            <div className="text-sm">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  ul: ({ children }) => <ul className="ml-4 mb-2 last:mb-0">{children}</ul>,
                                  li: ({ children }) => <li className="list-disc mb-1">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                  code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-xs text-gray-500 mt-1 ${
                        message.role === 'user' ? 'text-right mr-9' : 'ml-9'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator - Simple */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="bg-white rounded-lg px-3.5 py-2.5 border border-gray-200">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse animation-delay-200"></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse animation-delay-400"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions - Simple Design */}
              {messages.length === 1 && (
                <div className="px-4 py-3 bg-white border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Quick actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-700 transition-colors"
                      >
                        <action.icon className="w-3.5 h-3.5" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area - Minimal Design */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={user ? "Type your question..." : "Login to chat with SabiBot"}
                    className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 placeholder-gray-500 disabled:opacity-50"
                    disabled={isLoading || !user}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || !user}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {!user && (
                  <p className="text-xs text-gray-500 mt-2 text-center">Please login to use SabiBot</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Learning Stats Modal */}
      <LearningStats 
        isOpen={showLearningStats} 
        onClose={() => setShowLearningStats(false)} 
      />

      {/* Add animation styles */}
      <style jsx>{animatedButtonStyles}</style>
    </>
  )
}