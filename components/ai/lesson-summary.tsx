'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LessonSummaryProps {
  lessonId: string
  lessonContent?: string
  contentType: string
}

export default function LessonSummary({ lessonId, lessonContent, contentType }: LessonSummaryProps) {
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const generateSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          content: lessonContent,
          contentType
        })
      })

      const data = await response.json()
      if (data.summary) {
        setSummary(data.summary)
        setIsExpanded(true)
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI Lesson Summary</CardTitle>
            <CardDescription>Get an AI-generated overview of this lesson</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 font-medium">AI Powered</span>
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!summary && !loading && (
          <Button 
            onClick={generateSummary}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Generate Summary
          </Button>
        )}
        
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-3 text-gray-600">Generating summary...</span>
          </div>
        )}
        
        {summary && (
          <div className={`transition-all duration-300 ${isExpanded ? 'max-h-full' : 'max-h-32 overflow-hidden'}`}>
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
            </div>
            {summary.length > 200 && (
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-red-500 hover:text-red-600"
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}