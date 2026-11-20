'use client'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CornerDownLeft, Search } from 'lucide-react'

export interface PaletteCommand {
  id: string
  label: string
  group: string
  icon: LucideIcon
  keywords?: string
  /** Called when the command is chosen. The palette closes itself first. */
  run: () => void
}

function matches(command: PaletteCommand, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const haystack = `${command.label} ${command.keywords ?? ''}`.toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/**
 * Jump to any page or action by typing a few letters. Opened with Ctrl+K
 * (Cmd+K on a Mac) or the search button in the top bar.
 */
export default function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean
  onClose: () => void
  commands: PaletteCommand[]
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const results = useMemo(() => commands.filter((command) => matches(command, query)), [commands, query])

  // Start clean every time it opens, and give the page back afterwards.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    setQuery('')
    setActive(0)
    inputRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const choose = (command: PaletteCommand | undefined) => {
    if (!command) return
    onClose()
    command.run()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive((index) => (results.length ? (index + 1) % results.length : 0))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive((index) => (results.length ? (index - 1 + results.length) % results.length : 0))
        break
      case 'Home':
        event.preventDefault()
        setActive(0)
        break
      case 'End':
        event.preventDefault()
        setActive(Math.max(results.length - 1, 0))
        break
      case 'Enter':
        event.preventDefault()
        choose(results[active])
        break
      case 'Escape':
        event.preventDefault()
        onClose()
        break
      case 'Tab':
        // The text box is the only stop, so focus stays inside the dialog.
        event.preventDefault()
        break
    }
  }

  let lastGroup = ''

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Search pages and actions">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} aria-hidden="true" />

      <div className="relative mx-auto mt-16 w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-24">
        <div className="flex items-center gap-3 border-b border-gray-200 px-4">
          <Search className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions"
            className="h-12 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
          >
            Esc
          </button>
        </div>

        <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-gray-500">
              Nothing matches &ldquo;{query}&rdquo;. Try a page name, like &ldquo;courses&rdquo;.
            </p>
          ) : (
            results.map((command, index) => {
              const Icon = command.icon
              const selected = index === active
              const heading = command.group !== lastGroup ? command.group : null
              lastGroup = command.group
              return (
                <div key={command.id}>
                  {heading && (
                    <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      {heading}
                    </p>
                  )}
                  <div
                    id={`${listId}-${command.id}`}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(command)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      selected ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className="flex-1 truncate">{command.label}</span>
                    {selected && <CornerDownLeft className="h-4 w-4 text-gray-400" aria-hidden="true" />}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
