'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, Search, Sparkles, X } from 'lucide-react'
import NotificationBell from '@/components/layout/NotificationBell'
import CommandPalette, { type PaletteCommand } from '@/components/shell/CommandPalette'
import {
  ACCOUNT_ITEMS,
  HOME_ROUTE,
  commandsFor,
  isActive,
  navFor,
  type NavGroup,
  type Persona,
} from '@/lib/navigation'

export interface ShellUser {
  name: string
  email: string
  avatarUrl?: string | null
  /** "Learner", "Instructor", or the institution's name. */
  roleLabel?: string | null
}

function Wordmark({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-1" aria-label="Sabitek home">
      <span className="text-xl font-medium tracking-tight text-gray-900">Sabitek</span>
      <Sparkles className="mb-2 h-4 w-4 text-red-600" aria-hidden="true" />
    </Link>
  )
}

function Avatar({ user, size }: { user: ShellUser; size: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt="" className={`${box} flex-shrink-0 rounded-full object-cover`} />
  }
  return (
    <span
      className={`${box} flex flex-shrink-0 items-center justify-center rounded-full bg-gray-900 font-medium text-white`}
      aria-hidden="true"
    >
      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
    </span>
  )
}

function NavList({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[]
  pathname: string | null
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((group, index) => (
        <div key={group.heading ?? index}>
          {group.heading && (
            <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">{group.heading}</p>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item, pathname)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-gray-100 font-medium text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function AccountMenu({ user, onSignOut }: { user: ShellUser; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center rounded-full p-1 transition-colors hover:bg-gray-100"
      >
        <Avatar user={user} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-gray-200 p-4">
            <Avatar user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user.name || 'Your account'}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="p-2">
            {ACCOUNT_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon className="h-4 w-4 text-gray-400" />
                  {item.label}
                </Link>
              )
            })}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 text-gray-400" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * The frame around every signed-in page: grouped navigation in a sidebar
 * (a drawer on phones), one top bar, and the command palette.
 *
 * It takes everything it shows as props and fetches nothing, so it can be
 * drawn with sample data. components/layout/ConditionalLayout.tsx feeds it
 * the real account.
 */
export default function AppShell({
  persona,
  user,
  pathname,
  onSignOut,
  navReady = true,
  children,
}: {
  persona: Persona
  user: ShellUser
  pathname: string | null
  onSignOut: () => void
  /** False while the account's role is still being worked out. */
  navReady?: boolean
  children: React.ReactNode
}) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcut, setShortcut] = useState('Ctrl K')

  const groups = useMemo(() => (navReady ? navFor(persona) : []), [persona, navReady])
  const home = HOME_ROUTE[persona]

  const commands = useMemo<PaletteCommand[]>(() => {
    if (!navReady) return []
    const pages = commandsFor(persona).map((command) => ({
      id: `${command.group}:${command.href}`,
      label: command.label,
      group: command.group,
      icon: command.icon,
      keywords: command.keywords,
      run: () => router.push(command.href),
    }))
    return [
      ...pages,
      { id: 'sign-out', label: 'Sign out', group: 'Account', icon: LogOut, keywords: 'log out logout', run: onSignOut },
    ]
  }, [persona, navReady, router, onSignOut])

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setShortcut('⌘K')
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Moving to another page closes the drawer.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen])

  const closePalette = useCallback(() => setPaletteOpen(false), [])

  const roleLine = user.roleLabel ? (
    <p className="truncate px-6 pb-4 text-xs capitalize text-gray-500">{user.roleLabel}</p>
  ) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* Sidebar, large screens */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-14 flex-shrink-0 items-center px-6">
          <Wordmark href={home} />
        </div>
        {roleLine}
        <NavList groups={groups} pathname={pathname} />
      </aside>

      {/* Drawer, small screens */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="relative flex h-full w-72 max-w-[85%] flex-col border-r border-gray-200 bg-white">
            <div className="flex h-14 flex-shrink-0 items-center justify-between pl-6 pr-3">
              <Wordmark href={home} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                autoFocus
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {roleLine}
            <NavList groups={groups} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-gray-200 bg-white px-3 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Wordmark href={home} />
          </div>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search pages and actions"
            aria-keyshortcuts="Control+K Meta+K"
            className="ml-auto flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:ml-0 sm:w-80 sm:border sm:border-gray-200 sm:bg-gray-50 sm:px-3 sm:hover:border-gray-300 sm:hover:bg-white"
          >
            <Search className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="hidden flex-1 text-left sm:inline">Search pages and actions</span>
            <kbd className="hidden rounded-md border border-gray-200 bg-white px-2 py-1 font-sans text-xs text-gray-500 sm:inline">
              {shortcut}
            </kbd>
          </button>

          <div className="flex items-center gap-1 sm:ml-auto">
            <NotificationBell />
            <AccountMenu user={user} onSignOut={onSignOut} />
          </div>
        </header>

        <main id="main">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={closePalette} commands={commands} />
    </div>
  )
}
