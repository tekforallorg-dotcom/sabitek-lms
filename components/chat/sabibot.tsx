'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, BookOpen, GraduationCap, Target, Briefcase } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export default function SabiBot() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousUserId = useRef<string | null>(null)

  // Reset chat when user changes
  useEffect(() => {
    if (user?.id !== previousUserId.current) {
      // User has changed, reset everything
      setMessages([])
      setIsOpen(false)
      setIsMinimized(false)
      previousUserId.current = user?.id || null
      
      // Load user profile if logged in
      if (user?.id) {
        loadUserProfile()
      } else {
        setUserProfile(null)
      }
    }
  }, [user?.id])

  // Load user profile for personalization
  const loadUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, learning_goals')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)
      
      // Set personalized welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Welcome back${profile?.full_name ? ', ' + profile.full_name : ''}! I'm SabiBot, your personal AI learning assistant.

I can help you with:
- Course recommendations tailored to your goals
- Career guidance and learning paths
- Study strategies and techniques
- Understanding course content
- Navigating the platform

${profile?.learning_goals ? `I see you're interested in ${profile.learning_goals}. ` : ''}How can I assist your learning journey today?`,
        timestamp: new Date()
      }
      
      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Error loading profile:', error)
      // Set default welcome message
      setDefaultWelcome()
    }
  }

  const setDefaultWelcome = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to Sabitek. I'm SabiBot, your AI learning assistant.

I can help you with:
- Course recommendations tailored to your goals
- Career guidance and learning paths
- Study strategies and techniques
- Understanding course content
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
        // User profile already loaded, set personalized welcome
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: `Welcome back${userProfile?.full_name ? ', ' + userProfile.full_name : ''}! I'm SabiBot, your personal AI learning assistant.

I can help you with:
- Course recommendations tailored to your goals
- Career guidance and learning paths
- Study strategies and techniques
- Understanding course content
- Navigating the platform

${userProfile?.learning_goals ? `I see you're interested in ${userProfile.learning_goals}. ` : ''}How can I assist your learning journey today?`,
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
      // Include user context in the API call
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
            learningGoals: userProfile?.learning_goals,
            isAuthenticated: !!user
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

        // Optionally save conversation to database for this user
        if (user?.id) {
          saveConversation(userMessage, assistantMessage)
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

  // Save conversation to database (optional)
  const saveConversation = async (userMsg: Message, assistantMsg: Message) => {
    if (!user?.id) return

    try {
      await supabase.from('chat_history').insert({
        user_id: user.id,
        user_message: userMsg.content,
        assistant_message: assistantMsg.content,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error saving conversation:', error)
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

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`${
          isOpen ? 'scale-0' : 'scale-100'
        } fixed bottom-6 right-6 z-50 transition-all duration-200`}
        aria-label="Open Chat"
      >
        <div className="relative w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all">
          <MessageCircle className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
        </div>
      </button>

      {/* Chat Widget */}
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
          {/* Header */}
          <div className="bg-red-500 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <h3 className="font-semibold text-sm">SabiBot</h3>
                <p className="text-xs opacity-90">
                  {user ? 'Personal Assistant' : 'Learning Assistant'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Minimize"
              >
                <ChevronDown className={`w-4 h-4 text-white transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
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
                
                {/* Typing Indicator */}
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

              {/* Quick Actions */}
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

              {/* Input Area */}
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

      <style jsx>{`
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </>
  )
}