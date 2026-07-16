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
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state'
import { DOMParser as ProseMirrorDOMParser, Slice } from '@tiptap/pm/model'
import { Callout, Columns, Column, CtaButton } from './lesson-blocks'
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
  ClipboardPaste,
  Heading1,
  Heading2,
  Heading3,
  Lightbulb,
  AlertTriangle,
  FlaskConical,
  Info,
  Key,
  Columns2,
  MousePointerClick,
  History
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { toast } from '@/components/ui/toast'
import { uploadLessonImage } from '@/lib/lesson-images'
import '@/styles/lesson-content.css'

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


/**
 * Image with PERSISTENT alignment/width. The previous controls mutated the
 * live DOM only, so styling silently vanished on save; these are real
 * document attributes serialized into the lesson HTML and rendered by the
 * shared lesson-content stylesheet on the learner side.
 */
const LessonImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: (element: HTMLElement) => {
          const cls = element.getAttribute('class') || ''
          const m = cls.match(/img-(left|center|right|full)/)
          if (m) return m[1]
          const style = element.getAttribute('style') || ''
          if (style.includes('float: left')) return 'left'
          if (style.includes('float: right')) return 'right'
          return 'center'
        },
        renderHTML: (attributes: { align?: string }) => ({
          class: `img-${attributes.align || 'center'}`,
        }),
      },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const style = element.getAttribute('style') || ''
          const m = style.match(/width:\s*([\d.]+%)/)
          return m ? m[1] : null
        },
        renderHTML: (attributes: { width?: string | null }) =>
          attributes.width ? { style: `width: ${attributes.width}` } : {},
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
  /** When set, drafts are debounced to localStorage under this key and can be restored on reload. */
  autosaveKey?: string
}

// Human-friendly "x minutes ago" for the draft-restore bar.
function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

