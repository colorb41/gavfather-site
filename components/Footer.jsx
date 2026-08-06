import Link from 'next/link'
import { SOCIAL_X_URL } from '../lib/site'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gavfather-border bg-gavfather-slate">
      <div className="mx-auto max-w-7xl px-4 py-12 text-center md:px-6">
        <p className="font-display text-2xl font-semibold tracking-[0.12em] text-gavfather-gold">
          THE GAVFATHER
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-gavfather-muted">
          Weekly drops announce on X first.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/rankings" className="text-gavfather-muted transition hover:text-gavfather-gold">
            Rankings
          </Link>
          <Link href="/offers" className="text-gavfather-muted transition hover:text-gavfather-gold">
            Offers
          </Link>
          <Link href="/articles" className="text-gavfather-muted transition hover:text-gavfather-gold">
            Articles
          </Link>
          <Link href="/about" className="text-gavfather-muted transition hover:text-gavfather-gold">
            About
          </Link>
          <a
            href={SOCIAL_X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gavfather-muted transition hover:text-gavfather-gold"
          >
            Follow on X
          </a>
        </div>

        <p className="mt-8 text-xs text-gavfather-muted/60">
          © {year} The Gavfather. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
