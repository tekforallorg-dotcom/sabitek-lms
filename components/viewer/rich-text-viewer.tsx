'use client'
import { useEffect, useRef } from 'react'
import './rich-text-styles.css' // We'll define custom styles

interface RichTextViewerProps {
  content: string
  className?: string
}

export default function RichTextViewer({ content, className = '' }: RichTextViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add responsive classes to embedded videos and images
    if (contentRef.current) {
      // Make images responsive
      const images = contentRef.current.querySelectorAll('img')
      images.forEach(img => {
        img.classList.add('max-w-full', 'h-auto', 'rounded-lg', 'my-4')
      })

      // Make YouTube embeds responsive
      const iframes = contentRef.current.querySelectorAll('iframe')
      iframes.forEach(iframe => {
        if (iframe.src.includes('youtube.com') || iframe.src.includes('youtu.be')) {
          const wrapper = document.createElement('div')
          wrapper.className = 'relative w-full aspect-video my-4'
          iframe.parentNode?.insertBefore(wrapper, iframe)
          wrapper.appendChild(iframe)
          iframe.className = 'absolute inset-0 w-full h-full rounded-lg'
        }
      })

      // Add styling to code blocks
      const codeBlocks = contentRef.current.querySelectorAll('pre')
      codeBlocks.forEach(block => {
        block.classList.add('bg-gray-900', 'text-gray-100', 'p-4', 'rounded-lg', 'overflow-x-auto', 'my-4')
      })

      // Style blockquotes
      const blockquotes = contentRef.current.querySelectorAll('blockquote')
      blockquotes.forEach(quote => {
        quote.classList.add('border-l-4', 'border-red-500', 'pl-4', 'italic', 'my-4', 'text-gray-700')
      })
    }
  }, [content])

  return (
    <div 
      ref={contentRef}
      className={`rich-text-viewer prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}