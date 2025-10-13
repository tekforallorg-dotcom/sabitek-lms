'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Upload, X, File } from 'lucide-react'

interface FileUploaderProps {
  label: string
  accept: string
  folder: string
  currentUrl?: string
  onUpload: (url: string) => void
}

export default function FileUploader({
  label,
  accept,
  folder,
  currentUrl,
  onUpload
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState(currentUrl || '')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      console.log('🎯 Upload started')
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        console.log('❌ No file selected')
        throw new Error('You must select a file to upload.')
      }

      const file = event.target.files[0]
      console.log('📁 File selected:', file.name, file.type, file.size)
      setFileName(file.name)

      if (file.size > 50 * 1024 * 1024) {
        console.log('❌ File too large')
        throw new Error('File size must be less than 50MB.')
      }

      const fileExt = file.name.split('.').pop()
      const uniqueFileName = `${Math.random()}.${fileExt}`
      const filePath = `${folder}/${uniqueFileName}`
      
      console.log('📤 Uploading to:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file)

      console.log('📥 Upload response, error:', uploadError)

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        throw uploadError
      }

      console.log('🔗 Getting public URL...')
      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath)

      console.log('✅ Public URL:', publicUrl)

      setFileUrl(publicUrl)
      onUpload(publicUrl)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      console.log('✅ Upload complete!')
    } catch (error: any) {
      console.error('💥 Upload error:', error)
      alert(`Error uploading file: ${error.message}`)
    } finally {
      console.log('🏁 Setting uploading to false')
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFileUrl('')
    setFileName('')
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id={`file-upload-${folder}`}
      />
      
      {!fileUrl ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-dashed border-2 h-24 flex flex-col gap-2"
        >
          <Upload className="h-6 w-6" />
          <span>{uploading ? 'Uploading...' : label}</span>
        </Button>
      ) : (
        <div className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium">{fileName || 'Uploaded file'}</p>
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View file
              </a>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeFile}
            className="text-red-500 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}