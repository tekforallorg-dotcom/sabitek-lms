'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

const COLUMNS: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    heading: 'Quick Links',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Courses', href: '/courses' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: '/support' },
      { label: 'Contact Us', href: 'https://tekforall.org/contact', external: true },
      { label: 'FAQs', href: '/faq' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]

const footerLinkClass =
  'inline-block text-sm text-gray-600 hover:text-red-600 transition-all duration-200 hover:translate-x-0.5'

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-b from-white to-rose-50/70">
      {/* gradient hairline */}
      <span
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
        aria-hidden="true"
      />
      {/* soft corner wash + ring decoration */}
      <div className="absolute -bottom-32 -right-24 w-80 h-80 bg-rose-100/60 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 pointer-events-none opacity-60" aria-hidden="true">
        <div className="w-96 h-96 rounded-full border border-rose-200/50" />
        <div className="absolute inset-10 rounded-full border border-rose-200/40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 md:gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-1 mb-3">
              <span className="text-xl font-bold text-gray-900">Sabitek</span>
              <Sparkles className="w-3.5 h-3.5 text-red-500 mb-1.5" />
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
              Your AI-powered and future-ready classroom for every learner.
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Powering institutions, training centers, and verified instructors across Africa.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) =>
                  link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={footerLinkClass}
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link href={link.href} className={footerLinkClass}>
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="relative mt-10 pt-6">
          <span
            className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent"
            aria-hidden="true"
          />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p className="text-center sm:text-left">
              © 2025 Sabitek by TEK4ALL. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:text-red-600 transition-colors">
                About
              </Link>
              <span className="w-1 h-1 rounded-full bg-rose-300" aria-hidden="true" />
              <Link href="/privacy" className="hover:text-red-600 transition-colors">
                Privacy
              </Link>
              <span className="w-1 h-1 rounded-full bg-rose-300" aria-hidden="true" />
              <Link href="/terms" className="hover:text-red-600 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
