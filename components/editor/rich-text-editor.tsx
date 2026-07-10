'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import CharacterCount from '@tiptap/extension-character-count'
import FontFamily from '@tiptap/extension-font-family'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DOMParser as ProseMirrorDOMParser, Slice } from '@tiptap/pm/model'
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
  AlignJustify,
  Image as ImageIcon,
  Link as LinkIcon,
  Code,
  Quote,
  Minus,
  Palette,
  Type,
  Highlighter,
  Table as TableIcon,
  TableCellsMerge,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Undo,
  Redo,
  ClipboardPaste
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { toast } from '@/components/ui/toast'

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

// FIXED: Working HTML Paste Handler with correct ProseMirror API
const CustomPaste = Extension.create({
  name: 'customPaste',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('customPaste'),
        props: {
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData
            if (!clipboardData) return false

            // Handle HTML content with proper ProseMirror API
            const htmlContent = clipboardData.getData('text/html')
            if (htmlContent) {
              // FIXED: Removed ALLOWED_STYLES - not supported in DOMPurify TypeScript
              const cleanHtml = DOMPurify.sanitize(htmlContent, {
                ALLOWED_TAGS: [
                  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'mark',
                  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li',
                  'a', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
                  'pre', 'code', 'span', 'div', 'sub', 'sup', 'hr'
                ],
                ALLOWED_ATTR: [
                  'href', 'src', 'alt', 'title', 'style', 'class', 'target', 'rel',
                  'width', 'height', 'colspan', 'rowspan', 'align', 'valign'
                ],
                KEEP_CONTENT: true,
                ADD_ATTR: ['target']
              })

              // Create DOM element from cleaned HTML
              const parser = new window.DOMParser()
              const doc = parser.parseFromString(cleanHtml, 'text/html')
              
              // FIXED: Use correct ProseMirror DOMParser API
              const proseMirrorParser = ProseMirrorDOMParser.fromSchema(view.state.schema)
              const pmDoc = proseMirrorParser.parse(doc.body)
              
              // FIXED: Create proper Slice from parsed content
              const slice = new Slice(pmDoc.content, 0, 0)
              
              // Insert the content at current selection
              const { tr } = view.state
              tr.replaceSelection(slice)
              view.dispatch(tr)
              
              return true
            }

            return false
          }
        }
      })
    ]
  }
})

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing your lesson content... (Paste formatted text from Word, Google Docs, or any webpage)',
  editable = true 
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [showFontSizePicker, setShowFontSizePicker] = useState(false)
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        // Exclude these from StarterKit since we add them separately
        underline: false,
      }),
      CustomPaste,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      FontSize,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CharacterCount.configure({
        limit: null,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline hover:text-blue-600',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      const chars = editor.storage.characterCount.characters()
      const words = editor.storage.characterCount.words()
      setCharCount(chars)
      setWordCount(words)
    },
  })

  // Image selection detection (clean, no console spam)
  const checkImageSelection = useCallback(() => {
    if (!editor) return
    
    const { state } = editor
    const { from } = state.selection
    const node = state.doc.nodeAt(from)
    
    // Check if we're directly on an image
    if (node && node.type.name === 'image') {
      setSelectedImage(true)
      return
    }
    
    // Check nearby for an image
    let foundImage = false
    state.doc.nodesBetween(Math.max(0, from - 1), Math.min(state.doc.content.size, from + 1), (n) => {
      if (n.type.name === 'image') {
        foundImage = true
        return false
      }
    })
    
    setSelectedImage(foundImage)
  }, [editor])

  useEffect(() => {
    if (!editor) return

    editor.on('selectionUpdate', checkImageSelection)
    editor.on('transaction', checkImageSelection)
    
    // Add click handler to images
    const handleEditorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        // Image was clicked, check selection on next tick
        setTimeout(checkImageSelection, 10)
      }
    }
    
    const editorElement = editor.view.dom
    editorElement.addEventListener('click', handleEditorClick)
    
    return () => {
      editor.off('selectionUpdate', checkImageSelection)
      editor.off('transaction', checkImageSelection)
      editorElement.removeEventListener('click', handleEditorClick)
    }
  }, [editor, checkImageSelection])

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file.')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB.')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `lesson-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath)

      if (editor) {
        editor.chain().focus().setImage({ src: publicUrl }).run()
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      toast.error(`Error uploading image: ${error.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const setLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setShowLinkDialog(false)
      setLinkUrl('')
    }
  }

  const handleSetFontSize = (size: string) => {
    if (editor) {
      (editor.chain().focus() as any).setFontSize(size).run()
      setShowFontSizePicker(false)
    }
  }

  const handleSetFontFamily = (font: string) => {
    if (editor) {
      editor.chain().focus().setFontFamily(font).run()
      setShowFontFamilyPicker(false)
    }
  }

  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
  }

  // ULTIMATE FIX: Direct DOM manipulation + force update
  const setImageSize = (size: 'small' | 'medium' | 'large' | 'full') => {
    if (!editor) return
    
    const sizeMap = {
      small: '25%',
      medium: '50%',
      large: '75%',
      full: '100%'
    }
    
    // Find the selected image in the DOM
    const selectedNode = editor.view.dom.querySelector('img.ProseMirror-selectednode')
    
    if (selectedNode) {
      const imgElement = selectedNode as HTMLImageElement
      
      // Preserve current alignment
      const currentStyle = imgElement.style.cssText
      const hasFloatLeft = currentStyle.includes('float: left')
      const hasFloatRight = currentStyle.includes('float: right')
      
      // Apply new width while preserving alignment
      imgElement.style.width = sizeMap[size]
      imgElement.style.height = 'auto'
      imgElement.style.borderRadius = '0.5rem'
      imgElement.style.cursor = 'pointer'
      
      if (hasFloatLeft) {
        imgElement.style.cssFloat = 'left'
        imgElement.style.marginRight = '1rem'
        imgElement.style.marginBottom = '0.5rem'
      } else if (hasFloatRight) {
        imgElement.style.cssFloat = 'right'
        imgElement.style.marginLeft = '1rem'
        imgElement.style.marginBottom = '0.5rem'
      } else {
        imgElement.style.display = 'block'
        imgElement.style.marginLeft = 'auto'
        imgElement.style.marginRight = 'auto'
        imgElement.style.marginBottom = '0.5rem'
      }
      
      // Force editor to acknowledge the change
      editor.commands.focus()
    }
  }

  const setImageAlignment = (align: 'left' | 'center' | 'right') => {
    if (!editor) return
    
    // Find the selected image in the DOM
    const selectedNode = editor.view.dom.querySelector('img.ProseMirror-selectednode')
    
    if (selectedNode) {
      const imgElement = selectedNode as HTMLImageElement
      
      // Preserve current width
      const currentWidth = imgElement.style.width || '50%'
      
      // Clear all float/margin styles
      imgElement.style.cssFloat = 'none'
      imgElement.style.marginLeft = '0'
      imgElement.style.marginRight = '0'
      imgElement.style.display = ''
      
      // Apply new alignment
      imgElement.style.width = currentWidth
      imgElement.style.height = 'auto'
      imgElement.style.borderRadius = '0.5rem'
      imgElement.style.cursor = 'pointer'
      imgElement.style.marginBottom = '0.5rem'
      
      if (align === 'left') {
        imgElement.style.cssFloat = 'left'
        imgElement.style.marginRight = '1rem'
      } else if (align === 'center') {
        imgElement.style.display = 'block'
        imgElement.style.marginLeft = 'auto'
        imgElement.style.marginRight = 'auto'
      } else if (align === 'right') {
        imgElement.style.cssFloat = 'right'
        imgElement.style.marginLeft = '1rem'
      }
      
      // Force editor to acknowledge the change
      editor.commands.focus()
    }
  }

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', 
    '#FFC0CB', '#A52A2A', '#808080', '#008000', '#000080',
    '#FFF700', '#FF1493', '#00CED1', '#FFD700', '#8B008B'
  ]

  const backgroundColors = [
    '#FFFF00', '#00FF00', '#00FFFF', '#FFC0CB', '#FFE4B5',
    '#E6E6FA', '#FFB6C1', '#98FB98', '#F0E68C', '#87CEEB',
    '#DDA0DD', '#F5DEB3', '#FFDAB9', '#B0E0E6', '#D3D3D3'
  ]

  const fontSizes = [
    { label: 'Tiny', value: '10px' },
    { label: 'Small', value: '12px' },
    { label: 'Normal', value: '16px' },
    { label: 'Medium', value: '20px' },
    { label: 'Large', value: '24px' },
    { label: 'Extra Large', value: '32px' },
    { label: 'Huge', value: '48px' },
    { label: 'Massive', value: '64px' }
  ]

  const fontFamilies = [
    { label: 'Default', value: 'inherit' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: '"Courier New", monospace' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Comic Sans', value: '"Comic Sans MS", cursive' },
    { label: 'Impact', value: 'Impact, sans-serif' },
    { label: 'Trebuchet', value: '"Trebuchet MS", sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' }
  ]

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {editable && (
        <div className="border-b bg-gray-50 p-2">
          {/* First Row - Text Formatting */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="p-2"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="p-2"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Font Family Picker */}
            <div className="relative">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowFontFamilyPicker(!showFontFamilyPicker)}
                className="px-3"
                title="Font Family"
              >
                <span className="text-xs font-medium">Font</span>
              </Button>
              {showFontFamilyPicker && (
                <div className="absolute top-10 left-0 z-20 bg-white border rounded-lg p-2 shadow-lg min-w-[180px] max-h-[300px] overflow-y-auto">
                  {fontFamilies.map((font) => (
                    <button
                      key={font.value}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                      style={{ fontFamily: font.value }}
                      onClick={() => handleSetFontFamily(font.value)}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Picker */}
            <div className="relative">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowFontSizePicker(!showFontSizePicker)}
                className="p-2"
                title="Font Size"
              >
                <Type className="h-4 w-4" />
              </Button>
              {showFontSizePicker && (
                <div className="absolute top-10 left-0 z-20 bg-white border rounded-lg p-2 shadow-lg min-w-[140px]">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                      onClick={() => handleSetFontSize(size.value)}
                    >
                      {size.label} ({size.value})
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Basic Formatting */}
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="p-2"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="p-2"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editor.isActive('underline') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className="p-2"
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Color Pickers */}
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
                <div className="absolute top-10 left-0 z-20 bg-white border rounded-lg p-2 shadow-lg">
                  <div className="grid grid-cols-5 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          editor.chain().focus().setColor(color).run()
                          setShowColorPicker(false)
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                className="p-2"
                title="Highlight Color"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
              {showBgColorPicker && (
                <div className="absolute top-10 left-0 z-20 bg-white border rounded-lg p-2 shadow-lg">
                  <div className="grid grid-cols-5 gap-1">
                    <button
                      type="button"
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform bg-white flex items-center justify-center text-xs"
                      onClick={() => {
                        editor.chain().focus().unsetHighlight().run()
                        setShowBgColorPicker(false)
                      }}
                      title="Remove highlight"
                    >
                      ✕
                    </button>
                    {backgroundColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          editor.chain().focus().toggleHighlight({ color }).run()
                          setShowBgColorPicker(false)
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Second Row - Lists, Alignment, Blocks */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
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
            <Button
              type="button"
              size="sm"
              variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className="p-2"
              title="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

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
                <div className="absolute top-10 left-0 z-20 bg-white border rounded-lg p-3 shadow-lg">
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-56"
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

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Table */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={insertTable}
              className="p-2"
              title="Insert Table (3x3)"
            >
              <TableIcon className="h-4 w-4" />
            </Button>

            {editor.isActive('table') && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="p-2"
                  title="Add Column"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="p-2"
                  title="Add Row"
                >
                  <TableCellsMerge className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="p-2 text-red-500 hover:bg-red-50"
                  title="Delete Table"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Preview Toggle */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 ml-auto"
              title={showPreview ? "Hide Preview" : "Show Preview"}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {/* Third Row - Image Controls (Only when image selected) */}
          {selectedImage && (
            <div className="flex items-center gap-2 pt-2 border-t bg-blue-50 px-2 py-2">
              <span className="text-xs font-bold text-blue-700">📸 IMAGE SELECTED</span>
              <div className="w-px h-4 bg-blue-300 mx-1" />
              <span className="text-xs text-gray-600">Size:</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageSize('small')}
                className="text-xs px-3 py-1 h-7 hover:bg-blue-100 border-blue-300"
              >
                25%
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageSize('medium')}
                className="text-xs px-3 py-1 h-7 hover:bg-blue-100 border-blue-300"
              >
                50%
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageSize('large')}
                className="text-xs px-3 py-1 h-7 hover:bg-blue-100 border-blue-300"
              >
                75%
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageSize('full')}
                className="text-xs px-3 py-1 h-7 hover:bg-blue-100 border-blue-300"
              >
                100%
              </Button>
              <div className="w-px h-4 bg-blue-300 mx-2" />
              <span className="text-xs text-gray-600">Align:</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageAlignment('left')}
                className="text-xs px-3 py-1 h-7 hover:bg-blue-100 border-blue-300"
              >
                ← Left
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageAlignment('center')}
                className="text-xs px-3 py-1 h-7 hover:bg-blue-100 border-blue-300"
              >
                Center
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImageAlignment('right')}
                className="text-xs px-3 py-1 h-7 hover:bg-blue-100 border-blue-300"
              >
                Right →
              </Button>
            </div>
          )}

          {/* Status Bar */}
          <div className="flex justify-between items-center pt-2 mt-2 border-t text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="font-medium">Words: {wordCount}</span>
              <span className="font-medium">Characters: {charCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardPaste className="h-3 w-3" />
              <span>HTML paste enabled - Paste from Word, Google Docs, or webpages</span>
            </div>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className={showPreview ? 'grid grid-cols-2 divide-x' : ''}>
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none 
            [&_.ProseMirror]:min-h-[380px] 
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror_img]:cursor-pointer
            [&_.ProseMirror_img]:transition-all
            [&_.ProseMirror_img]:duration-200
            [&_.ProseMirror_img.ProseMirror-selectednode]:ring-2
            [&_.ProseMirror_img.ProseMirror-selectednode]:ring-blue-500
            [&_.ProseMirror_img.ProseMirror-selectednode]:ring-offset-2"
        />
        
        {showPreview && (
          <div className="p-4 bg-gray-50 min-h-[400px] overflow-auto">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Live Preview:</h3>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}
      </div>
    </div>
  )
}