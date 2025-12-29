'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Loader2, 
  Upload,
  StopCircle,
  Bot,
  User,
  AlertCircle,
  FileText,
  X,
  Sparkles,
  ScanSearch
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ToneType, SabiwriteMessage, ToolType } from '@/lib/sabiwrite/types'

type ActiveTool = 'writing' | 'detection' | 'humanize' | 'plagiarism' | 'settings'

interface ChatPanelProps {
  activeTool: ActiveTool
  selectedTone: ToneType
  onToneChange: (tone: ToneType) => void
  messages: SabiwriteMessage[]
  setMessages: (messages: SabiwriteMessage[] | ((prev: SabiwriteMessage[]) => SabiwriteMessage[])) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  walletBalance: number
  planTier: string
  onOutputUpdate: (output: string) => void
  onWalletUpdate: (balance: number) => void
}

const TONES: { id: ToneType; label: string }[] = [
  { id: 'formal', label: 'Formal' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'executive', label: 'Executive' },
  { id: 'academic', label: 'Academic' }
]

const WRITING_ACTIONS = [
  { id: 'rewrite', label: 'Rewrite', toolType: 'rewrite' as ToolType },
  { id: 'shorten', label: 'Shorten', toolType: 'shorten' as ToolType },
  { id: 'expand', label: 'Expand', toolType: 'expand' as ToolType },
  { id: 'simplify', label: 'Simplify', toolType: 'simplify' as ToolType },
  { id: 'clarity', label: 'Improve Clarity', toolType: 'clarity' as ToolType }
]

interface DetectionResult {
  score: number
  confidence: string
  signals: { type: string; description: string }[]
  summary: string
}

interface PlagiarismResult {
  similarityScore: number
  riskLevel: string
  flags: { type: string; description: string; severity: string }[]
  commonPhrases: string[]
  summary: string
  recommendation: string
}

