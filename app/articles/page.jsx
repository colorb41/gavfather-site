import Link from 'next/link'
import ArticlesIndex from '../../components/ArticlesIndex'
import { getAllArticles } from '../../lib/articles'
import { LAUNCH_YEAR, SOCIAL_X_URL } from '../../lib/site'

export const revalidate = 3600
// Revalidate every hour so scheduled articles
// appear within 1 hour of their publish date

export const dynamic = 'force-dynamic'
// Also add this to ensure fresh data on each request

export const metadata = {
  title: 'Articles',
  description: 'Data-driven fantasy football analysis from The Gavfather.',
}

export default function ArticlesPage() {
  const articles = getAllArticles().map(({ content, ...rest }) => rest)
  const hasLive = articles.some((a) => {
    if (!a.date) return false
    const y = new Date(a.date).getFullYear()
    return Number.isFinite(y) && y >= LAUNCH_YEAR
  })

  if (!articles.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6 md:py-20">
        <h1 className="font-display text-3xl font-semibold tracking-wide text-gavfather-gold md:text-5xl">
          Articles
        </h1>
        <p className="mt-4 text-gavfather-muted">
          Weekly themes and writeups start with the {LAUNCH_YEAR} season. Follow on X so
          you don&apos;t miss the first drop.
        </p>
        <a
          href={SOCIAL_X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-gavfather-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-gavfather-navy transition hover:bg-gavfather-gold-light"
        >
          Follow on X
        </a>
        <div className="mt-6">
          <Link href="/about" className="text-sm text-gavfather-gold hover:text-gavfather-gold-light">
            What is The Gavfather? →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      {!hasLive && (
        <div className="mb-6 rounded-md border border-gavfather-gold/30 bg-gavfather-gold/10 px-4 py-3 text-sm text-gavfather-gold">
          Preview drafts — not published {LAUNCH_YEAR} season content.
        </div>
      )}
      <ArticlesIndex articles={articles} />
    </div>
  )
}
