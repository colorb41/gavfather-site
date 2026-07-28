'use client'

import { useId, useState } from 'react'

export default function StatTooltip({ label, children, className = '' }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        className="cursor-help border-b border-dotted border-gavfather-muted/50 text-left"
      >
        {children}
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-48 -translate-x-1/2 rounded-md border border-gavfather-border bg-gavfather-slate px-2.5 py-2 text-center text-[11px] leading-snug text-gavfather-muted shadow-lift"
        >
          {label}
        </span>
      )}
    </span>
  )
}
