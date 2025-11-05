'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, Loader2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { extractText, validateFile } from '@/lib/sabiquiz/extract-text'
import { CATEGORIES, LEVELS, type UploadProgress } from '@/lib/sabiquiz/types'

interface FileUploadProps {
  onUploadComplete?: () => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }
    
    setSelectedFile(file)
    setError(null)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleUpload = async () => {
    if (!selectedFile || !category || !level) {
      setError('Please select a file, category, and level')
      return
    }

    setUploading(true)
    setError(null)
    setProgress({ filename: selectedFile.name, progress: 0, status: 'uploading' })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please sign in to upload materials')
      }

      const userId = user.id
      const filePath = `${userId}/${Date.now()}-${selectedFile.name}`
      
      setProgress({ filename: selectedFile.name, progress: 30, status: 'uploading' })

      const { error: uploadError } = await supabase.storage
        .from('sabiquiz-materials')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      setProgress({ filename: selectedFile.name, progress: 60, status: 'extracting' })
      const extractedText = await extractText(selectedFile)

      const { error: dbError } = await supabase
        .from('sabiquiz_materials')
        .insert({
          user_id: userId,
          filename: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          extracted_text: extractedText,
          category,
          level,
          status: 'ready',
        })

      if (dbError) throw dbError

      setProgress({ filename: selectedFile.name, progress: 100, status: 'complete' })
      
      setTimeout(() => {
        setSelectedFile(null)
        setCategory('')
        setLevel('')
        setProgress(null)
        
        // Call parent refresh function
        if (onUploadComplete) {
          onUploadComplete()
        }
      }, 1000)

    } catch (err: any) {
      console.error('Upload error:', err)
      setProgress({
        filename: selectedFile.name,
        progress: 0,
        status: 'error',
        error: err.message || 'Upload failed',
      })
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Upload Study Material</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all
            ${isDragging ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
            ${selectedFile ? 'bg-green-50 border-green-500' : ''}
          `}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            disabled={uploading}
          />
          
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            {selectedFile ? (
              <>
                <FileText className="w-10 h-10 text-green-600" />
                <div>
                  <p className="font-medium text-sm text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400" />
                <div>
                  <p className="font-medium text-sm text-gray-700">
                    Drop your file here, or <span className="text-red-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOCX, or TXT • Max 10MB
                  </p>
                </div>
              </>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={uploading}>
              <SelectTrigger id="category" className="h-9 text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat: string) => (
                  <SelectItem key={cat} value={cat} className="text-sm">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="level" className="text-sm">Level</Label>
            <Select value={level} onValueChange={setLevel} disabled={uploading}>
              <SelectTrigger id="level" className="h-9 text-sm">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((lv: string) => (
                  <SelectItem key={lv} value={lv} className="text-sm">
                    {lv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {progress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700 truncate max-w-[60%]">{progress.filename}</span>
              <span className="text-gray-500">
                {progress.status === 'uploading' && 'Uploading...'}
                {progress.status === 'extracting' && 'Extracting...'}
                {progress.status === 'complete' && 'Complete!'}
                {progress.status === 'error' && 'Error'}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progress.status === 'error' ? 'bg-red-500' : 'bg-red-600'
                }`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            {progress.error && (
              <p className="text-xs text-red-600">{progress.error}</p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !category || !level || uploading}
          className="w-full bg-red-600 hover:bg-red-700 text-white h-9 text-sm"
        >
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 mr-2" />
              Upload Material
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}