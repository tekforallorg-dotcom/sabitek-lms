'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Bot, User, Loader2, ChevronDown, BookOpen, GraduationCap, Target, Briefcase, Globe, BarChart3 } from 'lucide-react'
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
  const [userScrolled, setUserScrolled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousUserId = useRef<string | null>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)

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
      
      if (profile?.preferred_language) {
        setPreferredLanguage(profile.preferred_language as Language)
      }
      
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
        return `Wetin dey happen${name}! Na me be SabiBot, your learning paddy.

I fit help you with:
• Course wey go match your goal
• Career advice and which path to follow
• Tech career wey dey pay well well
• Online teaching wey go fetch you dollar
• How to read and pass exam well well
• Certification and adult education

Wetin you wan learn today?`
      
      case 'yoruba':
        return `Bawo ni${name}! Mo ni SabiBot, oluranlọwọ ikẹkọ rẹ.

Mo le ran ọ lọwọ pẹlu:
• Awọn iṣẹ ikẹkọ ti o dara fun ọ
• Imọran iṣẹ ati ọna lati tẹle
• Iṣẹ imọ-ẹrọ ti o san owo daradara
• Ẹkọ lori ayelujara ti o le san owo dọla
• Ilana kika ati igbaradi idanwo
• Iwe-ẹri ọjọgbọn ati ẹkọ agbalagba

Kini o fẹ kọ loni?`
      
      case 'hausa':
        return `Sannu${name}! Ni ne SabiBot, mataimakin koyo naka.

Zan iya taimaka maka da:
• Darussa da za su dace da burin ka
• Shawarar sana'a da hanyar da za ka bi
• Sana'ar fasaha da ke biyan kuɗi sosai
• Koyarwa ta yanar gizo da za ta kawo dala
• Dabarun karatu da shirye-shiryen jarrabawa
• Takardar shaidar ƙwararru da ilimin manya

Me kake son koyo yau?`
      
      case 'igbo':
        return `Kedu${name}! Abụ m SabiBot, onye enyemaka ọmụmụ gị.

Enwere m ike inyere gị aka na:
• Usoro nkuzi dabara maka ebumnuche gị
• Ndụmọdụ ọrụ na ụzọ ị ga-eso
• Ọrụ teknụzụ na-akwụ ụgwọ nke ọma
• Nkuzi n'ịntanetị nke ga-eweta dọla
• Usoro ọgụgụ na nkwadebe ule
• Asambodo ndị ọkachamara na agụmakwụkwọ

Gịnị ka ịchọrọ ịmụta taa?`
      
      default:
        return `Welcome${name}! I'm SabiBot, your personal learning assistant.

I can help you with:
• Course recommendations for your goals
• Career guidance and strategic planning
• Tech careers with high earning potential
• Online teaching opportunities
• Study strategies and exam preparation
• Professional certifications

What would you like to learn today?`
    }
  }

  const setDefaultWelcome = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(null, preferredLanguage),
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }

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

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return true
    const threshold = 100
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }, [])

  const scrollToBottom = useCallback((force = false) => {
    if (force || (!userScrolled && isNearBottom())) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [userScrolled, isNearBottom])

  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom()
    setUserScrolled(!nearBottom)
  }, [isNearBottom])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      setUserScrolled(false)
      scrollToBottom(true)
    }
  }, [messages.length])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const handleLanguageChange = async (newLanguage: Language) => {
    setPreferredLanguage(newLanguage)
    setShowLanguageMenu(false)

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ preferred_language: newLanguage })
          .eq('id', user.id)

        if (error) {
          console.error('Error saving language preference:', error)
        } else {
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

  const getErrorMessage = (lang: Language) => {
    switch (lang) {
      case 'pidgin': return 'I no fit answer now. Abeg try again.'
      case 'yoruba': return 'Mi o le dahun ni bayi. Jọwọ gbiyanju lẹẹkansi.'
      case 'hausa': return 'Ba zan iya amsa yanzu ba. Da fatan za a sake gwadawa.'
      case 'igbo': return 'Enweghị m ike ịza ugbu a. Biko nwaa ọzọ.'
      default: return 'I could not generate a response. Please try again.'
    }
  }

  const getConnectionErrorMessage = (lang: Language) => {
    switch (lang) {
      case 'pidgin': return 'Network wahala dey. Check your internet make you try again.'
      case 'yoruba': return 'Isoro asopọ wa. Jọwọ ṣayẹwo intanẹẹti rẹ ki o tun gbiyanju.'
      case 'hausa': return 'Matsalar haɗin yanar gizo. Da fatan za a duba intanet ɗin ku sannan ku sake gwadawa.'
      case 'igbo': return 'Nsogbu njikọ. Biko lelee ịntanetị gị wee nwaa ọzọ.'
      default: return 'Connection issue. Please check your internet and try again.'
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
    setUserScrolled(false)

    const assistantMessageId = (Date.now() + 1).toString()

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
            preferredLanguage: preferredLanguage,
            strictLanguage: true
          }
        })
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('text/event-stream') || contentType.includes('stream')) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let messageAdded = false

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')

              for (const line of lines) {
                const trimmedLine = line.trim()
                if (!trimmedLine || trimmedLine === 'data: [DONE]') continue
                if (!trimmedLine.startsWith('data: ')) continue

                try {
                  const jsonStr = trimmedLine.slice(6)
                  const json = JSON.parse(jsonStr)
                  if (json.content) {
                    fullContent += json.content
                    
                    if (!messageAdded) {
                      setIsTyping(false)
                      setMessages(prev => [...prev, {
                        id: assistantMessageId,
                        role: 'assistant',
                        content: fullContent,
                        timestamp: new Date()
                      }])
                      messageAdded = true
                    } else {
                      setMessages(prev => prev.map(m => 
                        m.id === assistantMessageId 
                          ? { ...m, content: fullContent }
                          : m
                      ))
                    }
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          } finally {
            reader.releaseLock()
          }
        }

        setTimeout(() => scrollToBottom(true), 100)

        if (!fullContent) {
          setIsTyping(false)
          setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: getErrorMessage(preferredLanguage),
            timestamp: new Date()
          }])
        } else if (user?.id) {
          saveConversation(userMessage, { id: assistantMessageId, role: 'assistant', content: fullContent, timestamp: new Date() })
          updateMemory(user.id, userMessage.content, fullContent)
        }
      } else {
        const data = await response.json()
        setIsTyping(false)
        
        const content = data.content || getErrorMessage(preferredLanguage)
        setMessages(prev => [...prev, {
          id: assistantMessageId,
          role: 'assistant',
          content,
          timestamp: new Date()
        }])

        if (user?.id && content) {
          saveConversation(userMessage, { id: assistantMessageId, role: 'assistant', content, timestamp: new Date() })
          updateMemory(user.id, userMessage.content, content)
        }
      }

    } catch (error) {
      console.error('SabiBot Error:', error)
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: getConnectionErrorMessage(preferredLanguage),
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

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

  const updateMemory = async (userId: string, userMsg: string, assistantMsg: string) => {
    try {
      fetch('/api/sabibot/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'update_streak'
        })
      }).catch(err => console.log('Streak update failed:', err))
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

  const getQuickActions = (lang: Language) => {
    switch (lang) {
      case 'pidgin':
        return [
          { icon: Briefcase, label: 'Career Path', prompt: 'Which career path I suppose follow?' },
          { icon: BookOpen, label: 'Find Courses', prompt: 'Recommend course wey go fit my goal' },
          { icon: GraduationCap, label: 'Study Tips', prompt: 'Give me beta study tips' },
          { icon: Target, label: 'Get Started', prompt: 'How I go start to learn for Sabitek?' },
        ]
      case 'yoruba':
        return [
          { icon: Briefcase, label: 'Ọna Iṣẹ', prompt: 'Ọna iṣẹ wo ni mo yẹ ki n yan?' },
          { icon: BookOpen, label: 'Wa Ẹkọ', prompt: 'Ṣe alaye iṣẹ ikẹkọ fun awọn ibi-afẹde mi' },
          { icon: GraduationCap, label: 'Imọran', prompt: 'Fun mi ni ilana kika to dara' },
          { icon: Target, label: 'Bẹrẹ', prompt: 'Bawo ni mo ṣe le bẹrẹ lati kọ ẹkọ lori Sabitek?' },
        ]
      case 'hausa':
        return [
          { icon: Briefcase, label: 'Hanyar Aiki', prompt: 'Wace hanyar sana\'a ya kamata in zaɓa?' },
          { icon: BookOpen, label: 'Nemo Darasi', prompt: 'Ka ba da shawarar darussa don burina' },
          { icon: GraduationCap, label: 'Shawarwari', prompt: 'Ba ni dabaru masu kyau na karatu' },
          { icon: Target, label: 'Fara', prompt: 'Ta yaya zan fara koyo a Sabitek?' },
        ]
      case 'igbo':
        return [
          { icon: Briefcase, label: 'Ụzọ Ọrụ', prompt: 'Kedu ụzọ ọrụ m kwesịrị ịhọrọ?' },
          { icon: BookOpen, label: 'Chọta Ihe', prompt: 'Tụọ aro usoro nkuzi maka ebumnuche m' },
          { icon: GraduationCap, label: 'Ndụmọdụ', prompt: 'Nye m usoro ọgụgụ dị mma' },
          { icon: Target, label: 'Malite', prompt: 'Kedu ka m ga-esi malite ịmụ ihe na Sabitek?' },
        ]
      default:
        return [
          { icon: Briefcase, label: 'Career Path', prompt: 'What career path should I choose?' },
          { icon: BookOpen, label: 'Find Courses', prompt: 'Recommend courses for my goals' },
          { icon: GraduationCap, label: 'Study Tips', prompt: 'Give me effective study strategies' },
          { icon: Target, label: 'Get Started', prompt: 'How do I start learning on Sabitek?' },
        ]
    }
  }

  const QUICK_ACTIONS = getQuickActions(preferredLanguage)

  return (
    <>
      {/* Floating Chat Button - Animated Robot Head */}
      <button
        onClick={() => setIsOpen(true)}
        className={`${
          isOpen ? 'scale-0 pointer-events-none' : 'scale-100'
        } fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-transform duration-200`}
        aria-label="Open SabiBot"
      >
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 group">
          {/* Animated Robot Icon */}
          <svg
            className="w-7 h-7 sm:w-9 sm:h-9 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
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
            
            {/* Mouth */}
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
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
          </span>
        </div>
      </button>

      {/* Chat Widget */}
      <div
  className={`${
    isOpen 
      ? isMinimized 
        ? 'h-14 w-72 sm:w-80' 
        : 'h-[60vh] sm:h-[500px] w-[calc(100%-2rem)] sm:w-[360px]'
      : 'h-0 w-0'
  } ${
    isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
  } bg-white rounded-xl shadow-2xl transition-all duration-200 flex flex-col overflow-hidden border border-gray-200 m-4 fixed bottom-0 right-0`}
>
        
        <div
          className={`${
            isOpen 
              ? isMinimized 
                ? 'h-14 w-full sm:w-80' 
                : 'h-full sm:h-[500px] w-full sm:w-[360px]'
              : 'h-0 w-0'
          } ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          } bg-white sm:rounded-xl shadow-2xl transition-all duration-200 flex flex-col overflow-hidden border-0 sm:border sm:border-gray-200 sm:m-4 fixed bottom-0 right-0 sm:relative`}
        >
          {/* Header */}
          <div className="relative bg-red-600 p-3 sm:p-3.5 flex items-center justify-between flex-shrink-0 safe-area-top">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-white">
                <h3 className="font-semibold text-sm">SabiBot</h3>
                <p className="text-[10px] sm:text-xs opacity-90">
                  {LANGUAGES.find(l => l.value === preferredLanguage)?.flag} {LANGUAGES.find(l => l.value === preferredLanguage)?.label}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="relative z-50" ref={languageMenuRef}>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="p-2 sm:p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Change language"
                >
                  <Globe className="w-4 h-4 text-white" />
                </button>
                
                {showLanguageMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999]">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => handleLanguageChange(lang.value as Language)}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
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
              
              {user && (
                <button
                  onClick={() => setShowLearningStats(true)}
                  className="p-2 sm:p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="View learning stats"
                >
                  <BarChart3 className="w-4 h-4 text-white" />
                </button>
              )}
              
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hidden sm:block p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Minimize"
              >
                <ChevronDown className={`w-4 h-4 text-white transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                }}
                className="p-2 sm:p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3 bg-gray-50"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        {message.role === 'assistant' && (
                          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                          </div>
                        )}
                        
                        <div className={`${
                          message.role === 'user' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-white text-gray-800 border border-gray-200'
                        } rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5`}>
                          {message.role === 'assistant' ? (
                            <div className="text-[13px] sm:text-sm leading-relaxed">
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
                            <p className="text-[13px] sm:text-sm">{message.content}</p>
                          )}
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-[10px] sm:text-xs text-gray-400 mt-1 ${
                        message.role === 'user' ? 'text-right mr-8 sm:mr-9' : 'ml-8 sm:ml-9'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                      </div>
                      <div className="bg-white rounded-2xl px-3.5 py-2.5 border border-gray-200">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {userScrolled && (
                <button
                  onClick={() => {
                    setUserScrolled(false)
                    scrollToBottom(true)
                  }}
                  className="absolute bottom-24 right-4 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                  aria-label="Scroll to bottom"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
              )}

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-t border-gray-100">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-2">
                    {preferredLanguage === 'pidgin' ? 'Quick actions' : 
                     preferredLanguage === 'yoruba' ? 'Awọn iṣe yara' :
                     preferredLanguage === 'hausa' ? 'Ayyuka masu sauri' :
                     preferredLanguage === 'igbo' ? 'Omume ngwa ngwa' :
                     'Quick actions'}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-[11px] sm:text-xs text-gray-700 transition-colors"
                      >
                        <action.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="truncate">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-100 safe-area-bottom">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={
                      !user 
                        ? (preferredLanguage === 'pidgin' ? 'Login to chat' : 
                           preferredLanguage === 'yoruba' ? 'Wọle lati ba mi sọrọ' :
                           preferredLanguage === 'hausa' ? 'Shiga don tattaunawa' :
                           preferredLanguage === 'igbo' ? 'Banye iji kwurịta' :
                           'Login to chat')
                        : (preferredLanguage === 'pidgin' ? 'Type wetin you wan ask...' : 
                           preferredLanguage === 'yoruba' ? 'Kọ ibeere rẹ...' :
                           preferredLanguage === 'hausa' ? 'Rubuta tambayar ka...' :
                           preferredLanguage === 'igbo' ? 'Pịnye ajụjụ gị...' :
                           'Type your question...')
                    }
                    className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 placeholder-gray-400 disabled:opacity-50"
                    disabled={isLoading || !user}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || !user}
                    className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center">
                    {preferredLanguage === 'pidgin' ? 'Abeg login to use SabiBot' : 
                     preferredLanguage === 'yoruba' ? 'Jọwọ wọle lati lo SabiBot' :
                     preferredLanguage === 'hausa' ? 'Da fatan za a shiga don amfani da SabiBot' :
                     preferredLanguage === 'igbo' ? 'Biko banye iji SabiBot' :
                     'Please login to use SabiBot'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <LearningStats 
        isOpen={showLearningStats} 
        onClose={() => setShowLearningStats(false)} 
      />

      {/* Animation styles */}
      <style jsx global>{`
        .safe-area-top {
          padding-top: max(0.75rem, env(safe-area-inset-top));
        }
        .safe-area-bottom {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }
        
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
          0%, 100% { transform-origin: center; transform: scale(1); }
          50% { transform-origin: center; transform: scale(1.2); }
        }
        
        .robot-antenna {
          animation: antenna-pulse 2s ease-in-out infinite;
        }
        
        @keyframes mouth-speak {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .robot-mouth {
          animation: mouth-speak 1.5s infinite;
        }
      `}</style>
    </>
  )
}