interface SlashMenuState {
  open: boolean
  query: string
  from: number
  index: number
  left: number
  top: number
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing your lesson content... (Paste formatted text from Word, Google Docs, or any webpage)',
  editable = true,
  autosaveKey
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
  const [imageCaption, setImageCaption] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  // CTA button selection (mirrors the image control-strip pattern).
  const [selectedCta, setSelectedCta] = useState(false)
  const [ctaText, setCtaText] = useState('')
  const [ctaHref, setCtaHref] = useState('')
  // Hand-rolled slash menu (no @tiptap/suggestion / tippy dependency).
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>({
    open: false, query: '', from: 0, index: 0, left: 0, top: 0,
  })
  // localStorage draft-restore bar (Phase 4a).
  const [draftBar, setDraftBar] = useState<{ html: string; ts: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  // Bridge so editorProps (created before insertImageFile) can call it.
  const insertImageFileRef = useRef<((file: File) => Promise<void>) | null>(null)
  // Bridges so the editorProps.handleKeyDown closure (created once) can read
  // live slash-menu state and invoke handlers defined later in the component.
  const slashRef = useRef<{ open: boolean; index: number; count: number }>({ open: false, index: 0, count: 0 })
  const slashNavRef = useRef<((dir: 1 | -1) => void) | null>(null)
  const slashExecRef = useRef<(() => void) | null>(null)
  const slashCloseRef = useRef<(() => void) | null>(null)
  // Autosave debounce + a ref so the once-created onUpdate reads the live key.
  const autosaveKeyRef = useRef<string | undefined>(autosaveKey)
  autosaveKeyRef.current = autosaveKey
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      LessonImage.configure({
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
      // Phase 3 — Notion-style blocks.
      Callout,
      Columns,
      Column,
      CtaButton,
      Placeholder.configure({
        placeholder,
      }),
    ],
    editorProps: {
      attributes: {
        // Same stylesheet as the learner reader = true WYSIWYG.
        class: 'lesson-content',
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files || []).filter((f) =>
          f.type.startsWith('image/')
        )
        if (files.length === 0) return false
        event.preventDefault()
        files.forEach((f) => void insertImageFileRef.current?.(f))
        return true
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter((f) =>
          f.type.startsWith('image/')
        )
        if (files.length === 0) return false // let the HTML paste handler run
        event.preventDefault()
        files.forEach((f) => void insertImageFileRef.current?.(f))
        return true
      },
      // Slash-menu keyboard driving. When the menu is open we swallow the
      // navigation keys so ProseMirror never sees them.
      handleKeyDown: (_view, event) => {
        if (!slashRef.current.open) return false
        if (event.key === 'ArrowDown') {
          slashNavRef.current?.(1)
          return true
        }
        if (event.key === 'ArrowUp') {
          slashNavRef.current?.(-1)
          return true
        }
        if (event.key === 'Enter') {
          slashExecRef.current?.()
          return true
        }
        if (event.key === 'Escape') {
          slashCloseRef.current?.()
          return true
        }
        return false
      },
      // The CTA atom renders an <a>; select it instead of following the link.
      handleClickOn: (view, _pos, node, nodePos) => {
        if (node.type.name === 'ctaButton') {
          const tr = view.state.tr.setSelection(
            NodeSelection.create(view.state.doc, nodePos)
          )
          view.dispatch(tr)
          return true
        }
        return false
      },
    },
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      const chars = editor.storage.characterCount.characters()
      const words = editor.storage.characterCount.words()
      setCharCount(chars)
      setWordCount(words)

      // Phase 4a autosave: debounce a draft snapshot to localStorage.
      const key = autosaveKeyRef.current
      if (key && typeof window !== 'undefined') {
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
        autosaveTimer.current = setTimeout(() => {
          try {
            localStorage.setItem(
              key,
              JSON.stringify({ html: editor.getHTML(), ts: Date.now() })
            )
          } catch {
            /* storage full / disabled — non-fatal */
          }
        }, 1000)
      }
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
      const attrs = editor?.getAttributes('image') || {}
      setImageCaption(attrs.title || '')
      setImageAlt(attrs.alt || '')
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

  // CTA button selection detection (mirrors the image control strip): a
  // NodeSelection on a ctaButton opens the edit strip under the toolbar.
  const checkCtaSelection = useCallback(() => {
    if (!editor) return
    const node = (editor.state.selection as any).node
    if (node && node.type?.name === 'ctaButton') {
      setSelectedCta(true)
      setCtaText(node.attrs.text || '')
      setCtaHref(node.attrs.href || '')
    } else {
      setSelectedCta(false)
    }
  }, [editor])

  // Slash-menu open/close/filter detection. Runs on every selection/content
  // change: opens when the caret sits after "/word" in an otherwise-empty
  // paragraph, and remembers the "/" position so the query can be deleted.
  const updateSlashMenu = useCallback(() => {
    if (!editor) return
    const { selection } = editor.state
    if (!selection.empty || (selection as any).node) {
      setSlashMenu((p) => (p.open ? { ...p, open: false } : p))
      return
    }
    const { $from } = selection
    if ($from.parent.type.name !== 'paragraph') {
      setSlashMenu((p) => (p.open ? { ...p, open: false } : p))
      return
    }
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n', '￼')
    const textAfter = $from.parent.textBetween(
      $from.parentOffset,
      $from.parent.content.size,
      '\n',
      '￼'
    )
    const match = /^\s*\/(\w*)$/.exec(textBefore)
    if (match && textAfter.trim() === '') {
      const query = match[1]
      const from = $from.pos - query.length - 1
      const coords = editor.view.coordsAtPos($from.pos)
      setSlashMenu({
        open: true,
        query,
        from,
        index: 0,
        left: coords.left,
        top: coords.bottom + 6,
      })
    } else {
      setSlashMenu((p) => (p.open ? { ...p, open: false } : p))
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const onSelect = () => {
      checkImageSelection()
      checkCtaSelection()
      updateSlashMenu()
    }
    editor.on('selectionUpdate', onSelect)
    editor.on('transaction', onSelect)
    // Close the slash menu when focus leaves the editor.
    const onBlur = () => setSlashMenu((p) => (p.open ? { ...p, open: false } : p))
    editor.on('blur', onBlur)

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
      editor.off('selectionUpdate', onSelect)
      editor.off('transaction', onSelect)
      editor.off('blur', onBlur)
      editorElement.removeEventListener('click', handleEditorClick)
    }
  }, [editor, checkImageSelection, checkCtaSelection, updateSlashMenu])

  // Draft-restore bar: once the editor is ready, surface a recent (<7d) draft
  // that differs from the loaded content.
  useEffect(() => {
    if (!editor || !autosaveKey || typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(autosaveKey)
      if (!raw) return
      const saved = JSON.parse(raw)
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
      if (
        saved &&
        typeof saved.html === 'string' &&
        typeof saved.ts === 'number' &&
        Date.now() - saved.ts < SEVEN_DAYS &&
        saved.html !== editor.getHTML()
      ) {
        setDraftBar({ html: saved.html, ts: saved.ts })
      }
    } catch {
      /* corrupt draft — ignore */
    }
    // Intentionally run once when the editor becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  // Insert an image file: compress -> upload to storage -> insert node.
  // Shared by the toolbar button, drag-drop, and clipboard paste.
  const insertImageFile = async (file: File) => {
    try {
      setUploadingImage(true)
      const publicUrl = await uploadLessonImage(file)
      if (editor) {
        editor.chain().focus().setImage({ src: publicUrl }).run()
      }
      toast.success('Image added')
    } catch (error: any) {
      toast.error(error.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  insertImageFileRef.current = insertImageFile

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) await insertImageFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
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

  // Apply the CTA control-strip inputs back onto the selected ctaButton node.
  const applyCta = () => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .updateAttributes('ctaButton', {
        text: ctaText.trim() || 'Open link',
        href: ctaHref.trim() || '#',
      })
      .run()
  }

  // ── Slash menu (Phase 3) ──────────────────────────────────────────────
  type SlashItem = {
    label: string
    description: string
    Icon: typeof Bold
    run: () => void
  }

  const chain = () => (editor!.chain().focus() as any)

  const slashItems: SlashItem[] = editor
    ? [
        { label: 'Heading 1', description: 'Section title', Icon: Heading1, run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
        { label: 'Heading 2', description: 'Sub-section title', Icon: Heading2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { label: 'Heading 3', description: 'Minor heading', Icon: Heading3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { label: 'Key point', description: 'Green callout card', Icon: Key, run: () => chain().insertCallout('key').run() },
        { label: 'Tip', description: 'Helpful aside callout', Icon: Lightbulb, run: () => chain().insertCallout('tip').run() },
        { label: 'Warning', description: 'Caution callout', Icon: AlertTriangle, run: () => chain().insertCallout('warning').run() },
        { label: 'Example', description: 'Worked example callout', Icon: FlaskConical, run: () => chain().insertCallout('example').run() },
        { label: 'Info', description: 'Informational callout', Icon: Info, run: () => chain().insertCallout('info').run() },
        { label: 'Two columns', description: 'Side-by-side layout', Icon: Columns2, run: () => chain().insertColumns().run() },
        { label: 'Button', description: 'Call-to-action link', Icon: MousePointerClick, run: () => chain().insertCtaButton().run() },
        { label: 'Image', description: 'Upload an illustration', Icon: ImageIcon, run: () => fileInputRef.current?.click() },
        { label: 'Divider', description: 'Horizontal rule', Icon: Minus, run: () => editor.chain().focus().setHorizontalRule().run() },
        { label: 'Quote', description: 'Blockquote', Icon: Quote, run: () => editor.chain().focus().toggleBlockquote().run() },
        { label: 'Table', description: 'Insert a 3×3 table', Icon: TableIcon, run: () => insertTable() },
      ]
    : []

  const filteredSlashItems = slashMenu.query
    ? slashItems.filter((i) =>
        i.label.toLowerCase().includes(slashMenu.query.toLowerCase())
      )
    : slashItems

  // Mirror live slash state into refs so the once-created editorProps
  // handleKeyDown closure can read them without stale captures.
  const filteredItemsRef = useRef<SlashItem[]>([])
  filteredItemsRef.current = filteredSlashItems
  slashRef.current.open = slashMenu.open
  slashRef.current.index = slashMenu.index
  slashRef.current.count = filteredSlashItems.length

  const closeSlash = () =>
    setSlashMenu((p) => (p.open ? { ...p, open: false } : p))

  const executeSlashItem = (item: SlashItem) => {
    if (!editor) return
    const to = editor.state.selection.from
    editor.chain().focus().deleteRange({ from: slashMenu.from, to }).run()
    item.run()
    closeSlash()
  }

  slashCloseRef.current = closeSlash
  slashNavRef.current = (dir) => {
    const n = filteredItemsRef.current.length
    if (n === 0) return
    setSlashMenu((p) => ({ ...p, index: (p.index + dir + n) % n }))
  }
  slashExecRef.current = () => {
    const item = filteredItemsRef.current[slashRef.current.index]
    if (item) executeSlashItem(item)
  }

  // ── Draft restore (Phase 4a) ──────────────────────────────────────────
  const restoreDraft = () => {
    if (!editor || !draftBar) return
    // emitUpdate=true so the parent form's onChange picks up the restored HTML.
    editor.commands.setContent(draftBar.html, { emitUpdate: true })
    toast.success('Draft restored')
    setDraftBar(null)
  }

  const discardDraft = () => {
    if (autosaveKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(autosaveKey)
      } catch {
        /* ignore */
      }
    }
    setDraftBar(null)
  }

  // ULTIMATE FIX: Direct DOM manipulation + force update
  // Persistent image controls: write real node attributes (serialized into
  // the saved HTML) instead of mutating the rendered DOM.
  const setImageSize = (size: 'small' | 'medium' | 'large' | 'full') => {
    if (!editor) return
    const sizeMap = { small: '25%', medium: '50%', large: '75%', full: '100%' }
    editor.chain().focus().updateAttributes('image', { width: sizeMap[size] }).run()
  }

  const setImageAlignment = (align: 'left' | 'center' | 'right' | 'full') => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .updateAttributes('image', { align, ...(align === 'full' ? { width: '100%' } : {}) })
      .run()
  }

  const setImageMeta = (caption: string, alt: string) => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .updateAttributes('image', { title: caption.trim() || null, alt: alt.trim() || null })
      .run()
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
      {/* Draft-restore bar (Phase 4a) */}
      {editable && draftBar && (
        <div className="bg-amber-50/80 border border-amber-100 rounded-xl px-3 py-2 text-xs flex items-center gap-2 m-2">
          <History className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="text-gray-600">
            Unsaved draft from {relativeTime(draftBar.ts)} found
          </span>
          <button
            type="button"
            onClick={restoreDraft}
            className="font-semibold text-red-600 cursor-pointer hover:text-red-700 ml-auto"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={discardDraft}
            className="text-gray-500 cursor-pointer hover:text-gray-700"
          >
            Discard
          </button>
        </div>
      )}
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

          {/* Image controls (persistent attributes; only when image selected) */}
          {selectedImage && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-100 bg-rose-50/60 px-2 py-2 rounded-b-lg">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Image</span>
              <div className="w-px h-4 bg-rose-200 mx-1" />
              <span className="text-xs text-gray-500">Size:</span>
              {([['small', '25%'], ['medium', '50%'], ['large', '75%'], ['full', '100%']] as const).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setImageSize(key)}
                  className="text-xs px-2.5 py-1 h-7 bg-white/70 border-rose-100 hover:border-rose-200 hover:bg-white hover:text-red-600 rounded-full"
                >
                  {label}
                </Button>
              ))}
              <div className="w-px h-4 bg-rose-200 mx-1" />
              <span className="text-xs text-gray-500">Align:</span>
              {([['left', 'Left'], ['center', 'Center'], ['right', 'Right'], ['full', 'Full-bleed']] as const).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setImageAlignment(key)}
                  className="text-xs px-2.5 py-1 h-7 bg-white/70 border-rose-100 hover:border-rose-200 hover:bg-white hover:text-red-600 rounded-full"
                >
                  {label}
                </Button>
              ))}
              <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 sm:ml-1">
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Caption (shown under image)"
                  className="h-7 px-2.5 text-xs rounded-full bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none w-52"
                />
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Alt text (accessibility)"
                  className="h-7 px-2.5 text-xs rounded-full bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none w-44"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setImageMeta(imageCaption, imageAlt)}
                  className="text-xs px-3 py-1 h-7 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full"
                >
                  Apply
                </Button>
              </div>
            </div>
          )}

          {/* CTA button controls (mirrors the image strip; only when a CTA node is selected) */}
          {selectedCta && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-100 bg-rose-50/60 px-2 py-2 rounded-b-lg">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Button</span>
              <div className="w-px h-4 bg-rose-200 mx-1" />
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Button text"
                className="h-7 px-2.5 text-xs rounded-full bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none w-40"
              />
              <input
                type="text"
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder="Link URL (https://…)"
                className="h-7 px-2.5 text-xs rounded-full bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none w-52"
              />
              <Button
                type="button"
                size="sm"
                onClick={applyCta}
                className="text-xs px-3 py-1 h-7 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full"
              >
                Apply
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
          className="p-4 sm:p-6 min-h-[400px] focus:outline-none"
        />
        
        {showPreview && (
          <div className="p-4 bg-gray-50 min-h-[400px] overflow-auto">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Live Preview:</h3>
            <div className="lesson-content" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}
      </div>

      {/* Slash command menu (hand-rolled, no @tiptap/suggestion / tippy) */}
      {editable && slashMenu.open && filteredSlashItems.length > 0 && (
        <div
          className="fixed bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 border border-white shadow-[0_20px_45px_-20px_rgba(225,29,72,0.4)] py-1.5 w-64 z-50 max-h-72 overflow-y-auto"
          style={{ left: slashMenu.left, top: slashMenu.top }}
        >
          {filteredSlashItems.map((item, i) => {
            const Icon = item.Icon
            return (
              <button
                key={item.label}
                type="button"
                // Keep the editor focused so the caret/range stays intact.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeSlashItem(item)}
                onMouseEnter={() => setSlashMenu((p) => ({ ...p, index: i }))}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors ${
                  i === slashMenu.index ? 'bg-rose-50/70' : 'hover:bg-rose-50/40'
                }`}
              >
                <span className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-red-500" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800 truncate">
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-gray-400 truncate">
                    {item.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}