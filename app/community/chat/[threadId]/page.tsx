'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, Calendar, Video, ExternalLink, Loader2, Info } from 'lucide-react'

interface Message {
  id: string
  thread_id: string
  sender_id: string
  content: string
  content_type: 'text' | 'system'
  is_deleted: boolean
  created_at: string
  sender: { id: string; full_name: string; avatar_url: string | null } | null
}

interface ThreadDetails {
  id: string
  session_id: string
  context: string
  session: {
    id: string
    status: string
    scheduled_start: string | null
    scheduled_end: string | null
    meeting_url: string | null
    meeting_provider: string | null
    learner: { id: string; full_name: string; email: string; avatar_url: string | null }
    mentor: { id: string; full_name: string; email: string; avatar_url: string | null }
    skill: { id: string; name: string; slug: string } | null
  } | null
  other_user: { id: string; full_name: string; avatar_url: string | null } | null
  my_role: string
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const threadId = params.threadId as string
  const { user, loading: authLoading } = useAuth()

  const [thread, setThread] = useState<ThreadDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevMessagesLengthRef = useRef<number>(0)

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    }
  }

useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/community/chat/${threadId}`)
    } else if (user && threadId) {
      fetchThread()
      fetchMessages()

      // Subscribe to realtime messages
      const channel = supabase
        .channel(`thread-${threadId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `thread_id=eq.${threadId}`
          },
          async (payload) => {
            const newMsg = payload.new as Message
            // Only add if not from current user (we already have optimistic update)
            if (newMsg.sender_id !== user.id) {
              // Fetch sender info
              const { data: sender } = await supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .eq('id', newMsg.sender_id)
                .single()
              
              const messageWithSender: Message = {
                ...newMsg,
                sender: sender || null
              }
              
              setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === newMsg.id)) return prev
                return [...prev, messageWithSender]
              })
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, authLoading, router, threadId])

  const fetchThread = async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/threads/${threadId}`, { headers })
      const data = await res.json()
      if (res.ok) {
        setThread(data.thread)
      } else {
        alert(data.error || 'Failed to load conversation')
        router.push('/community/inbox')
      }
    } catch (error) {
      console.error('Error fetching thread:', error)
    }
  }

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/threads/${threadId}/messages`, { headers })
      const data = await res.json()
      if (res.ok) {
        const fetchedMessages = data.messages || []
        setMessages(fetchedMessages)
        prevMessagesLengthRef.current = fetchedMessages.length
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      thread_id: threadId,
      sender_id: user!.id,
      content: messageContent,
      content_type: 'text',
      is_deleted: false,
      created_at: new Date().toISOString(),
      sender: { id: user!.id, full_name: 'You', avatar_url: null }
    }
    
    setMessages(prev => {
      prevMessagesLengthRef.current = prev.length
      return [...prev, optimisticMessage]
    })

    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/threads/${threadId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: messageContent })
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? data.message : m))
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
        alert(data.error || 'Failed to send message')
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      setNewMessage(messageContent)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const shouldShowDateDivider = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true
    return new Date(currentMsg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()
  }

  if (authLoading || !thread) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/community/inbox')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {thread.other_user?.avatar_url ? (
                    <img src={thread.other_user.avatar_url} alt={thread.other_user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                      {thread.other_user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{thread.other_user?.full_name || 'Unknown'}</p>
                  {thread.session?.skill && <p className="text-xs text-gray-500">{thread.session.skill.name}</p>}
                </div>
              </div>
            </div>
            <button onClick={() => setShowInfo(!showInfo)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Info className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {showInfo && thread.session && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  thread.session.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                  thread.session.status === 'completed' ? 'bg-green-100 text-green-600' :
                  thread.session.status === 'proposed' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                }`}>{thread.session.status}</span>
                <Button size="sm" variant="outline" onClick={() => router.push('/community/sessions')} className="text-xs">
                  <Calendar className="w-3.5 h-3.5 mr-1" />View Session
                </Button>
              </div>
              {thread.session.scheduled_start && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(thread.session.scheduled_start).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {thread.session.meeting_url && thread.session.status === 'scheduled' && (
                <a href={thread.session.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors">
                  <Video className="w-4 h-4" />Join Meeting<ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null
                const isMe = message.sender_id === user?.id
                const showDivider = shouldShowDateDivider(message, prevMessage)
                return (
                  <div key={message.id}>
                    {showDivider && (
                      <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">{formatDateDivider(message.created_at)}</span>
                      </div>
                    )}
                    {message.content_type === 'system' ? (
                      <div className="flex justify-center">
                        <p className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg max-w-xs text-center">{message.content}</p>
                      </div>
                    ) : (
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              {message.sender?.avatar_url ? (
                                <img src={message.sender.avatar_url} alt={message.sender.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                                  {message.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-red-500 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'}`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right' : ''}`}>{formatMessageTime(message.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
                maxLength={2000}
                className="w-full px-4 py-2.5 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white text-sm"
                style={{ maxHeight: '120px', minHeight: '44px' }}
              />
            </div>
            <Button onClick={handleSend} disabled={!newMessage.trim() || sending} className="w-11 h-11 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full flex-shrink-0">
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}