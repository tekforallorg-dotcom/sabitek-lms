'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Minus,
  Palette
} from 'lucide-react'
import { useState, useRef } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing your lesson content...',
  editable = true 
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto cursor-pointer',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline hover:text-blue-600',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        width: 640,
        height: 360,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file.')
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB.')
      }

      // Create a unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `lesson-images/${fileName}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath)

      // Insert image into editor
      if (editor) {
        editor.chain().focus().setImage({ src: publicUrl }).run()
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const addYoutubeVideo = () => {
    const url = window.prompt('Enter YouTube URL:')
    if (url && editor) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 360,
      })
    }
  }

  const setLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setShowLinkDialog(false)
      setLinkUrl('')
    }
  }

  const setImageSize = (size: 'small' | 'medium' | 'large' | 'full') => {
    if (!editor) return
    
    const { state } = editor
    const { from } = state.selection
    const node = state.doc.nodeAt(from)
    
    if (node?.type.name === 'image') {
      const sizeMap = {
        small: '25%',
        medium: '50%',
        large: '75%',
        full: '100%'
      }
      
      editor.commands.updateAttributes('image', {
        style: `width: ${sizeMap[size]}; height: auto;`
      })
    }
  }

  const setImageAlignment = (align: 'left' | 'center' | 'right') => {
    if (!editor) return
    
    const { state } = editor
    const { from } = state.selection
    const node = state.doc.nodeAt(from)
    
    if (node?.type.name === 'image') {
      const alignMap = {
        left: 'float: left; margin-right: 1rem;',
        center: 'display: block; margin-left: auto; margin-right: auto;',
        right: 'float: right; margin-left: 1rem;'
      }
      
      editor.commands.updateAttributes('image', {
        style: alignMap[align]
      })
    }
  }

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#808080'
  ]

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {editable && (
        <div className="border-b bg-gray-50 p-2">
          {/* Text Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {/* Headings */}
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="p-2"
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="p-2"
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className="p-2"
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Basic Formatting */}
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="p-2"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="p-2"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('underline') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className="p-2"
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Lists */}
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('bulletList') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="p-2"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('orderedList') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="p-2"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Alignment */}
            <Button
              type="button"
              size="sm"
              variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className="p-2"
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className="p-2"
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className="p-2"
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Second Row - Media and Colors */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {/* Block Elements */}
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('blockquote') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="p-2"
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className="p-2"
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-2"
              title="Horizontal Line"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Color Picker */}
            <div className="relative">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2"
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </Button>
              {showColorPicker && (
                <div className="absolute top-10 left-0 z-10 bg-white border rounded-lg p-2 shadow-lg">
                  <div className="grid grid-cols-4 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          editor.chain().focus().setColor(color).run()
                          setShowColorPicker(false)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Image Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={uploadImage}
                disabled={uploadingImage}
                className="hidden"
                id="image-upload-input"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="p-2"
                title="Upload Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            
            {/* YouTube Video */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addYoutubeVideo}
              className="p-2"
              title="Embed YouTube Video"
            >
              <YoutubeIcon className="h-4 w-4" />
            </Button>
            
            {/* Link */}
            <div className="relative">
              <Button
                type="button"
                size="sm"
                variant={editor.isActive('link') ? 'default' : 'outline'}
                onClick={() => setShowLinkDialog(!showLinkDialog)}
                className="p-2"
                title="Add Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              {showLinkDialog && (
                <div className="absolute top-10 left-0 z-10 bg-white border rounded-lg p-3 shadow-lg">
                  <input
                    type="text"
                    placeholder="Enter URL"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-48"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setLink()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={setLink}
                    className="ml-2"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Third Row - Image Controls (only show when image is selected) */}
          {editor.isActive('image') && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs text-gray-600">Image:</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageSize('small')}
                className="text-xs px-2 py-1"
              >
                Small
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageSize('medium')}
                className="text-xs px-2 py-1"
              >
                Medium
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageSize('large')}
                className="text-xs px-2 py-1"
              >
                Large
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageSize('full')}
                className="text-xs px-2 py-1"
              >
                Full Width
              </Button>
              <div className="w-px h-4 bg-gray-300 mx-2" />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageAlignment('left')}
                className="text-xs px-2 py-1"
              >
                ← Left
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageAlignment('center')}
                className="text-xs px-2 py-1"
              >
                Center
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageAlignment('right')}
                className="text-xs px-2 py-1"
              >
                Right →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none"
      />
    </div>
  )
}