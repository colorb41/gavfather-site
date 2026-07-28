'use client'

import { useState } from 'react'
import { SITE_URL } from '../lib/site'

/**
 * Share / copy controls. Pass a full path or absolute URL.
 */
export default function ShareButtons({ title, path, label = 'Copy link' }) {
  const [copied, setCopied] = useState(false)
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
      : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(url)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={tweet}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-gavfather-border bg-gavfather-slate px-3 py-1.5 text-xs font-semibold text-gavfather-muted transition hover:border-gavfather-gold/40 hover:text-gavfather-gold"
      >
        Share on X
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-md border border-gavfather-border bg-gavfather-slate px-3 py-1.5 text-xs font-semibold text-gavfather-muted transition hover:border-gavfather-gold/40 hover:text-gavfather-gold"
      >
        {copied ? 'Copied!' : label}
      </button>
    </div>
  )
}