export default function ChatPanel({
  activeTool,
  selectedTone,
  onToneChange,
  messages,
  setMessages,
  isProcessing,
  setIsProcessing,
  walletBalance,
  planTier,
  onOutputUpdate,
  onWalletUpdate
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('')
  const [selectedAction, setSelectedAction] = useState('rewrite')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [costEstimate, setCostEstimate] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; tokens: number } | null>(null)
  const [chunkInfo, setChunkInfo] = useState<{ count: number; totalCost: number } | null>(null)
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (messages.length > 0 && !isProcessing) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isProcessing])

  useEffect(() => {
    setDetectionResult(null)
    setPlagiarismResult(null)
  }, [activeTool])

  const getToolType = (): ToolType => {
    if (activeTool === 'detection') return 'detection'
    if (activeTool === 'humanize') return 'humanize'
    if (activeTool === 'plagiarism') return 'plagiarism'
    return WRITING_ACTIONS.find(a => a.id === selectedAction)?.toolType || 'rewrite'
  }

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!inputText.trim() || inputText.length < 10) {
        setCostEstimate(null)
        setChunkInfo(null)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const toolType = getToolType()

        const response = await fetch('/api/sabiwrite/pricing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            toolType,
            inputText: inputText.trim(),
            tone: selectedTone
          })
        })

        if (response.ok) {
          const data = await response.json()
          setCostEstimate(data.estimate.totalCostKobo)
          if (data.estimate.chunkCount > 1) {
            setChunkInfo({
              count: data.estimate.chunkCount,
              totalCost: data.estimate.totalCostKobo
            })
          } else {
            setChunkInfo(null)
          }
        }
      } catch (err) {
        console.error('Error fetching estimate:', err)
      }
    }

    const debounce = setTimeout(fetchEstimate, 500)
    return () => clearTimeout(debounce)
  }, [inputText, selectedAction, selectedTone, activeTool])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadedFile(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to upload files')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      if (sessionId) formData.append('sessionId', sessionId)

      const response = await fetch('/api/sabiwrite/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Upload failed')
        return
      }

      setInputText(data.fullText)
      setUploadedFile({
        name: file.name,
        tokens: data.estimatedTokens
      })

      if (data.requiresChunking) {
        setChunkInfo({
          count: data.chunkCount,
          totalCost: 0
        })
      }

    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const clearUploadedFile = () => {
    setUploadedFile(null)
    setInputText('')
    setChunkInfo(null)
  }

  const parseJsonResponse = (content: string): any | null => {
    try {
      const cleanJson = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()
      return JSON.parse(cleanJson)
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isProcessing) return

    setError(null)
    setDetectionResult(null)
    setPlagiarismResult(null)
    const toolType = getToolType()

    const userMessage: SabiwriteMessage = {
      id: Date.now().toString(),
      session_id: sessionId || '',
      user_id: '',
      role: 'user',
      content: inputText.trim().length > 500 
        ? inputText.trim().slice(0, 500) + '...' 
        : inputText.trim(),
      content_type: 'text',
      metadata: { 
        action: activeTool === 'writing' ? selectedAction : activeTool,
        tone: selectedTone,
        fullLength: inputText.trim().length 
      },
      created_at: new Date().toISOString()
    }

    setMessages((prev: SabiwriteMessage[]) => [...prev, userMessage])
    const fullInputText = inputText.trim()
    setInputText('')
    setUploadedFile(null)
    setIsProcessing(true)

    const assistantMessageId = (Date.now() + 1).toString()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to continue')
        setIsProcessing(false)
        return
      }

      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/sabiwrite/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          sessionId,
          toolType,
          action: activeTool === 'writing' ? selectedAction : activeTool,
          inputText: fullInputText,
          tone: selectedTone,
          confirmed: true
        }),
        signal: abortControllerRef.current.signal
      })

      const contentType = response.headers.get('content-type') || ''

      if (!contentType.includes('text/event-stream')) {
        const data = await response.json()
        
        if (data.error === 'Insufficient balance') {
          setError(`Insufficient balance. You need ₦${(data.required / 100).toFixed(0)} but have ₦${(data.balance / 100).toFixed(0)}. Please top up.`)
          setIsProcessing(false)
          return
        }
        
        if (data.error) {
          setError(data.error)
          setIsProcessing(false)
          return
        }
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let messageAdded = false

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            try {
              const json = JSON.parse(trimmed.slice(6))

              if (json.content) {
                fullContent += json.content

                if (!messageAdded) {
                  setMessages((prev: SabiwriteMessage[]) => [...prev, {
                    id: assistantMessageId,
                    session_id: sessionId || '',
                    user_id: '',
                    role: 'assistant',
                    content: fullContent,
                    content_type: 'output',
                    metadata: { action: activeTool === 'writing' ? selectedAction : activeTool, tone: selectedTone },
                    created_at: new Date().toISOString()
                  }])
                  messageAdded = true
                } else {
                  setMessages((prev: SabiwriteMessage[]) => prev.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, content: fullContent }
                      : m
                  ))
                }

                if (activeTool === 'detection') {
                  const parsed = parseJsonResponse(fullContent)
                  if (parsed && parsed.score !== undefined) {
                    setDetectionResult(parsed)
                  }
                } else if (activeTool === 'plagiarism') {
                  const parsed = parseJsonResponse(fullContent)
                  if (parsed && parsed.similarityScore !== undefined) {
                    setPlagiarismResult(parsed)
                  }
                } else {
                  onOutputUpdate(fullContent)
                }
              }

              if (json.done) {
                if (json.sessionId) setSessionId(json.sessionId)
                if (json.newBalance !== undefined) onWalletUpdate(json.newBalance)
                
                setMessages((prev: SabiwriteMessage[]) => prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, metadata: { ...m.metadata, cost_kobo: json.costKobo, model_used: json.model } }
                    : m
                ))
              }

              if (json.error) {
                setError(json.error)
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev: SabiwriteMessage[]) => prev.map(m =>
          m.id === assistantMessageId
            ? { ...m, metadata: { ...m.metadata, partial: true } }
            : m
        ))
      } else {
        console.error('Process error:', err)
        setError('An error occurred. Please try again.')
      }
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
      setChunkInfo(null)
    }
  }

  const handleStop = () => {
    abortControllerRef.current?.abort()
    setIsProcessing(false)
  }

  const getToolTitle = () => {
    switch (activeTool) {
      case 'writing': return 'Writing Assistant'
      case 'detection': return 'AI Detection'
      case 'humanize': return 'Humanizer'
      case 'plagiarism': return 'Plagiarism Check'
      case 'settings': return 'Settings'
      default: return 'SabiWrite'
    }
  }

  const getToolDescription = () => {
    switch (activeTool) {
      case 'writing': return 'Paste your text and choose an action to transform it'
      case 'detection': return 'Check the probability that text was written by AI'
      case 'humanize': return 'Transform AI-generated text to sound more natural'
      case 'plagiarism': return 'Check for similarity with existing content'
      case 'settings': return 'Configure your preferences'
      default: return ''
    }
  }

  const getActionLabel = () => {
    switch (activeTool) {
      case 'detection': return 'Analyze'
      case 'humanize': return 'Humanize'
      case 'plagiarism': return 'Check'
      default: return 'Send'
    }
  }

  const formatNaira = (kobo: number) => `₦${(kobo / 100).toFixed(0)}`

  return (
    <div className="flex flex-col h-full">
      {/* Tool Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {activeTool === 'detection' && <ScanSearch className="w-5 h-5 text-gray-600" />}
          {activeTool === 'humanize' && <Sparkles className="w-5 h-5 text-gray-600" />}
          <div>
            <h2 className="text-base font-semibold text-gray-900">{getToolTitle()}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{getToolDescription()}</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-lg leading-none">
            &times;
          </button>
        </div>
      )}

      {/* Detection Result Card */}
      {activeTool === 'detection' && detectionResult && (
        <div className="mx-4 mt-4 p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Detection Result</h3>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              detectionResult.score <= 30 ? 'text-green-600 bg-green-100' :
              detectionResult.score <= 60 ? 'text-yellow-600 bg-yellow-100' : 
              'text-red-600 bg-red-100'
            }`}>
              {detectionResult.score}% - {detectionResult.score <= 30 ? 'Likely Human' : detectionResult.score <= 60 ? 'Uncertain' : 'Likely AI'}
            </span>
          </div>
          
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  detectionResult.score <= 30 ? 'bg-green-500' :
                  detectionResult.score <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${detectionResult.score}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Human</span>
              <span>AI</span>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-3">{detectionResult.summary}</p>

          {detectionResult.signals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase">Signals Detected</p>
              {detectionResult.signals.map((signal, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span className="text-gray-600">{signal.description}</span>
                </div>
              ))}
            </div>
          )}

         <p className="text-xs text-gray-400 mt-3">
  Confidence: {detectionResult.confidence} · {detectionResult.score}%
</p>
        </div>
      )}

      {/* Plagiarism Result Card */}
      {activeTool === 'plagiarism' && plagiarismResult && (
        <div className="mx-4 mt-4 p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Plagiarism Analysis</h3>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              plagiarismResult.similarityScore <= 20 ? 'text-green-600 bg-green-100' :
              plagiarismResult.similarityScore <= 50 ? 'text-yellow-600 bg-yellow-100' : 
              'text-red-600 bg-red-100'
            }`}>
              {plagiarismResult.similarityScore}% - {plagiarismResult.riskLevel} risk
            </span>
          </div>
          
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  plagiarismResult.similarityScore <= 20 ? 'bg-green-500' :
                  plagiarismResult.similarityScore <= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${plagiarismResult.similarityScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Original</span>
              <span>Similar</span>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-3">{plagiarismResult.summary}</p>

          {plagiarismResult.flags.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Flags</p>
              <div className="space-y-2">
                {plagiarismResult.flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      flag.severity === 'high' ? 'bg-red-400' :
                      flag.severity === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                    <span className="text-gray-600">{flag.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plagiarismResult.commonPhrases.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Common Phrases Detected</p>
              <div className="flex flex-wrap gap-2">
                {plagiarismResult.commonPhrases.slice(0, 5).map((phrase, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    "{phrase}"
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">{plagiarismResult.recommendation}</p>
          </div>

        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No messages yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              {activeTool === 'detection' 
                ? 'Paste text to analyze for AI-generated content'
                : activeTool === 'humanize'
                ? 'Paste AI-generated text to make it sound more natural'
                : activeTool === 'plagiarism'
                ? 'Paste text to check for potential plagiarism'
                : 'Paste your text below or upload a file to get started'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-red-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
            {message.role === 'assistant' && (message.metadata?.action === 'detection' || message.metadata?.action === 'plagiarism') ? (
  <p className="text-sm text-gray-500 italic">Analysis complete.</p>
) : (
  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
)}
                {message.metadata?.fullLength && message.metadata.fullLength > 500 && (
                  <p className="text-xs mt-1 opacity-70">
                    ({message.metadata.fullLength.toLocaleString()} characters)
                  </p>
                )}
                {message.metadata?.cost_kobo && (
                  <p className="text-xs mt-2 opacity-70">
                    Charged: {formatNaira(message.metadata.cost_kobo)}
                  </p>
                )}
                {message.metadata?.partial && (
                  <p className="text-xs mt-2 text-yellow-600">Partial (stopped)</p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}

        {isProcessing && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-red-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">
                  {activeTool === 'detection' ? 'Analyzing...' : 
                   activeTool === 'humanize' ? 'Humanizing...' : 
                   activeTool === 'plagiarism' ? 'Checking...' :
                   'SabiBot is writing...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        {(activeTool === 'writing' || activeTool === 'humanize') && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Tone</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => onToneChange(tone.id)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    selectedTone === tone.id
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                  } disabled:opacity-50`}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTool === 'writing' && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Action</p>
            <div className="flex flex-wrap gap-2">
              {WRITING_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedAction === action.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {uploadedFile && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 flex-1">
              {uploadedFile.name} ({uploadedFile.tokens.toLocaleString()} tokens)
            </span>
            <button onClick={clearUploadedFile} className="p-1 hover:bg-blue-100 rounded">
              <X className="w-3 h-3 text-blue-600" />
            </button>
          </div>
        )}

        {chunkInfo && chunkInfo.count > 1 && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700">
              Large text detected. Will be processed in {chunkInfo.count} chunks.
              {costEstimate && ` Estimated total: ${formatNaira(costEstimate)}`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeTool === 'detection' 
                  ? 'Paste text to check for AI-generated content...'
                  : activeTool === 'humanize'
                  ? 'Paste AI-generated text to humanize...'
                  : activeTool === 'plagiarism'
                  ? 'Paste text to check for plagiarism...'
                  : 'Paste your text here or upload a file...'
              }
              rows={3}
              className="w-full px-4 py-3 pl-10 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              disabled={isProcessing}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.pptx,.txt,.md,.csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isUploading}
              className="absolute bottom-3 left-3 p-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Upload file"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </button>
            {costEstimate && !chunkInfo && (
              <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                Est. {formatNaira(costEstimate)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {isProcessing ? (
              <button
                type="button"
                onClick={handleStop}
                className="p-3 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                title="Stop"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim() || isUploading}
                className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={getActionLabel()}
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {inputText.length > 0 && (
          <p className="text-xs text-gray-400 mt-2 text-right">
            {inputText.length.toLocaleString()} characters
          </p>
        )}
      </div>
    </div>
  )
}