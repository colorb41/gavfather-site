import Link from 'next/link'
import { notFound } from 'next/navigation'
import ShareButtons from '../../../components/ShareButtons'
import OutlookBadge from '../../../components/OutlookBadge'
import PositionBadge from '../../../components/PositionBadge'
import {
  getAllArticles,
  getArticleBySlug,
  getAdjacentArticles,
  getRelatedArticles,
  renderMarkdown,
  linkPlayerNames,
} from '../../../lib/articles'
import {
  getLatestWeek,
  getTopPlays,
  getRankingsByWeek,
  getYearForWeek,
  formatWeekShort,
} from '../../../lib/rankings'
import { LAUNCH_YEAR } from '../../../lib/site'

export const revalidate = 3600
// Revalidate every hour so scheduled articles
// appear within 1 hour of their publish date

export const dynamic = 'force-dynamic'
// Also add this to ensure fresh data on each request

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }))
}

export function generateMetadata({ params }) {
  const article = getArticleBySlug(params.slug)
  if (!article) return { title: 'Article' }
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      publishedTime: article.date || undefined,
      images: ['/images/og_image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: ['/images/og_image.png'],
    },
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function ArticlePage({ params }) {
  const article = getArticleBySlug(params.slug)
  if (!article) notFound()

  const htmlRaw = await renderMarkdown(article.content)
  const { prev, next } = getAdjacentArticles(params.slug)
  const related = getRelatedArticles(params.slug, 3)

  const week = article.week ?? getLatestWeek()
  const year = week != null ? getYearForWeek(week) : LAUNCH_YEAR
  const offer = week != null ? getTopPlays(week, 3, 'ppr', year) : []
  const board = week != null ? getRankingsByWeek(week, 'ppr', year) : []
  const html = linkPlayerNames(htmlRaw, board)

  return (
    <article>
      <header className="border-b border-gavfather-border bg-gradient-to-b from-gavfather-slate to-gavfather-navy">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {article.theme && (
              <span className="rounded border border-gavfather-gold/40 bg-gavfather-gold/10 px-2.5 py-1 font-bold uppercase tracking-wider text-gavfather-gold">
                {article.theme}
              </span>
            )}
            <span className="text-gavfather-muted">{formatDate(article.date)}</span>
            {article.readTime && (
              <span className="text-gavfather-muted">· {article.readTime}</span>
            )}
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-tight text-gavfather-gold md:text-5xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-4 max-w-3xl text-lg text-gavfather-muted">{article.excerpt}</p>
          )}
          <div className="mt-6">
            <ShareButtons title={article.title} path={`/articles/${article.slug}`} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1fr_300px]">
        <div
          className="prose-gav min-w-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-gavfather-border bg-gavfather-slate p-5">
            <h2 className="font-display text-lg font-semibold tracking-wide text-gavfather-gold">
              THE OFFER
            </h2>
            <p className="mt-1 text-xs text-gavfather-muted">
              Top plays · {week != null ? formatWeekShort(week) : 'Preseason 2026'}
            </p>
            <ul className="mt-4 space-y-3">
              {offer.map((p) => (
                <li
                  key={p.name}
                  className="rounded-lg border border-gavfather-border bg-gavfather-navy/50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gavfather-text">{p.name}</span>
                    <span className="font-mono text-sm text-gavfather-gold">
                      {Number(p.finalScore).toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <PositionBadge position={p.position} />
                    <OutlookBadge outlook={p.outlook} />
                  </div>
                </li>
              ))}
              {!offer.length && (
                <li className="text-sm text-gavfather-muted">No rankings loaded.</li>
              )}
            </ul>
            <Link
              href="/rankings"
              className="mt-4 inline-block text-xs font-medium text-gavfather-gold"
            >
              Full rankings →
            </Link>
          </div>

          {related.length > 0 && (
            <div className="rounded-xl border border-gavfather-border bg-gavfather-slate p-5">
              <h2 className="font-display text-lg font-semibold tracking-wide text-gavfather-gold">
                RELATED ARTICLES
              </h2>
              <ul className="mt-4 space-y-3">
                {related.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/articles/${a.slug}`}
                      className="text-sm font-medium text-gavfather-text transition hover:text-gavfather-gold"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <nav className="border-t border-gavfather-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          {prev ? (
            <Link
              href={`/articles/${prev.slug}`}
              className="group max-w-md text-left"
            >
              <span className="text-[10px] uppercase tracking-wider text-gavfather-muted">
                Previous article
              </span>
              <span className="mt-1 block font-display text-lg text-gavfather-gold group-hover:text-gavfather-gold-light">
                ← {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/articles/${next.slug}`}
              className="group max-w-md text-right md:ml-auto"
            >
              <span className="text-[10px] uppercase tracking-wider text-gavfather-muted">
                Next article
              </span>
              <span className="mt-1 block font-display text-lg text-gavfather-gold group-hover:text-gavfather-gold-light">
                {next.title} →
              </span>
            </Link>
          ) : null}
        </div>
      </nav>
    </article>
  )
}
