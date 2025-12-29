'use client'

import { useState } from 'react'
import { 
  Copy, 
  Check, 
  Download, 
  FileText, 
  FileDown,
  X,
  History,
  ChevronDown
} from 'lucide-react'

interface OutputPanelProps {
  output: string
  isProcessing: boolean
  onClose: () => void
}

export default function OutputPanel({ output, isProcessing, onClose }: OutputPanelProps) {
  const [copied, setCopied] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleCopy = async () => {
    if (!output) return
    
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleExport = (format: 'txt' | 'docx' | 'pdf') => {
    if (!output) return

    if (format === 'txt') {
      const blob = new Blob([output], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sabiwrite-output-${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }

    // TODO: Implement DOCX and PDF export in later slice
    setShowExportMenu(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Output</h3>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!output && !isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No output yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Your transformed text will appear here
            </p>
          </div>
        ) : isProcessing && !output ? (
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {output}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {output && (
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Export as TXT
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Export as DOCX
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Export as PDF
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Version History Button */}
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            <History className="w-4 h-4" />
            Version History
          </button>
        </div>
      )}
    </div>
  )
}