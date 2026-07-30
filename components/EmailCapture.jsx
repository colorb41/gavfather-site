'use client'

import { useState } from 'react'

export default function EmailCapture({
  title = 'GET THE OFFER EVERY WEEK',
  subtitle = 'Full rankings, sleepers, busts, and data nobody else calculates. Free.',
  className = '',
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const value = email.trim()
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('error')
      setMessage('Enter a valid email.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      // Persist locally until a real list provider is wired
      const key = 'gavfather_waitlist'
      const existing = JSON.parse(
        typeof window !== 'undefined' ? window.localStorage.getItem(key) || '[]' : '[]',
      )
      if (!existing.includes(value.toLowerCase())) {
        existing.push(value.toLowerCase())
        window.localStorage.setItem(key, JSON.stringify(existing))
      }
      setStatus('success')
      setMessage("You're in. Welcome to the family.")
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Try again.')
    }
  }

  return (
    <div className={`mx-auto max-w-xl text-center ${className}`}>
      <h2 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-gavfather-muted">{subtitle}</p>

      {status === 'success' ? (
        <p className="mt-8 font-medium text-gavfather-gold" role="status">
          {message}
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch"
          noValidate
        >
          <label className="sr-only" htmlFor="gavfather-email">
            Email
          </label>
          <input
            id="gavfather-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status === 'error') setStatus('idle')
            }}
            className="min-h-[48px] flex-1 rounded-md border border-gavfather-border bg-gavfather-navy px-4 text-sm text-gavfather-text placeholder:text-gavfather-muted/60 focus:border-gavfather-gold focus:outline-none focus:ring-1 focus:ring-gavfather-gold"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-md bg-gavfather-gold px-6 text-sm font-bold uppercase tracking-widest text-gavfather-navy transition hover:bg-gavfather-gold-light disabled:opacity-60"
          >
            {status === 'loading' ? 'Joining…' : 'Join the Family'}
          </button>
        </form>
      )}

      {status === 'error' && message && (
        <p className="mt-3 text-sm text-gavfather-fade" role="alert">
          {message}
        </p>
      )}
    </div>
  )
}
