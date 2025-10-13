'use client'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LessonQAProps {
  lessonId: string
  lessonContent?: string
  contentType: string
}

interface QAPair {
  question: string
  answer: string
  timestamp: Date
}

export default function LessonQA({ lessonId, lessonContent, contentType }: LessonQAProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [qaHistory, setQaHistory] = useState<QAPair[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const askQuestion = async () => {
    if (!question.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/ai/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          question,
          lessonContent,
          contentType
        })
      })

      const data = await response.json()
      if (data.answer) {
        setQaHistory([
          ...qaHistory,
          {
            question: question,
            answer: data.answer,
            timestamp: new Date()
          }
        ])
        setQuestion('')
        setIsExpanded(true)
      }
    } catch (error) {
      console.error('Error getting answer:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI Study Assistant</CardTitle>
            <CardDescription>Ask questions about this lesson</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 font-medium">AI Powered</span>
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
            </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Question Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about this lesson..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && askQuestion()}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Ask'
              )}
            </Button>
          </div>

          {/* Q&A History */}
          {qaHistory.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Previous Questions</h3>
                {qaHistory.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-red-500"
                  >
                    {isExpanded ? 'Show Less' : `Show All (${qaHistory.length})`}
                  </Button>
                )}
              </div>
              
              <div className={`space-y-3 ${!isExpanded && qaHistory.length > 2 ? 'max-h-96 overflow-hidden' : ''}`}>
                {(isExpanded ? qaHistory : qaHistory.slice(-2)).map((qa, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 font-medium text-sm">Q:</span>
                      <p className="text-sm text-gray-800 flex-1">{qa.question}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 font-medium text-sm">A:</span>
                      <p className="text-sm text-gray-600 flex-1">{qa.answer}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {qa.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Questions */}
          {qaHistory.length === 0 && (
            <div className="text-sm text-gray-600">
              <p className="mb-2">Try asking:</p>
              <div className="space-y-1">
                <button
                  onClick={() => setQuestion("Can you explain the main concepts in this lesson?")}
                  className="block text-left text-red-500 hover:text-red-600 text-sm"
                >
                  • Can you explain the main concepts?
                </button>
                <button
                  onClick={() => setQuestion("What are the key takeaways from this lesson?")}
                  className="block text-left text-red-500 hover:text-red-600 text-sm"
                >
                  • What are the key takeaways?
                </button>
                <button
                  onClick={() => setQuestion("How does this relate to real-world applications?")}
                  className="block text-left text-red-500 hover:text-red-600 text-sm"
                >
                  • How does this relate to real-world applications?
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}