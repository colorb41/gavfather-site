'use client'

import { useState } from 'react'
import Link from 'next/link'

const LINKS = [
  { href: '/rankings', label: 'Rankings' },
  { href: '/offers', label: 'Offers' },
  { href: '/articles', label: 'Articles' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gavfather-gold/20 bg-gavfather-navy/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src="/logo.svg"
            alt="The Gavfather"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gavfather-muted transition hover:text-gavfather-gold"
              >
                {link.label} ↗
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gavfather-muted transition hover:text-gavfather-gold"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-gavfather-border p-2 text-gavfather-gold md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-gavfather-border/60 bg-gavfather-navy transition-all duration-300 md:hidden ${
          open ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-2.5 text-sm font-medium text-gavfather-muted hover:bg-gavfather-hover hover:text-gavfather-gold"
                onClick={() => setOpen(false)}
              >
                {link.label} ↗
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-gavfather-muted hover:bg-gavfather-hover hover:text-gavfather-gold"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  )
}
